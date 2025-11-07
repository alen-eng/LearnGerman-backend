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
    // VIBE REBUILD: Initialize the Vertex AI client using the secure Service Account credentials.
    // This bypasses the entire broken API key system.
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_PROJECT_ID,
      location: 'us-central1', // A common, stable location
    });

    // Instantiate the model
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.0-pro', // Using a stable, well-known model name
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
    
    // The SDK provides a clean response, but we still parse it to be safe
    const textResponse = responseData.candidates[0].content.parts[0].text;
    const enrichedData = JSON.parse(textResponse);
    
    res.status(200).json(enrichedData);

  } catch (error) {
    console.error('Vertex AI SDK Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to process request with Vertex AI. See server logs on Vercel.' });
  }
}