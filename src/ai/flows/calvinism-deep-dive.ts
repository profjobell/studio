// This is an AI-generated file. Do not edit.
'use server';

/**
 * @fileOverview Provides an in-depth analysis of Calvinistic elements in user-submitted content.
 *
 * - calvinismDeepDive - A function that initiates the deep-dive analysis.
 * - CalvinismDeepDiveInput - The input type for the calvinismDeepDive function.
 * - CalvinismDeepDiveOutput - The return type for the calvinismDeepDive function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalvinismDeepDiveInputSchema = z.object({
  content: z.string().describe('The content to analyze for Calvinistic elements.'),
});
export type CalvinismDeepDiveInput = z.infer<typeof CalvinismDeepDiveInputSchema>;

const CalvinismDeepDiveOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A detailed analysis of Calvinistic elements present in the content.'),
});
export type CalvinismDeepDiveOutput = z.infer<typeof CalvinismDeepDiveOutputSchema>;

export async function calvinismDeepDive(input: CalvinismDeepDiveInput): Promise<CalvinismDeepDiveOutput> {
  return calvinismDeepDiveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calvinismDeepDivePrompt',
  input: {schema: CalvinismDeepDiveInputSchema},
  output: {schema: CalvinismDeepDiveOutputSchema},
  prompt: `You are a theological expert specializing in Calvinism.
  Analyze the following content for Calvinistic elements, providing a detailed analysis.

  Content: {{{content}}}
  \n  Provide a detailed report that will be shown to the user.
  `,
});

const calvinismDeepDiveFlow = ai.defineFlow(
  {
    name: 'calvinismDeepDiveFlow',
    inputSchema: CalvinismDeepDiveInputSchema,
    outputSchema: CalvinismDeepDiveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
