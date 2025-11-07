// api/enrich.js
import { VertexAI } from '@google-cloud/vertexai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { word } = req.body;
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'A "word" string is required in the body' });
  }

  try {
    // VIBE REBORN: With the correct environment variable `GOOGLE_APPLICATION_CREDENTIALS` set,
    // the SDK authenticates automatically. We don't need to pass the project or location.
    // This is the clean, standard way to do it.
    const vertexAI = new VertexAI();

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.0-pro',
      // We can also add safety settings
      safetySettings: [
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
        },
      ],
    });

    const prompt = `
      You are a helpful German language assistant. A user has provided this German word: "${word}".
      Correct any spelling mistakes and provide a structured JSON response with these exact keys:
      "correctedGerman", "englishTranslation", and an array of 3 "examples".
      Each example object must have "german" and "english" keys.
      Output ONLY the JSON object, without any markdown formatting like \`\`\`json.
    `;

    const resp = await generativeModel.generateContent(prompt);
    const responseData = resp.response;
    
    if (!responseData) {
      console.error("Vertex AI Error: No response data received. Full response:", resp);
      throw new Error("AI model did not return a valid response.");
    }
    
    const textResponse = responseData.candidates[0].content.parts[0].text;
    const enrichedData = JSON.parse(textResponse);
    
    res.status(200).json(enrichedData);

  } catch (error) {
    console.error('Vertex AI SDK Error:', error.message);
    res.status(500).json({ error: 'Failed to process request with Vertex AI. See server logs on Vercel.' });
  }
}