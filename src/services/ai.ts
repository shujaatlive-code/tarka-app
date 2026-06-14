import { GoogleGenerativeAI } from '@google/generative-ai';

// Base64 helper for image inputs
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SYSTEM_PROMPT = `You are Degchi, a careful multilingual culinary document transcriber. Read the uploaded handwritten or printed recipe image/PDF exactly, including Urdu, Roman Urdu, and English. Identify every distinct recipe visible on the page. Do not invent a family name, title, ingredient, quantity, step, occasion, or cooking time. Translate Urdu into concise English while preserving the original Urdu in Urdu fields. Normalize obvious units (tsp, tbsp, cups, g, kg) but preserve uncertain text in notes and mark confidence low. If a title is absent, use a factual ingredient-based title. Return only valid JSON with this exact shape:
{"recipes":[{"title":"","urduTitle":"","description":"","urduDescription":"","ingredients":[{"name":"","urduName":"","amount":"","category":"Proteins|Vegetables|Spices|Grains|Dairy|Staples"}],"steps":[{"en":"","ur":""}],"cost":"$|$$|$$$","occasion":"Family recipe","timeMinutes":45,"confidence":"high|medium|low","notes":[""]}]}`;

function stripJsonFences(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// 1. Google Gemini 1.5 Flash OCR Transcription
export async function standardizeRecipeWithGemini(file: File): Promise<any> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 1. Try Vercel Serverless Function Proxy First (Avoids Browser CORS Block)
  try {
    const filePart = await fileToGenerativePart(file);
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Data: filePart.inlineData.data,
        mimeType: filePart.inlineData.mimeType
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errText = await response.json();
      console.warn("Vercel serverless OCR returned error response, trying client fallback:", errText);
      // If Vercel API gave a specific error, we propagate its error message
      if (errText && errText.error) {
        throw new Error(errText.error);
      }
    }
  } catch (err) {
    console.warn("Failed to reach serverless API endpoint or API returned error, trying client fallback:", err);
    // If it's a specific validation/API error that we threw in Vercel API, propagate it to skip client fallback
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("could not identify") || errMsg.includes("Ensure the recipe text is visible")) {
      throw err;
    }
  }

  // 2. Client-side Fallback (if client-side API Key is set and loaded)
  if (apiKey && apiKey !== "mock-api-key") {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imagePart = await fileToGenerativePart(file);

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: SYSTEM_PROMPT },
              imagePart
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const textResponse = result.response.text();
      if (!textResponse) {
        throw new Error("No response content from client-side Gemini model.");
      }

      const cleanedText = stripJsonFences(textResponse);
      const parsedData = JSON.parse(cleanedText);

      if (!parsedData || !Array.isArray(parsedData.recipes) || parsedData.recipes.length === 0) {
        throw new Error("No recipes could be identified on this upload. Ensure the recipe text is visible.");
      }

      const rawRecipe = parsedData.recipes[0];

      if (!rawRecipe.ingredients || !Array.isArray(rawRecipe.ingredients) || rawRecipe.ingredients.length === 0) {
        throw new Error("The handwriting scanner could not identify any ingredients. Try cropping to focus on the recipe list.");
      }
      if (!rawRecipe.steps || !Array.isArray(rawRecipe.steps) || rawRecipe.steps.length === 0) {
        throw new Error("The handwriting scanner could not identify any cooking steps. Try a clearer image.");
      }

      // Map Lovable schema to frontend Tarka schema
      const mappedRecipe = {
        titleEn: rawRecipe.title || "Untitled Scanned Recipe",
        titleUr: rawRecipe.urduTitle || rawRecipe.title || "بغیر عنوان کی ترکیب",
        descriptionEn: rawRecipe.description || "Recipe transcribed from the uploaded note.",
        descriptionUr: rawRecipe.urduDescription || rawRecipe.description || "ترکیب اپ لوڈ کردہ نوٹ سے نقل کی گئی ہے۔",
        ingredientsEn: rawRecipe.ingredients.map((i: any) => {
          const amt = i.amount ? i.amount.trim() : "";
          const name = i.name ? i.name.trim() : "";
          return amt ? `${amt} ${name}` : name;
        }).filter(Boolean),
        ingredientsUr: rawRecipe.ingredients.map((i: any) => {
          const amt = i.amount ? i.amount.trim() : "";
          const name = (i.urduName || i.name || "").trim();
          return amt ? `${amt} ${name}` : name;
        }).filter(Boolean),
        instructionsEn: rawRecipe.steps.map((s: any) => (s.en || "").trim()).filter(Boolean),
        instructionsUr: rawRecipe.steps.map((s: any) => (s.ur || s.en || "").trim()).filter(Boolean),
        regionEn: "Punjab",
        regionUr: "پنجاب",
        cuisineEn: "Pakistani",
        cuisineUr: "پاکستانی",
        timeEn: `${rawRecipe.timeMinutes || 45} mins`,
        timeUr: `${rawRecipe.timeMinutes || 45} منٹ`,
        difficultyEn: rawRecipe.confidence === 'high' ? 'Easy' : rawRecipe.confidence === 'medium' ? 'Medium' : 'Hard',
        difficultyUr: rawRecipe.confidence === 'high' ? 'آسان' : rawRecipe.confidence === 'medium' ? 'درمیانہ' : 'مشکل',
        costTier: ["$", "$$", "$$$"].includes(rawRecipe.cost) ? rawRecipe.cost : "$$",
        occasions: [rawRecipe.occasion || "Family Recipe"]
      };

      return mappedRecipe;
    } catch (clientErr) {
      console.error("Direct client-side Gemini execution failed:", clientErr);
      throw new Error(`Gemini transcription failed: ${clientErr instanceof Error ? clientErr.message : String(clientErr)}`);
    }
  }

  // If we reach here, both routes failed (or keys are missing)
  throw new Error("Recipe analysis is not configured yet. Gemini API key is missing.");
}

// 2. Unsplash Food Cover Photo Finder
export async function fetchRecipeCoverPhoto(keyword: string): Promise<string> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey === "mock-api-key") {
    // If no Unsplash key is configured, return local fallback image
    return 'mediterranean_hummus.png';
  }

  try {
    const query = encodeURIComponent(`${keyword} food plating`);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`
      }
    });

    if (!response.ok) throw new Error("Unsplash API rate-limit or error");
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (err) {
    console.error("Unsplash fetch failed, falling back to local placeholder:", err);
  }

  return 'mediterranean_hummus.png';
}
