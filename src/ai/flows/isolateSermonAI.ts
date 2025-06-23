
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
  prompt: `Your task is to analyze a transcript of a church service, religious meeting, or lecture. From this transcript, you must extract two types of content:
1. The main sermon or lecture.
2. Any distinct prayers.

**Sermon/Lecture Extraction Instructions:**

Extract only the sermon or lecture content. The sermon or lecture is the main teaching or discourse delivered by the primary speaker, including embedded scripture references or quotes directly supporting the teaching.

- **Identify:** The sermon is the speaker’s core message, theological or educational exposition, arguments, or examples, including scripture references within the narrative.
- **Exclude the following from the sermon:**
  - Music or songs (e.g., "[Music]", hymn lyrics).
  - Standalone prayers (these should be extracted separately).
  - Announcements, introductions, or logistical details (e.g., event schedules, instructions).
  - Standalone scripture readings that are not part of the sermon's narrative flow.
  - Audience reactions (e.g., "[Applause]", "[Laughter]").
  - Non-sermon activities (e.g., "children are going out").
  - Closing remarks outside the sermon’s teaching, like final prayers or hymns.
- **Retain:** The sermon’s original structure, including any headings, and embedded scripture quotes, but remove separate scripture sections.
- **Focus:** If multiple speakers are present, focus on the primary speaker’s main sermon.
- **If no sermon is detected,** the "sermon" field in your JSON output must be "No sermon or lecture content found."

**Prayer Extraction Instructions:**

- **Identify and extract** each distinct prayer as a separate verbatim item. Prayers may begin with phrases like “Let us pray…”, “Father in Heaven…”, or any invocation, and usually end with “Amen”.
- **Exclude** all non-prayer elements (like music or announcements) from the prayer text.
- **If no prayers are detected,** the "prayers" field in your JSON output must be an empty array.

**Output Format:**

Your entire response MUST be a single, valid JSON object that strictly adheres to the IsolateSermonAIOutputSchema. The JSON output must have the following structure:
{
  "sermon": "Full verbatim text of the main sermon/lecture...",
  "prayers": [
    {"prayer": "Full verbatim text of Prayer 1."},
    {"prayer": "Full verbatim text of Prayer 2."}
  ],
  "warning": "Optional warning message if applicable, for instance if the transcript seems incomplete."
}

Do not include any commentary or summary or metadata outside of this JSON structure.

**Example Input:** "[Music] Announcements: Pizza tonight. Prayer: Father, we thank you... Psalm 15: O Lord, who shall... Sermon: We’re in a series on maturity... [Applause] Closing Prayer: Lord, bless us..."
**Example JSON Output from that Input:**
{
  "sermon": "Sermon: We’re in a series on maturity...",
  "prayers": [
    {"prayer": "Prayer: Father, we thank you..."},
    {"prayer": "Closing Prayer: Lord, bless us..."}
  ]
}

**Transcript to process:**
{{{transcript}}}
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
