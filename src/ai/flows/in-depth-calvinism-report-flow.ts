
'use server';
/**
 * @fileOverview Generates an In-Depth Calvinistic Report (IDCR) for given content.
 *
 * - generateInDepthCalvinismReport - A function that initiates the IDCR analysis.
 * - InDepthCalvinismReportInput - The input type.
 * - InDepthCalvinismReportOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InDepthCalvinismReportInputSchema = z.object({
  content: z.string().describe('The content to be analyzed for the In-Depth Calvinistic Report.'),
});
export type InDepthCalvinismReportInput = z.infer<typeof InDepthCalvinismReportInputSchema>;

const InDepthCalvinismReportOutputSchema = z.object({
  overtCalvinismAnalysis: z.string().describe("Detailed analysis of overt Calvinistic doctrines or elements (e.g., TULIP points, covenant theology, specific interpretations of sovereignty or election)."),
  subtleCommunicationAnalysis: z.string().describe("An 'x-ray view' of what might be subtly or implicitly communicated, particularly in relation to Calvinistic theology, its effects, or how it's being framed."),
  psychologicalTacticsAnalysis: z.string().describe("Description of any psychological tactics (e.g., fear appeals, loaded language, echo chambers, appeals to tradition/authority, gaslighting, framing) employed in the content, especially if they serve to reinforce or propagate Calvinistic viewpoints."),
  godsCharacterRepresentation: z.object({
    godTheFather: z.string().describe("How God the Father's character (e.g., love, justice, sovereignty, mercy) is portrayed or potentially misrepresented, especially in light of Calvinistic interpretations."),
    lordJesusChrist: z.string().describe("How Lord Jesus Christ's work, person, and character (e.g., scope of atonement, nature of His call) is portrayed or potentially misrepresented in relation to Calvinistic claims."),
    holySpirit: z.string().describe("How the Holy Spirit's role and character (e.g., His work in regeneration, sanctification, illumination) is portrayed or potentially misrepresented in relation to Calvinistic theology."),
  }).describe("Analysis of how the character of God (Father, Son, Holy Spirit) is represented."),
  cessationismAnalysis: z.string().describe("Identified elements suggesting cessationist views (i.e., the belief that certain spiritual gifts or the direct revelatory work of the Holy Spirit ceased with the apostolic age), particularly if these views are used to support or are a consequence of the Calvinistic arguments presented."),
  antiSemitismAnalysis: z.string().describe("Examination of the content for any anti-Semitic overtones or undertones. This could include explicit statements, misinterpretations of scripture that diminish Israel's role (e.g., extreme replacement theology), or rhetoric that could foster negative views towards Jewish people or Judaism, especially if these are tied to Calvinistic theological frameworks."),
  furtherUnearthingNotes: z.string().describe("Based solely on the provided text, notes on any patterns, presuppositions, or apparent agendas that might warrant further investigation. Considers what the speaker's textual cues (like tone, emphasis, or rhetorical strategies, if discernible from the text) might suggest about their underlying motivations or perspectives regarding Calvinism."),
});
export type InDepthCalvinismReportOutput = z.infer<typeof InDepthCalvinismReportOutputSchema>;

export async function generateInDepthCalvinismReport(input: InDepthCalvinismReportInput): Promise<InDepthCalvinismReportOutput> {
  const {output} = await idcrPrompt(input);
  if (!output) {
    throw new Error('In-Depth Calvinistic Report AI failed to generate an output.');
  }
  return output;
}

const idcrPrompt = ai.definePrompt({
  name: 'inDepthCalvinismReportPrompt',
  input: {schema: InDepthCalvinismReportInputSchema},
  output: {schema: InDepthCalvinismReportOutputSchema},
  prompt: `You are a discerning theological expert specializing in Calvinism and its broader implications.
Analyze the following content in-depth.

Content:
{{{content}}}

Your analysis must be comprehensive and structured according to the output schema. Address the following:

1.  **Overt Calvinism Analysis**: Identify and detail any overt Calvinistic doctrines or elements (e.g., TULIP points, covenant theology, specific interpretations of sovereignty or election).
2.  **Subtle Communication Analysis**: Provide an 'x-ray view' of what might be subtly or implicitly communicated, particularly in relation to Calvinistic theology, its effects, or how it's being framed.
3.  **Psychological Tactics Analysis**: Describe any psychological tactics (e.g., fear appeals, loaded language, echo chambers, appeals to tradition/authority, gaslighting, framing) employed in the content, especially if they serve to reinforce or propagate Calvinistic viewpoints.
4.  **God's Character Representation**:
    *   **God the Father**: How is His character (e.g., love, justice, sovereignty, mercy) portrayed or potentially misrepresented, especially in light of Calvinistic interpretations?
    *   **Lord Jesus Christ**: How is His work, person, and character portrayed or potentially misrepresented (e.g., scope of atonement, nature of His call) in relation to Calvinistic claims?
    *   **Holy Spirit**: How is His role and character portrayed or potentially misrepresented (e.g., His work in regeneration, sanctification, illumination) in relation to Calvinistic theology?
5.  **Cessationism Analysis**: Identify any elements suggesting cessationist views (i.e., the belief that certain spiritual gifts or the direct revelatory work of the Holy Spirit ceased with the apostolic age), particularly if these views are used to support or are a consequence of the Calvinistic arguments presented.
6.  **Anti-Semitism Analysis**: Examine the content for any anti-Semitic overtones or undertones. This could include explicit statements, misinterpretations of scripture that diminish Israel's role (e.g., extreme replacement theology), or rhetoric that could foster negative views towards Jewish people or Judaism, especially if these are tied to Calvinistic theological frameworks.
7.  **Further Unearthing Notes**: Based *solely on the provided text*, note any patterns, presuppositions, or apparent agendas that might warrant further investigation. Consider what the speaker's textual cues (like tone, emphasis, or rhetorical strategies, if discernible from the text) might suggest about their underlying motivations or perspectives regarding Calvinism.

Provide a detailed, objective, and critical report for each section. Be thorough and use KJV 1611 scriptural understanding as a baseline for evaluating theological claims where appropriate.
Ensure your response is a valid JSON object that strictly adheres to the InDepthCalvinismReportOutputSchema.
`,
});

    
