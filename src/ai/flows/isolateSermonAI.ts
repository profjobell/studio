
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
  prompt: `Task:
From any transcript of a church service, religious meeting, lecture, class, or public talk, extract and return ONLY the full verbatim text of the main sermon or lecture delivered by the primary speaker.

Instructions:

Do not summarize, paraphrase, or alter the wording of the extracted sermon or lecture in any way.

Present the result as a continuous, verbatim transcript—no notes, commentary, or summaries.

Specifically:

Remove all non-sermon or non-lecture elements, including but not limited to:

Music or song lyrics, musical notations, “[Music]”, “[Applause]”, “[Laughter]”, or any similar stage directions or sound cues.

Opening and closing prayers, communal prayers, readings of announcements, group introductions, logistical details, or information about social events (e.g., youth groups, food lists, etc.).

All announcements, notices, administrative information, greetings, and welcomes not integral to the actual start of the sermon/lecture.

Q&A, audience discussion, audience participation, or unrelated side conversations unless part of the core teaching.

Any dialogue or sections led by others that are not part of the main teaching content.

All timestamps (e.g., [00:12:34], 12:34, or any other time markers, whether bracketed or not) and any markers indicating time or speaker turns, unless these are spoken as part of the sermon/lecture itself.

Retain ONLY the actual sermon or lecture content, starting from the main teaching/scripture reading (if it is part of the sermon/lecture) and including all spoken exposition, illustration, and teaching through to the end as delivered by the main speaker.

If the sermon or lecture is interrupted by non-sermon content (e.g., additional music or notices), skip these interruptions and continue extracting the teaching content only.

Maintain the original order and wording. Do not omit any part of the main teaching, and do not insert or remove words from the original.

Output only the verbatim sermon or lecture content, and nothing else—no introductory explanation or closing statement.

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

