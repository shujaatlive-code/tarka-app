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
      const errText = await response.text();
      console.warn("Vercel serverless OCR returned error response, trying client fallback:", errText);
    }
  } catch (err) {
    console.warn("Failed to reach serverless API endpoint, trying client fallback:", err);
  }

  // 2. Client-side Fallback (if client-side API Key is set and loaded)
  if (apiKey && apiKey !== "mock-api-key") {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imagePart = await fileToGenerativePart(file);

      const prompt = `
        You are the "Degchi AI Recipe Standardizer". 
        Analyze this photo of a handwritten recipe notebook, physical recipe card, or cookbook print.
        1. Transcribe the contents accurately.
        2. Normalize all measurements into standard kitchen metrics (e.g. convert 'dahi' to 'Yogurt', 'tamatar' to 'Tomatoes').
        3. Generate a complete, high-fidelity bilingual representation of the recipe (both English and Urdu).
        4. Translate the title, description, region, cuisine, time, difficulty, ingredients, and instructions.
        
        You MUST respond in strict JSON format with the following keys:
        {
          "titleEn": "...",
          "titleUr": "...",
          "descriptionEn": "...",
          "descriptionUr": "...",
          "ingredientsEn": ["ingredient 1", "ingredient 2"],
          "ingredientsUr": ["ingredient 1", "ingredient 2"],
          "instructionsEn": ["step 1", "step 2"],
          "instructionsUr": ["step 1", "step 2"],
          "regionEn": "...",
          "regionUr": "...",
          "cuisineEn": "...",
          "cuisineUr": "...",
          "timeEn": "...",
          "timeUr": "...",
          "difficultyEn": "Easy" | "Medium" | "Hard",
          "difficultyUr": "آسان" | "درمیانہ" | "مشکل",
          "costTier": "$" | "$$" | "$$$",
          "occasions": ["Occasion 1", "Occasion 2"]
        }
      `;

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              imagePart
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const textResponse = result.response.text();
      return JSON.parse(textResponse);
    } catch (clientErr) {
      console.error("Direct client-side Gemini execution failed:", clientErr);
      throw new Error(`Gemini transcription failed. Serverless failed, Client fallback failed: ${clientErr}`);
    }
  }

  // 3. Absolute Fallback: Return Mock Data
  console.log("No active keys available for live API, returning mock standardized data.");
  return {
    titleEn: "Nanis Chicken Karahi (Standardized)",
    titleUr: "نانی اماں کی چکن کڑاہی (معیاری)",
    descriptionEn: "A traditional chicken Karahi passed down from grandmother, standardized with measurements and formatted in bilingual text.",
    descriptionUr: "دادی اماں کی روایتی چکن کڑاہی، جس کی پیمائش کو یکساں کیا گیا ہے اور دو لسانی متن میں فارمیٹ کیا گیا ہے۔",
    ingredientsEn: ["Chicken", "Tomatoes", "Ginger", "Garlic", "Green Chilies", "Black Pepper", "Oil", "Salt"],
    ingredientsUr: ["چکن", "ٹماٹر", "ادرک", "لہسن", "ہری مرچیں", "کالی مرچ", "تیل", "نمک"],
    instructionsEn: [
      "Chop tomatoes in half. Fry chicken in wok with oil and ginger garlic paste.",
      "Add tomatoes over chicken, cover and steam for 10 minutes until skins loosen.",
      "Remove skin of tomatoes, mash them well, and cook on high heat until dry.",
      "Add freshly ground black pepper and sliced green chilies before serving."
    ],
    instructionsUr: [
      "ٹماٹروں کو درمیان سے آدھا کاٹ لیں۔ کڑاہی میں تیل اور ادرک لہسن کے پیسٹ کے ساتھ چکن فرائی کریں۔",
      "چکن پر ٹماٹر رکھیں، برتن ڈھانپیں اور 10 منٹ تک بھاپ دیں جب تک چھلکے نرم نہ ہو جائیں۔",
      "ٹماٹر کے چھلکے اتاریں، انہیں چمچ سے اچھی طرح میش کریں، اور تیز آنچ پر بھونیں۔",
      "پیش کرنے سے پہلے پسی ہوئی کالی مرچ اور لمبی کٹی ہری مرچیں شامل کریں۔"
    ],
    regionEn: "Lahore",
    regionUr: "لاہور",
    cuisineEn: "Pakistani",
    cuisineUr: "پاکستانی",
    timeEn: "35 mins",
    timeUr: "35 منٹ",
    difficultyEn: "Medium",
    difficultyUr: "درمیانہ",
    costTier: "$$",
    occasions: ["Quick"]
  };
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
