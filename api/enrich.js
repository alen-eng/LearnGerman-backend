// api/enrich.js

// This function is the core of our secure backend.
// It will be deployed as a serverless function on Vercel.

export default async function handler(req, res) {
  // 1. We only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the word from the app's request
  const { word } = req.body;
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'A "word" string is required in the body' });
  }

  // 3. IMPORTANT: Get the API key from environment variables (NEVER hardcode it)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: API key not found' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
  
  // 4. Craft the prompt for the AI model
  const prompt = `
    You are a helpful German language assistant.
    A user has provided the following German word or phrase: "${word}".
    Your task is to correct if any spelling mistakes and provide a structured JSON response.
    The JSON object must have these exact keys:
    - "correctedGerman": The grammatically correct German word or phrase.
    - "englishTranslation": The common English translation.
    - "examples": An array of 3 simple, conversational German sentences using the word, each with its English translation. Each object in the array should have "german" and "english" keys.
    
    Example response for the input "Bibliotek":
    {
      "correctedGerman": "die Bibliothek",
      "englishTranslation": "the library",
      "examples": [
        { "german": "Ich gehe in die Bibliothek.", "english": "I am going to the library." },
        { "german": "Die Bibliothek ist heute geschlossen.", "english": "The library is closed today." },
        { "german": "Wo ist die nächste Bibliothek?", "english": "Where is the next library?" }
      ]
    }

    Now, generate the response for: "${word}".
    Ensure the output is ONLY the JSON object, with no other text or markdown formatting.
  `;

  // 5. Call the Gemini API
  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('Gemini API Error:', errorData);
      return res.status(apiResponse.status).json({ error: 'Failed to fetch data from AI service' });
    }
    
    const responseData = await apiResponse.json();
    
    // 6. Extract and clean the JSON from the AI's response
    const textResponse = responseData.candidates[0].content.parts[0].text;
    const jsonString = textResponse.match(/```json\n([\s\S]*?)\n```/)?.[1] || textResponse;
    const enrichedData = JSON.parse(jsonString);

    // 7. Send the clean JSON back to our mobile app
    res.status(200).json(enrichedData);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}