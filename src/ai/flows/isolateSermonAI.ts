
'use server';
/**
 * @fileOverview Genkit AI flow to isolate sermon or lecture content from a transcript.
 *
 * - isolateSermonAI - A function that uses an LLM to extract sermon/lecture text.
 * - IsolateSermonAIInput - The input type for the isolateSermonAI function.
 * - IsolateSermonAIOutput - The return type for the isolateSermonAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IsolateSermonAIInputSchema = z.object({
  transcript: z.string().describe('The full text input, potentially including music, announcements, prayers, and the sermon/lecture.'),
});
export type IsolateSermonAIInput = z.infer<typeof IsolateSermonAIInputSchema>;

const IsolateSermonAIOutputSchema = z.object({
  sermon: z.string().describe('The extracted sermon or lecture text. If no sermon/lecture is identifiable, this will be "No sermon or lecture content found."'),
  warning: z.string().optional().describe('Optional warning, e.g., if the transcript seems incomplete or ambiguous.'),
});
export type IsolateSermonAIOutput = z.infer<typeof IsolateSermonAIOutputSchema>;

export async function isolateSermonAI(input: IsolateSermonAIInput): Promise<IsolateSermonAIOutput> {
  return isolateSermonAIFlow(input);
}

const isolateSermonPrompt = ai.definePrompt({
  name: 'isolateSermonOrLecturePrompt', // Updated name for clarity
  input: {schema: IsolateSermonAIInputSchema},
  output: {schema: IsolateSermonAIOutputSchema},
  prompt: `Extract only the sermon or lecture content from the provided text input, which may include music, songs, prayers, announcements, scripture readings, applause, introductions, or other non-sermon elements. The sermon or lecture is the main teaching or discourse delivered by the primary speaker, including embedded scripture references or quotes directly supporting the teaching.

Instructions:

Identify the sermon or lecture, typically the speaker’s core message, theological or educational exposition, arguments, or examples, including scripture references within the narrative.

Exclude:

Music or songs, often marked by "[Music]" or repetitive hymn-like phrases.
Prayers, identified by addresses to God (e.g., "Father," "we pray," "amen").
Announcements, introductions, or logistical details (e.g., event schedules, instructions).
Standalone scripture readings before or after the sermon.
Audience reactions like "[Applause]" or "[Laughter]."
Non-sermon activities (e.g., "children are going out").
Closing remarks outside the sermon’s teaching, like final prayers or hymns.

Retain the sermon’s structure, including headings and embedded scripture quotes, but remove separate scripture sections.

Focus on the primary speaker’s sermon if multiple speakers are present.

Output only the sermon or lecture content, cleanly formatted with preserved headings and spacing. Do not include commentary or metadata.

If no sermon is detected, return: "No sermon or lecture content found."

Example Input: [Music] Announcements: Pizza tonight. Prayer: Father, we thank you... Psalm 15: O Lord, who shall... Sermon: We’re in a series on maturity... [Applause] Closing Prayer: Lord, bless us...
Example Output: Sermon We’re in a series on maturity...

Transcript to process:
{{{transcript}}}

Your JSON response must strictly adhere to the IsolateSermonAIOutputSchema.
Ensure 'sermon' is always a string.
The JSON output should look like: {"sermon": "extracted sermon/lecture text here...", "warning": "optional warning if applicable"}
or if no sermon/lecture: {"sermon": "No sermon or lecture content found."}
`,
});

const isolateSermonAIFlow = ai.defineFlow(
  {
    name: 'isolateSermonOrLectureFlow', // Updated name
    inputSchema: IsolateSermonAIInputSchema,
    outputSchema: IsolateSermonAIOutputSchema,
  },
  async (input) => {
    const {output} = await isolateSermonPrompt(input);
    if (!output) {
      console.error("AI failed to generate sermon/lecture isolation output.");
      // Ensure a valid output structure even on complete failure from the prompt call
      return { sermon: "Error: AI failed to process the transcript for sermon/lecture isolation." };
    }
    // Ensure the output always has a sermon field, even if it's a fallback message.
    return {
      sermon: output.sermon || "No sermon or lecture content found.", // Default if sermon is null/undefined
      warning: output.warning
    };
  }
);
