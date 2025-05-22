
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // Required for making HTTP call to Next.js API route

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- Timestamp Removal Function (can be kept if pre-processing before sending to AI is desired, or removed if AI handles it) ---
function removeTimestamps(text) {
  if (!text) return "";
  // Simple regex for common timestamp patterns, AI will handle more complex cases.
  const timestampRegex = /(\[\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*\]|^\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*(?=\s|\w|$))/gm;
  let cleanedText = text.replace(timestampRegex, '');
  cleanedText = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
  return cleanedText;
}

// --- Main Cloud Function ---
exports.processSermon = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity, restrict in production
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Handle preflight requests for CORS
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { transcript: pastedTranscript } = req.body;

  if (!pastedTranscript || typeof pastedTranscript !== 'string' || pastedTranscript.trim() === "") {
    return res.status(400).json({ error: 'Please provide a church service transcript to process.' });
  }

  // --- Call Next.js API route that uses the Genkit AI flow ---
  // IMPORTANT: Replace YOUR_NEXTJS_APP_BASE_URL with the actual deployed URL of your Next.js app
  // For local development, this might be 'http://localhost:9002' or similar.
  // For Firebase Hosting with Next.js integration, this would be your Firebase Hosting URL.
  const nextJsApiUrl = process.env.NEXTJS_APP_URL || 'YOUR_NEXTJS_APP_BASE_URL_NOT_CONFIGURED'; 
  if (nextJsApiUrl === 'YOUR_NEXTJS_APP_BASE_URL_NOT_CONFIGURED') {
    console.error("NEXTJS_APP_URL environment variable is not set. Cannot call AI processing service.");
    return res.status(500).json({ error: "AI processing service endpoint is not configured." });
  }
  const aiProcessingEndpoint = `${nextJsApiUrl}/api/isolate-sermon-by-ai`;


  try {
    // Optional: Pre-clean timestamps before sending to AI if desired,
    // or let the AI handle it based on its prompt.
    // const transcriptForAI = removeTimestamps(pastedTranscript);
    const transcriptForAI = pastedTranscript; // Send raw transcript to AI

    const aiResponse = await axios.post(aiProcessingEndpoint, {
      transcript: transcriptForAI,
    });

    // The AI service is expected to return JSON like: { sermon: "isolated sermon text" }
    // or { error: "some error message" }
    if (aiResponse.data && aiResponse.data.sermon) {
      let sermonText = aiResponse.data.sermon;
      let warningMessage = ""; // AI flow can potentially set this too

      // Check for incomplete transcript warning from AI or based on original
      if (aiResponse.data.warning || pastedTranscript.includes("[Transcript ends abruptly]")) {
        warningMessage = aiResponse.data.warning || "Transcript may be incomplete";
      }
      
      const responseJson = {
        sermon: sermonText,
        status: "ready for clipboard"
      };
      if (warningMessage) {
        responseJson.warning = warningMessage;
      }
      return res.status(200).json(responseJson);

    } else if (aiResponse.data && aiResponse.data.error) {
      return res.status(500).json({ error: `AI Processing Error: ${aiResponse.data.error}` });
    } else {
      return res.status(500).json({ error: "AI service returned an unexpected response format." });
    }

  } catch (error) {
    console.error("Error calling AI processing service:", error.message);
    if (error.response) {
        console.error("AI Service Response Error Data:", error.response.data);
        console.error("AI Service Response Error Status:", error.response.status);
        return res.status(error.response.status || 500).json({ error: `Failed to process sermon via AI: ${error.response.data.error || error.message}` });
    }
    return res.status(500).json({ error: `Failed to process sermon via AI: ${error.message}` });
  }
});

