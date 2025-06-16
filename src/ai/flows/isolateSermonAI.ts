
'use server';
/**
 * @fileOverview Genkit AI flow to isolate sermon or lecture content and prayers from a transcript.
 *
 * - isolateSermonAI - A function that uses an LLM to extract sermon/lecture text and prayers.
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
  sermon: z.string().describe('The extracted sermon or lecture text. If no sermon/lecture is identifiable, this will be an empty string or a specific message like "No sermon or lecture content found."'),
  prayers: z.array(z.object({ prayer: z.string() })).describe('An array of distinct prayers found in the transcript, verbatim. Empty if no prayers are found.'),
  warning: z.string().optional().describe('Optional warning, e.g., if the transcript seems incomplete or ambiguous.'),
});
export type IsolateSermonAIOutput = z.infer<typeof IsolateSermonAIOutputSchema>;

export async function isolateSermonAI(input: IsolateSermonAIInput): Promise<IsolateSermonAIOutput> {
  return isolateSermonAIFlow(input);
}

const isolateSermonPrompt = ai.definePrompt({
  name: 'isolateSermonAndPrayersPrompt',
  input: {schema: IsolateSermonAIInputSchema},
  output: {schema: IsolateSermonAIOutputSchema},
  prompt: `Task:
From a transcript of a church service, religious meeting, or lecture, extract and return:

Only the main sermon or lecture (full, verbatim, with all non-sermon elements, timestamps, and music removed).

Each individual prayer (e.g., opening prayer, intercessory prayer, closing prayer) as a separate item, verbatim, in the order they appear.

Instructions:

Do not summarize or alter the wording of the sermon or prayers in any way.

Identify and extract each distinct prayer as its own separate object.

Prayers may begin with phrases like “Let us pray…”, “Father in Heaven…”, “Our Father…”, “Dear God…”, or any invocation, and usually end with “Amen” or a similar conclusion.

Exclude all music, songs, announcements, notices, non-sermon dialog, and timestamps from both the sermon and the prayers.

The sermon/lecture and each prayer must be presented verbatim and in full, in the order they appear in the transcript.

If no sermon is detected, the "sermon" field in the JSON output should be "No sermon or lecture content found." or an empty string.
If no prayers are detected, the "prayers" field should be an empty array.

Transcript to process:
{{{transcript}}}

Your JSON response must strictly adhere to the IsolateSermonAIOutputSchema.
The JSON output should look like:
{
  "sermon": "Full verbatim text of the main sermon/lecture...",
  "prayers": [
    {"prayer": "Full verbatim text of Prayer 1."},
    {"prayer": "Full verbatim text of Prayer 2."}
  ],
  "warning": "Optional warning message if applicable."
}
Do not include any commentary, summary, or additional explanation outside this JSON structure.
`,
});

const isolateSermonAIFlow = ai.defineFlow(
  {
    name: 'isolateSermonAndPrayersFlow',
    inputSchema: IsolateSermonAIInputSchema,
    outputSchema: IsolateSermonAIOutputSchema,
  },
  async (input) => {
    const {output} = await isolateSermonPrompt(input);
    if (!output) {
      console.error("AI failed to generate sermon/prayer isolation output.");
      return {
        sermon: "Error: AI failed to process the transcript.",
        prayers: [],
        warning: "AI processing resulted in no output."
      };
    }
    return {
      sermon: output.sermon || "No sermon or lecture content found.",
      prayers: output.prayers || [],
      warning: output.warning
    };
  }
);
