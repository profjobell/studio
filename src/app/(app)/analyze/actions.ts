"use server";

import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import { calvinismDeepDive, type CalvinismDeepDiveInput, type CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";
import { z } from "zod";

const analyzeContentSchema = z.object({
  content: z.string().min(1, "Content cannot be empty."),
});

const calvinismDeepDiveSchema = z.object({
  content: z.string().min(1, "Content for deep dive cannot be empty."),
});


export async function analyzeSubmittedContent(
  input: AnalyzeContentInput
): Promise<AnalyzeContentOutput | { error: string }> {
  const validatedInput = analyzeContentSchema.safeParse(input);
  if (!validatedInput.success) {
    // Simplified error handling for brevity
    return { error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }

  try {
    // This directly calls the AI flow.
    // In a real app, you might add more logic here:
    // - User authentication/authorization checks
    // - Saving submission details to a database before calling AI
    // - Handling API rate limits or errors from the AI service more gracefully
    // - Storing the result in a database linked to the user and submission
    const result = await analyzeContent(validatedInput.data);
    return result;
  } catch (error) {
    console.error("Error in analyzeSubmittedContent:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during analysis." };
  }
}

export async function initiateCalvinismDeepDive(
  input: CalvinismDeepDiveInput
): Promise<CalvinismDeepDiveOutput | { error: string }> {
  const validatedInput = calvinismDeepDiveSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }
  
  try {
    const result = await calvinismDeepDive(validatedInput.data);
    // Similar to above, you might save this result, link it to an original analysis, etc.
    return result;
  } catch (error) {
    console.error("Error in initiateCalvinismDeepDive:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during Calvinism deep dive." };
  }
}

// Placeholder for saving report to database
// This would interact with Firestore in a real application
export async function saveReportToDatabase(reportData: any): Promise<string> {
  console.log("Saving report to database (simulated):", reportData);
  // Simulate DB save and return a new ID
  const reportId = Math.random().toString(36).substring(2, 15);
  return reportId;
}
