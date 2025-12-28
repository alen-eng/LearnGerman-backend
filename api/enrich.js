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
    // 1. PREPARE CREDENTIALS
    // Vercel environment variables often escape newlines in private keys, 
    // so we must replace literal "\n" with actual newlines.
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // 2. INITIALIZE VERTEX AI WITH EXPLICIT CREDENTIALS
    // Instead of looking for a file, we pass the object directly.
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
      },
    });

    // 3. MODEL CONFIGURATION
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.0-pro', 
      generationConfig: {
        // Optional: Force simpler output, though 1.0-pro doesn't strictly support responseMimeType: application/json like 1.5 does
        maxOutputTokens: 500,
        temperature: 0.2, // Lower temperature for more deterministic/correct JSON
      },
    });

    const prompt = `
      You are a helpful German language assistant. A user has provided this German word: "${word}".
      Correct any spelling mistakes and provide a structured JSON response with these exact keys:
      "correctedGerman", "englishTranslation", and an array of 3 "examples".
      Each example object must have "german" and "english" keys.
      IMPORTANT: Output ONLY valid JSON. Do not wrap in markdown like \`\`\`json.
    `;

    const resp = await generativeModel.generateContent(prompt);
    const responseData = resp.response;
    
    if (!responseData || !responseData.candidates || responseData.candidates.length === 0) {
      throw new Error("AI model did not return a valid candidate.");
    }
    
    // 4. ROBUST PARSING
    // Even with instructions, AI sometimes adds markdown blocks. We clean them.
    let textResponse = responseData.candidates[0].content.parts[0].text;
    
    // Remove markdown code blocks if present (```json ... ```)
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const enrichedData = JSON.parse(textResponse);
    
    res.status(200).json(enrichedData);

  } catch (error) {
    console.error('Vertex AI SDK Error:', error); // Log the full error object
    res.status(500).json({ 
      error: 'Failed to process request.', 
      details: error.message // Return specific message for easier debugging
    });
  }
}
