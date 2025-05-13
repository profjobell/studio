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

const ChatWithReportInputSchema = z.object({
  reportContext: z.string().min(1, "Report context cannot be empty.")
    .describe('The content of the report or section being discussed.'),
  userQuestion: z.string().min(1, "User question cannot be empty.")
    .describe('The question asked by the user about the report context.'),
  // Optional: chatHistory for multi-turn, but let's start simple
});
export type ChatWithReportInput = z.infer<typeof ChatWithReportInputSchema>;

const ChatWithReportOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's answer to the user's question."),
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

Report Context:
---
{{{reportContext}}}
---

User Question: {{{userQuestion}}}

Answer:`,
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
      throw new Error('AI failed to generate a response.');
    }
    return output;
  }
);
