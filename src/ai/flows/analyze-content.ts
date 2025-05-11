'use server';

/**
 * @fileOverview Analyzes user-submitted religious content for theological accuracy, historical context,
 * manipulative tactics, identified "isms", and Calvinistic influence using the Scriptural Sentinel model.
 *
 * - analyzeContent - A function that handles the content analysis process.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContentInputSchema = z.object({
  content: z.string().describe('The religious content to analyze (text, audio transcript, or video transcript).'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
  summary: z.string().describe('A summary of the analysis.'),
  scripturalAnalysis: z.array(z.object({
    verse: z.string(),
    analysis: z.string(),
  })).describe('Verse-by-verse scriptural analysis.'),
  historicalContext: z.string().describe('Historical context of the content.'),
  etymology: z.string().describe('Etymology of key terms used in the content.'),
  exposure: z.string().describe('Potential exposure of the content to harmful ideologies.'),
  fallacies: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).describe('Identified logical fallacies.'),
  manipulativeTactics: z.array(z.object({
    technique: z.string(),
    description: z.string(),
  })).describe('Identified manipulative tactics.'),
  biblicalRemonstrance: z.string().describe('Biblical remonstrance against the content.'),
  identifiedIsms: z.array(z.object({
    ism: z.string(),
    description: z.string(),
    evidence: z.string(),
  })).describe('Identified theological "isms".'),
  calvinismAnalysis: z.array(z.object({
    element: z.string(),
    description: z.string(),
    evidence: z.string(),
    infiltrationTactic: z.string().optional(),
  })).describe('Analysis of Calvinistic influence.'),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}

const analyzeContentPrompt = ai.definePrompt({
  name: 'analyzeContentPrompt',
  input: {schema: AnalyzeContentInputSchema},
  output: {schema: AnalyzeContentOutputSchema},
  prompt: `Analyze the following religious content for theological accuracy, historical context, manipulative tactics, identified "isms", and Calvinistic influence, comparing against the KJV 1611 Bible.\n\nContent: {{{content}}}`,
});

const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async input => {
    const {output} = await analyzeContentPrompt(input);
    return output!;
  }
);
