'use server';
/**
 * @fileOverview Generates quiz questions related to logical fallacies.
 *
 * - generateFallacyQuizQuestion - A function that returns a quiz question.
 * - GenerateFallacyQuizQuestionInput - The input type.
 * - FallacyQuizQuestion - The output type (the quiz question itself).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateFallacyQuizQuestionInputSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate').describe("The difficulty level for the quiz question."),
  // Optionally, you could add a list of fallacy types to focus on in the future.
  // specificFallacy: z.string().optional().describe("If provided, generate a question specifically about this fallacy or one that uses it as a distractor.")
});
export type GenerateFallacyQuizQuestionInput = z.infer<typeof GenerateFallacyQuizQuestionInputSchema>;

export const FallacyQuizQuestionSchema = z.object({
  questionText: z.string().describe("A scenario, argument, or statement that may or may not contain a fallacy."),
  options: z.array(z.object({
    id: z.string().describe("A unique ID for the option, e.g., 'A', 'B', 'C', 'D'."),
    text: z.string().describe("The text of the option, usually a fallacy name or 'No fallacy present'."),
  })).min(3).max(4).describe("An array of 3-4 plausible options for the user to choose from."),
  correctOptionId: z.string().describe("The ID of the correct option."),
  explanation: z.string().describe("A detailed explanation of why the correct answer is correct, and why others might be incorrect. If a fallacy is present, explain it."),
  fallacyCommitted: z.string().optional().describe("The name of the fallacy committed, if any. Null or empty if 'No fallacy' is correct."),
});
export type FallacyQuizQuestion = z.infer<typeof FallacyQuizQuestionSchema>;

export async function generateFallacyQuizQuestion(input: GenerateFallacyQuizQuestionInput): Promise<FallacyQuizQuestion> {
  return generateFallacyQuizQuestionFlow(input);
}

const commonFallacies = [
  "Ad Hominem", "Straw Man", "Appeal to Authority", "Slippery Slope",
  "False Dilemma", "Circular Reasoning", "Hasty Generalization",
  "Appeal to Ignorance", "Red Herring", "Appeal to Emotion", "Tu Quoque",
  "No True Scotsman", "Genetic Fallacy", "Bandwagon Fallacy", "Argument from Silence"
];


const prompt = ai.definePrompt({
  name: 'generateFallacyQuizQuestionPrompt',
  input: {schema: GenerateFallacyQuizQuestionInputSchema},
  output: {schema: FallacyQuizQuestionSchema},
  prompt: `You are a quiz master specializing in logical fallacies.
Generate a quiz question for {{{difficulty}}} difficulty.
The question should present a short scenario, argument, or statement.
The user needs to identify the fallacy present, or determine if there is no fallacy.

Instructions:
1.  **Question Text**: Create a clear scenario or argument.
2.  **Options**:
    *   Provide 3 or 4 distinct options. Each option should have a unique ID (e.g., "A", "B", "C", "D").
    *   One option must be the correct answer.
    *   At least one option should be "No fallacy present" if appropriate for the question.
    *   Other options should be plausible but incorrect fallacy names. Choose from the list: ${commonFallacies.join(', ')}.
3.  **Correct Option ID**: Specify the ID of the correct option.
4.  **Fallacy Committed**: If a fallacy is present, state its name. If 'No fallacy present' is correct, this can be null or empty.
5.  **Explanation**: Provide a concise but thorough explanation detailing:
    *   Why the correct option is correct.
    *   If a fallacy is present, define it briefly and explain how it applies to the question text.
    *   Briefly explain why other common distractors might seem plausible but are incorrect in this context.

Example Output Format (Illustrative):
{
  "questionText": "Senator Jones said we should not fund the new park because he was seen at a fancy restaurant last week. What fallacy is this?",
  "options": [
    { "id": "A", "text": "Straw Man" },
    { "id": "B", "text": "Ad Hominem" },
    { "id": "C", "text": "Appeal to Authority" },
    { "id": "D", "text": "No fallacy present" }
  ],
  "correctOptionId": "B",
  "fallacyCommitted": "Ad Hominem",
  "explanation": "This is an Ad Hominem fallacy because it attacks Senator Jones' character or circumstances (being at a fancy restaurant) instead of addressing the argument about funding the park. A Straw Man misrepresents an argument. Appeal to Authority relies on an irrelevant authority."
}

Focus on common fallacies for {{{difficulty}}} level.
Ensure the scenario is relatable and the fallacy (if present) is clearly identifiable for the given difficulty.
For 'beginner' difficulty, use very common and distinct fallacies.
For 'advanced' difficulty, the scenarios can be more subtle or involve less common fallacies or nuanced distinctions.
`,
});

const generateFallacyQuizQuestionFlow = ai.defineFlow(
  {
    name: 'generateFallacyQuizQuestionFlow',
    inputSchema: GenerateFallacyQuizQuestionInputSchema,
    outputSchema: FallacyQuizQuestionSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a quiz question.');
    }
    // Ensure options have unique IDs if AI doesn't guarantee it, though it should.
    // For example, by re-assigning A, B, C, D if needed.
    // For simplicity now, we trust the AI based on prompt.
    return output;
  }
);