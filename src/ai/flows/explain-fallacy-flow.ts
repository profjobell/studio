'use server';
/**
 * @fileOverview Provides explanations for logical fallacies.
 *
 * - explainFallacy - A function that returns a detailed explanation of a fallacy.
 * - ExplainFallacyInput - The input type for the explainFallacy function.
 * - ExplainFallacyOutput - The return type for the explainFallacy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFallacyInputSchema = z.object({
  fallacyName: z.string().optional().describe("The specific fallacy to explain. If empty, provide a general introduction to fallacies or a random common fallacy."),
});
export type ExplainFallacyInput = z.infer<typeof ExplainFallacyInputSchema>;

const ExplainFallacyOutputSchema = z.object({
  fallacyName: z.string().describe("The name of the fallacy explained (or 'General Introduction')."),
  explanation: z.string().describe("A detailed explanation of the fallacy: what it is, common characteristics."),
  examples: z.array(z.string()).describe("Clear examples of the fallacy in use."),
  howToSpot: z.string().describe("Tips and common indicators for identifying this fallacy."),
  howToCounter: z.string().describe("Strategies and approaches to effectively counter this fallacy when encountered."),
});
export type ExplainFallacyOutput = z.infer<typeof ExplainFallacyOutputSchema>;

export async function explainFallacy(input: ExplainFallacyInput): Promise<ExplainFallacyOutput> {
  return explainFallacyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFallacyPrompt',
  input: {schema: ExplainFallacyInputSchema},
  output: {schema: ExplainFallacyOutputSchema},
  prompt: `You are an expert in logic and critical thinking, specializing in logical fallacies.
Your goal is to provide a clear, comprehensive, and helpful explanation of the requested fallacy.
If no specific fallacyName is provided, explain a common fallacy like "Ad Hominem" or "Straw Man".

Fallacy to explain: {{{fallacyName}}}

Please provide:
1.  **Fallacy Name**: Confirm the name of the fallacy.
2.  **Explanation**: Clearly define what the fallacy is.
3.  **Examples**: Provide at least two distinct examples of this fallacy in common language or argument.
4.  **How to Spot**: Offer practical tips or common indicators that help identify this fallacy.
5.  **How to Counter**: Suggest effective ways to respond to or counter this fallacy when encountered in a discussion or argument.

Ensure the language is accessible but accurate.
`,
});

const explainFallacyFlow = ai.defineFlow(
  {
    name: 'explainFallacyFlow',
    inputSchema: ExplainFallacyInputSchema,
    outputSchema: ExplainFallacyOutputSchema,
  },
  async (input) => {
    // If no fallacyName, pick a common one for demonstration.
    // In a real app, you might have a predefined list or let the AI choose randomly.
    const effectiveInput = (input.fallacyName && input.fallacyName.trim() !== "")
      ? input
      : { fallacyName: "Ad Hominem" };

    const {output} = await prompt(effectiveInput);
    if (!output) {
      throw new Error('AI failed to generate an explanation for the fallacy.');
    }
    return output;
  }
);
