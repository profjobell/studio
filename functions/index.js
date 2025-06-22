
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // Required for making HTTP call to Next.js API route

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Configuration check at cold start, outside the request handler.
// This is more efficient as it doesn't run on every single request.
const nextJsApiUrl = process.env.NEXTJS_APP_URL;
if (!nextJsApiUrl) {
  // This error will appear in the Cloud Function logs when it's initialized (cold start)
  // and will cause subsequent invocations to fail until configuration is fixed.
  console.error("FATAL: The NEXTJS_APP_URL environment variable is not configured. The Cloud Function cannot call the Next.js API and will not serve requests.");
}


exports.processSermon = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Check if the configuration was loaded correctly. If not, fail all requests.
  if (!nextJsApiUrl) {
    return res.status(500).json({ 
      error: "AI processing service is critically misconfigured on the server. Please contact the administrator." 
    });
  }

  if (req.method === 'OPTIONS') {
    // Handle preflight requests for CORS
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const aiProcessingEndpoint = `${nextJsApiUrl}/api/isolate-sermon-by-ai`;


  const { transcript: pastedTranscript } = req.body;

  if (!pastedTranscript || typeof pastedTranscript !== 'string' || pastedTranscript.trim() === "") {
    return res.status(400).json({ error: 'Please provide a church service transcript to process.' });
  }

  try {
    const aiResponse = await axios.post(aiProcessingEndpoint, {
      transcript: pastedTranscript,
    });

    if (aiResponse.data) {
      if (aiResponse.data.error) {
        console.error("AI Service returned a functional error:", aiResponse.data.error);
        return res.status(502).json({ error: `AI Processing Error: ${aiResponse.data.error}` });
      }
      
      // Check if 'sermon' and 'prayers' fields are present as expected from a successful AI call
      if (typeof aiResponse.data.sermon !== 'undefined' && Array.isArray(aiResponse.data.prayers)) {
        let responseJson = {
            sermon: aiResponse.data.sermon,
            prayers: aiResponse.data.prayers,
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
    console.error(`Error calling AI processing service at [${aiProcessingEndpoint}]:`, error.message);
    if (error.response) {
      console.error("AI Service Call Failed - Status:", error.response.status);
      console.error("AI Service Call Failed - Data:", error.response.data);
      const errorMessage = error.response.data?.error || error.response.data?.message || "Unknown error from AI service call";
      return res.status(error.response.status || 500).json({ error: `Failed to communicate with AI processing service: ${errorMessage}` });
    }
    return res.status(500).json({ error: `Failed to call AI processing service: ${error.message}. Check if the endpoint is correct and reachable.` });
  }
});
