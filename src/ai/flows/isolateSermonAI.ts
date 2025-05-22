
'use server';
/**
 * @fileOverview Genkit AI flow to isolate sermon content from a transcript.
 *
 * - isolateSermonAI - A function that uses an LLM to extract sermon text.
 * - IsolateSermonAIInput - The input type for the isolateSermonAI function.
 * - IsolateSermonAIOutput - The return type for the isolateSermonAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IsolateSermonAIInputSchema = z.object({
  transcript: z.string().describe('The full church service transcript, potentially including timestamps, music cues, announcements, prayers, and the sermon.'),
});
export type IsolateSermonAIInput = z.infer<typeof IsolateSermonAIInputSchema>;

const IsolateSermonAIOutputSchema = z.object({
  sermon: z.string().describe('The extracted sermon text, verbatim, with non-sermon content removed. If no sermon is identifiable, this will be "No sermon content could be identified in the transcript."'),
  warning: z.string().optional().describe('Optional warning, e.g., if the transcript seems incomplete.'),
});
export type IsolateSermonAIOutput = z.infer<typeof IsolateSermonAIOutputSchema>;

export async function isolateSermonAI(input: IsolateSermonAIInput): Promise<IsolateSermonAIOutput> {
  return isolateSermonAIFlow(input);
}

const isolateSermonPrompt = ai.definePrompt({
  name: 'isolateSermonAIPrompt',
  input: {schema: IsolateSermonAIInputSchema},
  output: {schema: IsolateSermonAIOutputSchema},
  prompt: `You are tasked with extracting the full, verbatim sermon text from a provided transcript of a church service. The transcript contains various elements including music, lyrics, announcements, prayers, readings, and other non-sermon content, but your goal is to isolate only the sermon itself, defined as the main expository teaching or preaching delivered by the speaker, typically based on a biblical passage. The sermon may include explanations, exhortations, and applications of the scripture but should exclude introductory remarks, administrative announcements, prayers, or other activities not directly part of the sermon’s teaching content.

Here are the specific instructions:
1. Input Transcript: The transcript is a detailed record of a church service, including annotations like "[Music]", "[Applause]", dialogue, timestamps, and other activities. You should be robust in handling various timestamp formats (e.g., [HH:MM:SS], MM:SS, [MM:SS.mmm]) and remove them completely from the final sermon output.
2. Definition of Sermon: The sermon begins when the speaker starts the main teaching on a biblical passage (e.g., for the example provided, this would be after the reading of Romans 5:1-11, when the speaker begins exposition on the theme "rejoice in hope") and ends when the teaching concludes, typically before transitioning to closing prayers, songs, or other activities. It includes only the speaker’s exposition, explanations, and applications of the scripture, not preparatory remarks or unrelated content.
3. Exclusion Criteria:
    * Exclude all music, lyrics, and annotations like "[Music]" or "[Applause]".
    * Exclude announcements (e.g., about church events, news sheets, or community activities).
    * Exclude prayers, whether opening, closing, or intercessory.
    * Exclude scripture readings or recitations if they are presented as standalone readings (e.g., Psalm 34 or the reading of Romans 5:1-11 itself, if it precedes the sermon's expository start). If scripture is quoted *within* the sermon's exposition, it should be included.
    * Exclude introductions, welcomes, or administrative remarks (e.g., thanks for attendance, mentions of other events).
    * Exclude references to non-sermon activities (e.g., awards, children’s activities, or mentions of the Christian Institute).
    * Exclude closing remarks that transition to other activities (e.g., preparing for communion or final blessings).
4. Output Requirements:
    * Provide the full, verbatim sermon text as delivered, preserving the speaker’s words without summarization or paraphrasing.
    * Remove any interruptions or annotations that are not part of the sermon’s teaching content.
    * If the sermon is interrupted by non-sermon content (e.g., a song or announcement), skip those sections and continue with the sermon text, ensuring the final sermon text is a coherent whole.
    * Present the output as plain text in the "sermon" field of the JSON output.
    * If no sermon is clearly identifiable, the "sermon" field should contain: "No sermon content could be identified in the transcript."
    * If the original transcript appears incomplete, set an optional "warning" field in the JSON output to "Transcript may be incomplete".
5. Context Clue (Example Specific): For the example transcript you were shown, the sermon is based on Romans 5:1-11, introduced with the theme "rejoice in hope," and is delivered after the reading of Romans 5:1-11. It begins with the speaker’s exposition of the passage and ends before the closing hymn or communion remarks.

Transcript to process:
{{{transcript}}}

Your JSON response must strictly adhere to the IsolateSermonAIOutputSchema.
Ensure 'sermon' is always a string.
The JSON output should look like: {"sermon": "extracted sermon text here...", "warning": "optional warning if applicable"}
or if no sermon: {"sermon": "No sermon content could be identified in the transcript."}
`,
});

const isolateSermonAIFlow = ai.defineFlow(
  {
    name: 'isolateSermonAIFlow',
    inputSchema: IsolateSermonAIInputSchema,
    outputSchema: IsolateSermonAIOutputSchema,
  },
  async (input) => {
    const {output} = await isolateSermonPrompt(input);
    if (!output) {
      console.error("AI failed to generate sermon isolation output.");
      return { sermon: "Error: AI failed to process the transcript for sermon isolation." };
    }
    // Ensure the output always has a sermon field, even if it's a fallback message.
    return {
      sermon: output.sermon || "No sermon content could be identified in the transcript.",
      warning: output.warning
    };
  }
);
