
'use server';
/**
 * @fileOverview Provides an alternate, more detailed prayer analysis based on KJV principles.
 *
 * - alternatePrayerAnalysisFlow - A function that performs the detailed prayer analysis.
 * - AlternatePrayerAnalysisInput - The input type.
 * - AlternatePrayerAnalysisOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VirtueSignallingItemSchema = z.object({
  quote: z.string().describe("The specific quote identified as virtue signalling."),
  analysis: z.string().describe("Explanation why this quote is considered virtue signalling."),
});

const ManipulativePhrasingItemSchema = z.object({
  quote: z.string().describe("The specific quote identified."),
  analysis: z.string().describe("Explanation of the manipulative aspect."),
  type: z.enum(['Gaslighting', 'Manipulative Phrasing']).describe("The type of manipulation."),
});

export const AlternatePrayerAnalysisInputSchema = z.object({
  prayerText: z.string().describe("The prayer text to be analyzed."),
});
export type AlternatePrayerAnalysisInput = z.infer<typeof AlternatePrayerAnalysisInputSchema>;

export const AlternatePrayerAnalysisOutputSchema = z.object({
  overallSummary: z.string().describe("A concise summary of the findings."),
  virtueSignalling: z.object({
    items: z.array(VirtueSignallingItemSchema).describe("Specific instances of virtue signalling found."),
    assessment: z.string().describe("Overall assessment of virtue signalling in the prayer."),
  }),
  manipulativePhrasing: z.object({
    items: z.array(ManipulativePhrasingItemSchema).describe("Specific instances of gaslighting or manipulative phrasing."),
    assessment: z.string().describe("Overall assessment of such tactics in the prayer."),
  }),
  kjvComparison: z.object({
    alignmentWithScripturalPrinciples: z.string().describe("Discussion of alignment with KJV prayer principles (humility, sincerity, faith, reverence, submission, directness)."),
    specificWarningsObserved: z.string().describe("Whether the prayer exhibits characteristics Jesus warned against (e.g., praying to be seen, vain repetitions - Matthew 6:5-8)."),
    positiveAspects: z.string().describe("Parts of the prayer reflecting positive scriptural examples."),
    areasOfConcern: z.string().describe("Specific areas where the prayer deviates from or contradicts KJV teachings on prayer."),
  }),
  overallSpiritualIntegrityAssessment: z.string().describe("Concluding assessment on the prayer's spiritual integrity from a KJV theological perspective."),
});
export type AlternatePrayerAnalysisOutput = z.infer<typeof AlternatePrayerAnalysisOutputSchema>;

export async function alternatePrayerAnalysisFlow(input: AlternatePrayerAnalysisInput): Promise<AlternatePrayerAnalysisOutput> {
  const {output} = await alternatePrayerAnalysisPrompt(input);
  if (!output) {
    throw new Error('Alternate prayer analysis AI failed to generate an output.');
  }
  return output;
}

const alternatePrayerAnalysisPrompt = ai.definePrompt({
  name: 'alternatePrayerAnalysisPrompt',
  input: {schema: AlternatePrayerAnalysisInputSchema},
  output: {schema: AlternatePrayerAnalysisOutputSchema},
  prompt: `You are an expert theologian specializing in prayer analysis based on the King James Version (KJV) Bible.
Analyze the provided prayer text meticulously according to the output schema.

Prayer Text to Analyze:
{{{prayerText}}}

Your analysis must address the following points:

1.  **Overall Summary**: Provide a concise summary of your findings.
2.  **Virtue Signalling**:
    *   Identify any phrases or statements that appear to be 'virtue signalling' – where the primary intent seems to be to display the speaker's (or group's) piety, righteousness, or moral superiority, rather than genuine communion with God.
    *   For each instance, provide the "quote" and your "analysis" explaining why it fits this category. (Populate items array)
    *   Provide an overall "assessment" of virtue signalling in the prayer.
3.  **Gaslighting or Manipulative Phrasing**:
    *   Identify any phrases or statements that could be construed as 'gaslighting' (subtly undermining a listener's perception of reality or sanity) or other 'manipulative phrasing' (e.g., emotionally loaded language designed to coerce agreement, leading questions posed as prayer, statements that subtly induce guilt or fear to control).
    *   For each instance, provide the "quote", your "analysis", and specify the "type" ('Gaslighting' or 'Manipulative Phrasing'). (Populate items array)
    *   Provide an overall "assessment" of such tactics in the prayer.
4.  **KJV Comparison**:
    *   "alignmentWithScripturalPrinciples": Discuss how the prayer aligns (or doesn't) with core KJV scriptural principles of prayer such as humility, sincerity, faith, reverence, submission to God's will, and directness. Refer to examples like the Lord's Prayer (Matthew 6:9-13).
    *   "specificWarningsObserved": Specifically address whether the prayer exhibits characteristics Jesus warned against, such as praying to be seen by others, using vain repetitions, or making ostentatious displays (Matthew 6:5-8). Compare these warnings directly to the provided prayer text.
    *   "positiveAspects": Note any parts of the prayer that clearly reflect positive scriptural examples or teachings on prayer.
    *   "areasOfConcern": Highlight specific areas where the prayer's content, tone, or implied intent deviates from or contradicts KJV scriptural teachings on what constitutes genuine, God-honoring prayer.
5.  **Overall Spiritual Integrity Assessment**: Based on all the above, provide a concluding assessment on the spiritual integrity of the prayer from a KJV theological perspective.

Be discerning, objective, and ensure all fields in the output schema are populated. Ground your analysis firmly in KJV scripture.
Ensure your response is a valid JSON object that strictly adheres to the AlternatePrayerAnalysisOutputSchema.
`,
});
    