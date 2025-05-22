
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

  // --- Call Next.js API route that uses the Genkit AI flow ---
  // IMPORTANT: Replace YOUR_NEXTJS_APP_BASE_URL with the actual deployed URL of your Next.js app
  // For local development, this might be 'http://localhost:9002' or similar.
  // For Firebase Hosting with Next.js integration, this would be your Firebase Hosting URL.
  // It's best to set this as a Firebase Function environment variable (e.g., process.env.NEXTJS_APP_URL).
  const nextJsApiUrl = process.env.NEXTJS_APP_URL || 'YOUR_NEXTJS_APP_BASE_URL_NOT_CONFIGURED';
  if (nextJsApiUrl === 'YOUR_NEXTJS_APP_BASE_URL_NOT_CONFIGURED') {
    console.error("NEXTJS_APP_URL environment variable is not set. Cannot call AI processing service.");
    // Return a 500 Internal Server Error, as this is a server configuration issue.
    return res.status(500).json({ error: "AI processing service endpoint is not configured on the server. Please check function environment variables." });
  }
  const aiProcessingEndpoint = `${nextJsApiUrl}/api/isolate-sermon-by-ai`;


  try {
    const transcriptToProcess = pastedTranscript; // The AI flow will handle everything.

    const aiResponse = await axios.post(aiProcessingEndpoint, {
      transcript: transcriptToProcess,
    });

    // The AI service is expected to return JSON like: { sermon: "isolated sermon text", warning?: "..." }
    // or { error: "some error message from AI" }
    if (aiResponse.data && (aiResponse.data.sermon || aiResponse.data.error)) {
      let responseJson = {
        sermon: aiResponse.data.sermon || "No sermon content identified by AI.", // Default if sermon is null/undefined
        status: "ready for clipboard"
      };
      if (aiResponse.data.warning) {
        responseJson.warning = aiResponse.data.warning;
      }
      
      // If the AI service itself explicitly returns an error field
      if (aiResponse.data.error) {
        console.error("AI Service returned an error:", aiResponse.data.error);
        // Return a 502 (Bad Gateway) if the AI service signals a problem.
        return res.status(502).json({ error: `AI Processing Error: ${aiResponse.data.error}` });
      }
      return res.status(200).json(responseJson);

    } else {
      console.error("AI service returned an unexpected response format:", aiResponse.data);
      return res.status(502).json({ error: "AI service returned an unexpected response format." }); // 502 Bad Gateway
    }

  } catch (error) {
    console.error("Error calling AI processing service:", error.message);
    if (error.response) {
        // This block handles errors from the HTTP request to the Next.js API itself (e.g., Next.js app is down, or that API route 404s)
        console.error("AI Service Call Failed - Response Data:", error.response.data);
        console.error("AI Service Call Failed - Response Status:", error.response.status);
        const errorMessage = error.response.data?.error || error.response.data?.message || error.message || "Unknown error from AI service call";
        return res.status(error.response.status || 500).json({ error: `Failed to communicate with AI processing service: ${errorMessage}` });
    }
    // Generic error if the request to AI service didn't even get a response object (e.g., network issue, DNS, nextJsApiUrl is totally invalid)
    return res.status(500).json({ error: `Failed to call AI processing service: ${error.message}. Check if the API endpoint [${aiProcessingEndpoint}] is correct and reachable.` });
  }
});
