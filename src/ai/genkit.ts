import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with plugins.
// To use Meta's Llama models, we configure the googleAI plugin
// to point to the Vertex AI platform, where these models are hosted.
export const ai = genkit({
  plugins: [
    googleAI({
      // Configure for Vertex AI
      location: 'us-central1', // A common GCP region
      // Set the default model to Llama 3.1 405B Instruct
      defaultModel: 'llama3-1-405b-instruct',
    }),
  ],
});
