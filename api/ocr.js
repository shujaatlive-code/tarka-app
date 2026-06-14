import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are Degchi, a careful multilingual culinary document transcriber. Read the uploaded handwritten or printed recipe image/PDF exactly, including Urdu, Roman Urdu, and English. Identify every distinct recipe visible on the page. Do not invent a family name, title, ingredient, quantity, step, occasion, or cooking time. Translate Urdu into concise English while preserving the original Urdu in Urdu fields. Normalize obvious units (tsp, tbsp, cups, g, kg) but preserve uncertain text in notes and mark confidence low. If a title is absent, use a factual ingredient-based title. Return only valid JSON with this exact shape:
{"recipes":[{"title":"","urduTitle":"","description":"","urduDescription":"","ingredients":[{"name":"","urduName":"","amount":"","category":"Proteins|Vegetables|Spices|Grains|Dairy|Staples"}],"steps":[{"en":"","ur":""}],"cost":"$|$$|$$$","occasion":"Family recipe","timeMinutes":45,"confidence":"high|medium|low","notes":[""]}]}`;

function stripJsonFences(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock-api-key") {
    return res.status(500).json({ error: 'Gemini API key is not configured on Vercel environment' });
  }

  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Data or mimeType in request body' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const textResponse = result.response.text();
    if (!textResponse) {
      throw new Error("No text response was received from the Gemini AI service.");
    }

    const cleanedText = stripJsonFences(textResponse);
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini output as JSON. Raw text:", textResponse);
      throw new Error("The handwriting was read, but the result was in an incomplete format. Try a brighter, straighter photo.");
    }

    // Validate structure
    if (!parsedData || !Array.isArray(parsedData.recipes) || parsedData.recipes.length === 0) {
      throw new Error("No recipes could be identified on this upload. Ensure the recipe text is visible.");
    }

    const rawRecipe = parsedData.recipes[0];
    
    // Validate required fields
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
      ingredientsEn: rawRecipe.ingredients.map(i => {
        const amt = i.amount ? i.amount.trim() : "";
        const name = i.name ? i.name.trim() : "";
        return amt ? `${amt} ${name}` : name;
      }).filter(Boolean),
      ingredientsUr: rawRecipe.ingredients.map(i => {
        const amt = i.amount ? i.amount.trim() : "";
        const name = (i.urduName || i.name || "").trim();
        return amt ? `${amt} ${name}` : name;
      }).filter(Boolean),
      instructionsEn: rawRecipe.steps.map(s => (s.en || "").trim()).filter(Boolean),
      instructionsUr: rawRecipe.steps.map(s => (s.ur || s.en || "").trim()).filter(Boolean),
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

    return res.status(200).json(mappedRecipe);
  } catch (error) {
    console.error('Gemini Serverless OCR Function Error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
