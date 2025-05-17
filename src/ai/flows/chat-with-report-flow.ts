
'use server';
/**
 * @fileOverview Provides a chat interface to discuss a given report context with an AI.
 *
 * - chatWithReport - A function that handles the chat interaction.
 * - ChatWithReportInput - The input type for the chatWithReport function.
 * - ChatWithReportOutput - The return type for the chatWithReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define ChatMessageSchema for chat history consistent with other flows
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({text: z.string()})),
});
export type ChatMessageHistory = z.infer<typeof ChatMessageSchema>;


const ChatWithReportInputSchema = z.object({
  reportContext: z.string().min(1, "Report context cannot be empty.")
    .describe('The content of the report or section being discussed.'),
  userQuestion: z.string().min(1, "User question cannot be empty.")
    .describe('The question asked by the user about the report context.'),
  chatHistory: z.array(ChatMessageSchema).optional()
    .describe('Previous conversation turns to provide context to the AI.'),
});
export type ChatWithReportInput = z.infer<typeof ChatWithReportInputSchema>;

const ChatWithReportOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's answer to the user's question."),
  // sourcesCited could be added if this chat ever uses tools for external lookup
});
export type ChatWithReportOutput = z.infer<typeof ChatWithReportOutputSchema>;

export async function chatWithReport(input: ChatWithReportInput): Promise<ChatWithReportOutput> {
  return chatWithReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithReportPrompt',
  input: {schema: ChatWithReportInputSchema},
  output: {schema: ChatWithReportOutputSchema},
  prompt: `You are a helpful theological assistant. Your task is to answer questions based *strictly* on the provided "Report Context".
Do not use any external knowledge or make assumptions beyond what is in the context.
If the answer to the question cannot be found within the "Report Context", clearly state that the information is not available in the provided text.

You MUST provide your response in a valid JSON format that strictly adheres to the defined output schema: { "aiResponse": "Your answer here" }.
The main response text must be in the 'aiResponse' field.
Even if you cannot find specific information or an error occurs internally, you must still formulate a response within the 'aiResponse' field explaining the situation.
Ensure 'aiResponse' is always a string and any special characters (like quotes or newlines) within it are handled or escaped properly using standard JSON string escaping (e.g., \\" for quotes, \\\\n for newlines) to ensure the overall output is valid JSON.

{{#if chatHistory}}
Conversation History:
{{#each chatHistory}}
{{role}}: {{parts.[0].text}}
{{/each}}
--- End of History ---
{{/if}}

Report Context:
---
{{{reportContext}}}
---

User Question: {{{userQuestion}}}

Your JSON Response:`,
});

const chatWithReportFlow = ai.defineFlow(
  {
    name: 'chatWithReportFlow',
    inputSchema: ChatWithReportInputSchema,
    outputSchema: ChatWithReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // Return a valid object adhering to ChatWithReportOutputSchema in case of null/undefined output
      return { aiResponse: "I'm sorry, but I encountered an issue and couldn't generate a response based on the report." };
    }
    return output;
  }
);

