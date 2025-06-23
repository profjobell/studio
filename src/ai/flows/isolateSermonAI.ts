
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
  config: {
    temperature: 0.3,
    maxOutputTokens: 3000,
    topP: 0.9,
  },
  prompt: `You are an expert assistant for a theological analysis application. You are tasked with extracting the sermon content from a provided transcript of a church service and formatting it into a JSON object. Follow these instructions precisely:

1.  **Primary Goal**: Identify and extract the main sermon, any prayers directly associated with the sermon, and any scripture passages quoted verbatim.

2.  **JSON Output Structure**: Your entire response MUST be a valid JSON object adhering to this schema:
    {
      "sermon": "string", // This field will contain the formatted, combined text.
      "prayers": [ {"prayer": "string"} ], // This array will contain ONLY the verbatim text of each prayer.
      "warning": "string" // Optional: for any issues.
    }

3.  **Populating the 'sermon' JSON Field**:
    *   This field should contain the fully formatted sermon content for display.
    *   **Structure**: The text in this field must follow this order:
        1.  **Scripture Reading**: Start with any scripture readings under a markdown heading (e.g., "### Psalm 119:9-24").
        2.  **Associated Prayer**: Follow with any prayers that are directly part of the sermon context, under a heading (e.g., "### Prayer").
        3.  **Sermon Text**: Conclude with the main sermon under a heading (e.g., "### Sermon: The Doctrine of the Word of God").
    *   **Content Rules**:
        *   The text must be **verbatim** from the transcript. Do not summarize or rephrase.
        *   **Exclude** all music ([Music]), lyrics, chatter, laughter, applause, preambles, announcements, and any other non-sermon elements (e.g., instructions, transitions, or side comments).
        *   Do not include any introductions, notices, or organizational details (e.g., event schedules, donation information, or mentions of other activities).
        *   If no sermon content is identifiable, this field must contain the exact string: "No sermon or lecture content found."

4.  **Populating the 'prayers' JSON Field**:
    *   This is a separate requirement from the 'sermon' field.
    *   Identify **all distinct prayers** in the transcript.
    *   Place the verbatim text of each prayer into its own object within the 'prayers' array (e.g., \`{ "prayer": "Father, we thank you..." }\`).
    *   If no prayers are found, this must be an empty array: \`[]\`.

5.  **Example Task**:
    *   **Input Transcript**: "[Music] Announcements: Pizza tonight. Prayer: Father, we thank you... Psalm 15: O Lord, who shall... Sermon: We’re in a series on maturity... [Applause] Closing Prayer: Lord, bless us..."
    *   **Required JSON Output**:
        \`\`\`json
        {
          "sermon": "### Psalm 15: O Lord, who shall...\\n\\n### Prayer\\nFather, we thank you...\\n\\n### Sermon: We’re in a series on maturity...\\nWe’re in a series on maturity...",
          "prayers": [
            { "prayer": "Prayer: Father, we thank you..." },
            { "prayer": "Closing Prayer: Lord, bless us..." }
          ],
          "warning": ""
        }
        \`\`\`

Now, process the following transcript and generate the JSON output.

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
