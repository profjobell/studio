'use server';

import { z } from 'zod';
import { 
  explainFallacy, 
  type ExplainFallacyInput, 
  type ExplainFallacyOutput 
} from '@/ai/flows/explain-fallacy-flow';
import { 
  generateFallacyQuizQuestion, 
  type GenerateFallacyQuizQuestionInput, 
  type FallacyQuizQuestion 
} from '@/ai/flows/generate-fallacy-quiz-question-flow';

export async function getFallacyExplanationAction(
  input: ExplainFallacyInput 
): Promise<{ success: boolean; data?: ExplainFallacyOutput; error?: string }> {
  // Input validation will be handled by the Genkit flow itself
  // based on ExplainFallacyInputSchema defined within explain-fallacy-flow.ts
  try {
    const result = await explainFallacy(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getFallacyExplanationAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while fetching fallacy explanation.";
     if (error instanceof Error && 'details' in error) {
        // Log more details if available, e.g. from Genkit errors
        console.error("Error details:", (error as any).details);
    }
    return { success: false, error: errorMessage };
  }
}

export async function generateQuizQuestionAction(
  input: GenerateFallacyQuizQuestionInput 
): Promise<{ success: boolean; data?: FallacyQuizQuestion; error?: string }> {
  // Input validation will be handled by the Genkit flow itself
  // based on GenerateFallacyQuizQuestionInputSchema defined within generate-fallacy-quiz-question-flow.ts
  try {
    const result = await generateFallacyQuizQuestion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in generateQuizQuestionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while generating quiz question.";
    if (error instanceof Error && 'details' in error) {
        console.error("Error details:", (error as any).details);
    }
    return { success: false, error: errorMessage };
  }
}
