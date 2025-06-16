import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with plugins.
// The Google AI plugin will provide default models (e.g., Gemini Flash).
// If a specific model is needed for a particular flow/prompt,
// it can be specified in the `ai.generate()` call or `ai.definePrompt()`'s `config` option,
// or by setting a default in the plugin configuration if available, e.g., googleAI({defaultModel: 'gemini-pro'})
export const ai = genkit({
  plugins: [googleAI()],
  // The 'model' option is not a standard top-level parameter for the genkit() constructor.
  // It's typically handled by the plugin's defaults or specified per-call.
});
