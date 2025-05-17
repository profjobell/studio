
'use server';
/**
 * @fileOverview Provides AI-driven explanations and discussions on theological topics,
 * 'isms', and heresies, using simulated web search and adhering strictly to KJV 1611 principles.
 *
 * - chatWithInternetKJV - A function that handles the chat interaction.
 * - ChatWithInternetKJVInput - The input type for the chatWithInternetKJV function.
 * - ChatWithInternetKJVOutput - The return type for the chatWithInternetKJV function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // Use genkit's z for schema definitions

const performWebSearch = ai.defineTool(
  {
    name: 'performWebSearch',
    description: 'Searches the internet for information on a given query, focusing on theological and historical topics. Results must be critically evaluated against KJV 1611 principles before being used in any response.',
    inputSchema: z.object({
      query: z.string().describe('The search query for theological or historical topics.'),
    }),
    outputSchema: z.object({
      summary: z.string().describe('A concise summary of relevant search results. This summary is raw data and needs KJV 1611 interpretation.'),
      sources: z.array(z.string()).optional().describe('A list of up to 3 simulated source URLs or descriptions from where the information was supposedly gathered.'),
    }),
  },
  async (input) => {
    // MOCKED IMPLEMENTATION
    console.log(`Mocked web search for: ${input.query}`);
    let summary = `Mocked search results for "${input.query}". General information that requires careful KJV 1611-based interpretation and discernment would be presented here.`;
    let sources: string[] = [`https://example.com/search?q=${encodeURIComponent(input.query)}`];

    if (input.query.toLowerCase().includes("arianism")) {
      summary = "Arianism, originating with Arius of Alexandria in the 4th century, posited that Jesus Christ, the Son of God, was created by God the Father at a specific point in time and is therefore subordinate to the Father, not co-eternal or co-equal. This view was famously challenged at the First Council of Nicaea in 325 AD.";
      sources = ["https://example.com/church-history/arianism", "https://example.com/theological-disputes/nicaea"];
    } else if (input.query.toLowerCase().includes("gnosticism")) {
      summary = "Gnosticism encompasses diverse religious ideas from the 1st and 2nd centuries AD, emphasizing salvation through secret knowledge (gnosis) rather than faith or orthodox teachings. Gnostics often viewed the material world as evil, created by a lesser deity (demiurge), contrasting with the true, transcendent God.";
      sources = ["https://example.com/early-christianity/gnosticism", "https://example.com/philosophy/dualism"];
    } else if (input.query.toLowerCase().includes("calvinism") && input.query.toLowerCase().includes("history")) {
       summary = "Calvinism, a major branch of Protestantism, stems from the theological work of John Calvin in the 16th century. Key tenets, often summarized by the TULIP acronym (Total Depravity, Unconditional Election, Limited Atonement, Irresistible Grace, Perseverance of the Saints), emphasize God's sovereignty in salvation. These doctrines were influential during the Protestant Reformation and continue to be debated.";
       sources = ["https://example.com/reformation/calvinism", "https://example.com/theology/john-calvin"];
    }
    return { summary, sources };
  }
);

const ChatWithInternetKJVInputSchema = z.object({
  userQuestion: z.string().min(1, "User question cannot be empty.")
    .describe('The question asked by the user about a theological topic, "ism", or heresy.'),
  topicContext: z.string().optional()
    .describe('Optional context, like the name of the "ism" currently being viewed by the user (e.g., "Arianism", "General Isms").'),
});
export type ChatWithInternetKJVInput = z.infer<typeof ChatWithInternetKJVInputSchema>;

const ChatWithInternetKJVOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's comprehensive answer, grounded in KJV 1611 principles, possibly informed by simulated web search results. It should avoid profanity and unbiblical assertions, and may suggest areas for deeper research, and should ask if the user wants a deeper dive."),
  sourcesCited: z.array(z.string()).optional().describe("A list of (simulated) sources used to inform the response, if web search was utilized."),
});
export type ChatWithInternetKJVOutput = z.infer<typeof ChatWithInternetKJVOutputSchema>;

export async function chatWithInternetKJV(input: ChatWithInternetKJVInput): Promise<ChatWithInternetKJVOutput> {
  return chatWithInternetKJVFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithInternetKJVPrompt',
  tools: [performWebSearch],
  input: {schema: ChatWithInternetKJVInputSchema},
  output: {schema: ChatWithInternetKJVOutputSchema},
  prompt: `You are a Theological Research Assistant specializing in the KJV 1611 Bible.
Your primary mandate is to provide answers and insights that are STRICTLY aligned with the doctrines and teachings found in the King James Version (1611) of the Holy Bible.
The KJV 1611 is your SOLE AND ULTIMATE doctrinal authority. No other Bible version, theological system, or philosophical viewpoint should supersede it.

The user is asking: "{{userQuestion}}"
{{#if topicContext}}The user is currently viewing information related to: "{{topicContext}}"{{/if}}

Instructions:
1.  **Analyze the User's Question**: Understand the core of the user's query.
2.  **Consult KJV 1611 First**: Before any other action, consider what the KJV 1611 directly says or implies about the topic. If the KJV provides a clear answer, prioritize that.
3.  **Utilize Web Search Tool (If Necessary)**: If the KJV 1611 does not directly address the specifics, or if historical/contextual information is needed, you MUST use the 'performWebSearch' tool to gather information. Formulate a concise query for the tool.
4.  **Critically Evaluate Search Results**: All information retrieved from the 'performWebSearch' tool MUST be critically evaluated against the KJV 1611. Discard any information that contradicts or undermines KJV 1611 teachings.
5.  **Synthesize Your Response**:
    *   Construct a comprehensive, clear, and helpful answer.
    *   Base your response PRIMARILY on KJV 1611 scriptures. Cite relevant KJV verses (e.g., John 3:16 KJV) to support your points.
    *   If web search was used, integrate the KJV-aligned information from the search results. Clearly state that this information is from external sources and has been interpreted through the KJV lens.
    *   DO NOT present opinions or doctrines as fact if they are not explicitly supported by the KJV 1611. Clearly distinguish between direct scriptural teaching and biblically-informed interpretations.
    *   AVOID ALL PROFANITY and any language that is disrespectful or uncharitable.
    *   DO NOT ENDORSE OR PROMOTE any "ism" or philosophy that contradicts the KJV 1611. Your role is to explain and analyze them FROM a KJV 1611 perspective.
    *   **After providing the main answer, ask the user if they would like a more detailed explanation or a deeper investigation into the topic.** For example: "Would you like me to elaborate further on any aspect of this or provide a deeper investigation?"
6.  **Suggest Deeper Research (if user declines further elaboration or as a concluding part)**: If appropriate, and if the user does not request an immediate deeper dive, suggest specific KJV passages, related biblical themes, or areas for further personal study (always centered on the KJV 1611).
7.  **Cite Sources (Simulated)**: If the 'performWebSearch' tool provided sources and you used its information, list up to 2-3 of these (simulated) sources at the end of your response under a "Sources Consulted (Simulated):" heading.

You MUST NOT invent information. If a definitive KJV-based answer cannot be provided, or if search results are inconclusive or contrary to KJV, state that clearly.
Your goal is to edify and equip the user with KJV-based understanding.

IMPORTANT: You MUST provide your response in a valid JSON format that strictly adheres to the defined output schema. The main response text must be in the 'aiResponse' field. If you use sources, list them in the 'sourcesCited' field (which should be an array of strings, or omitted if no sources are cited). Even if you cannot find specific information or an error occurs internally, you must still formulate a response within the 'aiResponse' field explaining the situation (e.g., "I could not find specific information on that topic based on KJV 1611 principles and available search tools." or "An unexpected issue occurred."). Ensure 'aiResponse' is always a string.
`,
});

const chatWithInternetKJVFlow = ai.defineFlow(
  {
    name: 'chatWithInternetKJVFlow',
    inputSchema: ChatWithInternetKJVInputSchema,
    outputSchema: ChatWithInternetKJVOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const resultOutput = response.output;
    
    if (!resultOutput) {
      console.error("Genkit prompt returned no output. Raw response from prompt call:", response);
      // Construct a valid default error object if the model truly fails to produce anything matching the schema
      return {
        aiResponse: "I'm sorry, but I encountered an issue and couldn't generate a response. Please try rephrasing your question or try again later.",
        // sourcesCited will be implicitly undefined, which is fine as it's optional
      };
    }
    return resultOutput;
  }
);

    
