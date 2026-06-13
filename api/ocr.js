import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const prompt = `
      You are the "Degchi AI Recipe Standardizer". 
      Analyze this image of a handwritten recipe notebook, physical recipe card, or cookbook print.
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
    const parsedData = JSON.parse(textResponse);
    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Gemini Serverless OCR Function Error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
