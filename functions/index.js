
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // Required for making HTTP call to Next.js API route

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

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

  const nextJsApiUrl =
    process.env.NEXTJS_APP_URL ||                // 2nd-gen Cloud Functions, or local .env file
    functions.config()?.nextjs?.app_url ||       // 1st-gen Cloud Functions runtime config
    'YOUR_NEXTJS_APP_BASE_URL_NOT_CONFIGURED';   // Fallback if nothing is set

  if (nextJsApiUrl.includes('NOT_CONFIGURED') || !nextJsApiUrl) {
    console.error("FATAL: NEXTJS_APP_URL (or functions.config().nextjs.app_url for 1st gen) is not configured. The Cloud Function cannot call the Next.js API.");
    return res.status(500).json({ error: "AI processing service endpoint is not configured on the server. Please check function environment variables (NEXTJS_APP_URL or nextjs.app_url)." });
  }
  const aiProcessingEndpoint = `${nextJsApiUrl}/api/isolate-sermon-by-ai`;


  try {
    const transcriptToProcess = pastedTranscript; 

    const aiResponse = await axios.post(aiProcessingEndpoint, {
      transcript: transcriptToProcess,
    });

    // The AI service is expected to return JSON like: { sermon: "text", prayers: [{prayer: "text"}, ...], warning?: "..." }
    // or { error: "some error message from AI" }
    if (aiResponse.data) {
        if (aiResponse.data.error) {
            console.error("AI Service returned an error:", aiResponse.data.error);
            return res.status(502).json({ error: `AI Processing Error: ${aiResponse.data.error}` });
        }
        
        // Check if 'sermon' and 'prayers' fields are present as expected from a successful AI call
        if (typeof aiResponse.data.sermon !== 'undefined' && Array.isArray(aiResponse.data.prayers)) {
            let responseJson = {
                sermon: aiResponse.data.sermon, // Allow empty string or "No sermon..." message
                prayers: aiResponse.data.prayers, // Will be an array, possibly empty
                status: "ready for clipboard"
            };
            if (aiResponse.data.warning) {
                responseJson.warning = aiResponse.data.warning;
            }
            return res.status(200).json(responseJson);
        } else {
            console.error("AI service returned an unexpected response format (missing sermon/prayers):", aiResponse.data);
            return res.status(502).json({ error: "AI service returned an unexpected response format." });
        }
    } else {
        console.error("AI service returned no data in its response body.");
        return res.status(502).json({ error: "AI service returned an empty response." });
    }

  } catch (error) {
    console.error("Error calling AI processing service:", error.message);
    if (error.response) {
        console.error("AI Service Call Failed - Response Data:", error.response.data);
        console.error("AI Service Call Failed - Response Status:", error.response.status);
        const errorMessage = error.response.data?.error || error.response.data?.message || error.message || "Unknown error from AI service call";
        return res.status(error.response.status || 500).json({ error: `Failed to communicate with AI processing service: ${errorMessage}` });
    }
    return res.status(500).json({ error: `Failed to call AI processing service: ${error.message}. Check if the API endpoint [${aiProcessingEndpoint}] is correct and reachable.` });
  }
});
