'use server';

import { z } from 'zod';
import { 
  explainFallacy, 
  ExplainFallacyInputSchema, 
  type ExplainFallacyOutput 
} from '@/ai/flows/explain-fallacy-flow';
import { 
  generateFallacyQuizQuestion, 
  GenerateFallacyQuizQuestionInputSchema, 
  type FallacyQuizQuestion 
} from '@/ai/flows/generate-fallacy-quiz-question-flow';

export async function getFallacyExplanationAction(
  input: z.infer<typeof ExplainFallacyInputSchema>
): Promise<{ success: boolean; data?: ExplainFallacyOutput; error?: string }> {
  const validatedInput = ExplainFallacyInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }

  try {
    const result = await explainFallacy(validatedInput.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getFallacyExplanationAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}

export async function generateQuizQuestionAction(
  input: z.infer<typeof GenerateFallacyQuizQuestionInputSchema>
): Promise<{ success: boolean; data?: FallacyQuizQuestion; error?: string }> {
  const validatedInput = GenerateFallacyQuizQuestionInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }

  try {
    const result = await generateFallacyQuizQuestion(validatedInput.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in generateQuizQuestionAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}