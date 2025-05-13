'use server';
/**
 * @fileOverview Analyzes a specific teaching/philosophy/saying against the KJV 1611 Bible.
 * Provides church history context, details on promoters/demonstrators, relevant church council decisions,
 * a scripturally grounded letter of clarification/caution, and biblical warnings about false teachers.
 *
 * - analyzeTeachingAgainstKJV - A function that handles the teaching analysis process.
 * - AnalyzeTeachingInput - The input type for the analyzeTeachingAgainstKJV function.
 * - AnalyzeTeachingOutput - The return type for the analyzeTeachingAgainstKJV function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTeachingInputSchema = z.object({
  teaching: z.string().min(10, "Teaching text must be at least 10 characters.")
    .describe('The teaching, philosophy, or saying to be analyzed.'),
  recipientNameTitle: z.string().min(3, "Recipient details must be provided.")
    .describe('Name and title of the person to whom the letter of clarification will be addressed (e.g., Pastor John Doe).'),
  tonePreference: z.enum(['gentle', 'firm', 'urgent'])
    .describe('The desired tone for the letter of clarification.'),
  additionalNotes: z.string().optional()
    .describe('Optional additional notes or context provided by the user about the teaching.'),
});

const AnalyzeTeachingOutputSchema = z.object({
  churchHistoryContext: z.string()
    .describe("A summary (around 200-300 words) of the teaching's historical emergence, key events associated with it, and how it has been generally accepted or rejected within broader church history, all from a KJV 1611 scriptural perspective."),
  promotersDemonstrators: z.array(z.object({
    name: z.string().describe("Name of the historical figure, modern pastor, or group."),
    description: z.string().describe("A brief description (around 100-150 words) of their role in promoting or demonstrating the teaching.")
  })).describe("A list of key individuals or groups known for promoting or demonstrating the teaching."),
  churchCouncilSummary: z.string()
    .describe("A summary (around 150-200 words) of any relevant decisions made by major church councils (e.g., Nicaea, Chalcedon, Trent) regarding the teaching or doctrines very similar to it. If no direct council decisions exist, this should be noted. The summary should align with a KJV 1611 understanding."),
  letterOfClarification: z.string()
    .describe("A letter (around 500-700 words) addressed to the specified recipient. The letter must: Start with 'Dear [Recipient Name and Title]'. Cite Galatians 6:1 and 2 Timothy 4:2 (KJV 1611) as a mandate for correcting error. Analyze the teaching, identifying its contradictions with KJV 1611 scriptures (e.g., for prosperity gospel, use 1 Timothy 6:5-10, Matthew 6:24 KJV). Issue cautions using Galatians 1:6-9, 1 Timothy 1:3-7, and 2 Timothy 2:16-18 (KJV). Include a call to repentance referencing Acts 3:19 and 2 Corinthians 7:10 (KJV). Conclude by offering dialogue and expressing hope for restoration. The tone MUST strictly adhere to the user's specified preference (gentle, firm, or urgent)."),
  biblicalWarnings: z.string()
    .describe("A dedicated section (around 100-150 words) that restates clear biblical warnings about false teachers and erroneous doctrines, primarily quoting KJV 1611 scriptures such as Galatians 1:6-9, 1 Timothy 1:3-7, 2 Timothy 2:16-18, and James 3:1.")
});

export type AnalyzeTeachingInput = z.infer<typeof AnalyzeTeachingInputSchema>;
export type AnalyzeTeachingOutput = z.infer<typeof AnalyzeTeachingOutputSchema>;

export async function analyzeTeachingAgainstKJV(input: AnalyzeTeachingInput): Promise<AnalyzeTeachingOutput> {
  return analyzeTeachingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTeachingPromptKJV',
  input: {schema: AnalyzeTeachingInputSchema},
  output: {schema: AnalyzeTeachingOutputSchema},
  prompt: `You are a theological scholar specializing in the KJV 1611 Bible and church history.
Analyze the provided teaching based *exclusively* on the KJV 1611 Bible and historical facts aligned with a KJV 1611 perspective.

Teaching to Analyze: {{{teaching}}}
Recipient for Letter: {{{recipientNameTitle}}}
Desired Tone for Letter: {{{tonePreference}}}
Additional User Notes: {{#if additionalNotes}}{{{additionalNotes}}}{{else}}None provided.{{/if}}

Produce the following analysis components:

1.  **Church History Context**: Summary (200-300 words) of the teaching's historical emergence, key events, and church acceptance/rejection from a KJV 1611 perspective.
2.  **Promoters/Demonstrators**: List key figures/groups (with 100-150 word descriptions each) who promoted/demonstrated this teaching.
3.  **Church Council Summary**: Summarize (150-200 words) relevant major church council decisions (e.g., Nicaea, Chalcedon) concerning this teaching, or note if none exist, from a KJV 1611 viewpoint.
4.  **Letter of Clarification**: Write a letter (500-700 words) to "{{{recipientNameTitle}}}" with a "{{{tonePreference}}}" tone. The letter must:
    *   Start with "Dear {{{recipientNameTitle}}},".
    *   Cite KJV 1611 Galatians 6:1 and 2 Timothy 4:2 for the mandate to correct error.
    *   Analyze the teaching, identifying contradictions with KJV 1611 scriptures. For example, if it's about prosperity, use KJV 1 Timothy 6:5-10, Matthew 6:24.
    *   Warn using KJV Galatians 1:6-9, 1 Timothy 1:3-7, 2 Timothy 2:16-18.
    *   Call to repentance using KJV Acts 3:19, 2 Corinthians 7:10.
    *   Offer dialogue and hope for restoration.
    *   The tone must strictly be {{{tonePreference}}}.
5.  **Biblical Warnings**: A section (100-150 words) restating warnings about false teachers, quoting KJV 1611 scriptures like Galatians 1:6-9, 1 Timothy 1:3-7, 2 Timothy 2:16-18, James 3:1.

Ensure all scriptural references are from the KJV 1611. Be precise and thorough.
`,
});

const analyzeTeachingFlow = ai.defineFlow(
  {
    name: 'analyzeTeachingFlowKJV',
    inputSchema: AnalyzeTeachingInputSchema,
    outputSchema: AnalyzeTeachingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Analysis failed to generate an output.");
    }
    return output;
  }
);
