
'use server';
/**
 * @fileOverview Analyzes prayer content for KJV alignment and manipulative language.
 *
 * - analyzePrayersInText - Identifies and analyzes prayers within a given text.
 * - PrayerAnalysisInput - The input type.
 * - PrayerAnalysisOutput - The return type (array of analyses).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SinglePrayerAnalysisSchema = z.object({
  identifiedPrayerText: z.string().describe("The exact text of the prayer identified in the content."),
  kjvAlignmentAssessment: z.string().describe("Assessment of the prayer's alignment with KJV 1611 principles (e.g., how God is addressed, themes, requests, doctrinal soundness based on KJV)."),
  manipulativeLanguage: z.object({
    hasPotentiallyManipulativeElements: z.boolean().describe("True if potentially manipulative language, guilt-tripping, shaming, or other subtle 'influencings' are detected."),
    evidence: z.array(z.string()).optional().describe("Specific quotes from the prayer text that demonstrate manipulative elements."),
    description: z.string().optional().describe("Detailed description of the manipulative tactics observed."),
  }).describe("Analysis of manipulative language within the prayer."),
  overallAssessment: z.string().describe("A summary of the prayer's theological soundness from a KJV 1611 perspective and any potential concerns regarding its content or implied theology."),
});

const PrayerAnalysisInputSchema = z.object({
  textContent: z.string().min(10, "Text content must be at least 10 characters.").describe("The full text content (e.g., sermon transcript) which may contain one or more prayers to be analyzed."),
});
export type PrayerAnalysisInput = z.infer<typeof PrayerAnalysisInputSchema>;

const PrayerAnalysisOutputSchema = z.array(SinglePrayerAnalysisSchema).describe("An array of analyses, one for each prayer identified in the text content. If no prayers are found, an empty array should be returned.");
export type PrayerAnalysisOutput = z.infer<typeof PrayerAnalysisOutputSchema>;


export async function analyzePrayersInText(input: PrayerAnalysisInput): Promise<PrayerAnalysisOutput> {
  return analyzePrayerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePrayerPrompt',
  input: {schema: PrayerAnalysisInputSchema},
  output: {schema: PrayerAnalysisOutputSchema},
  prompt: `You are an expert theologian specializing in the KJV 1611 Bible and discerning subtle textual influences.
Your task is to:
1.  Identify any distinct prayer(s) within the provided 'textContent'. A prayer typically involves direct address to a divine entity (e.g., "Lord," "Father," "God"), expressions of praise, confession, thanksgiving, or supplication.
2.  For each prayer identified, conduct the following analysis based STRICTLY on KJV 1611 principles:
    a.  **KJV Alignment Assessment**: Evaluate how the prayer aligns with KJV 1611 theology. Consider how God is addressed, the nature of requests, theological implications of statements, and overall doctrinal soundness.
    b.  **Manipulative Language Analysis**:
        i.  Determine if there is evidence of manipulative wording, guilt-tripping, shaming, or other subtle 'influencings' aimed at the listeners or the divine.
        ii. Provide specific textual evidence (quotes) if such elements are found.
        iii.Describe the manipulative tactics observed.
    c.  **Overall Assessment**: Summarize the prayer's theological soundness from a KJV 1611 perspective and highlight any concerns.

If multiple distinct prayers are found, provide a separate analysis object for each. If no prayers are clearly identifiable, return an empty array.

textContent to analyze:
{{{textContent}}}

Focus on direct prayer language. Exclude sermonizing around prayers unless it's part of the prayer itself.
The KJV 1611 is the final authority for all scriptural and theological references.
Ensure your response is a valid JSON array conforming to the PrayerAnalysisOutputSchema.
`,
});

const analyzePrayerFlow = ai.defineFlow(
  {
    name: 'analyzePrayerFlow',
    inputSchema: PrayerAnalysisInputSchema,
    outputSchema: PrayerAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || []; // Ensure an empty array is returned if output is null/undefined
  }
);
