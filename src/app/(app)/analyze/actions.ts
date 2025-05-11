
"use server";

import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import { calvinismDeepDive, type CalvinismDeepDiveInput, type CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";
import type { AnalysisReport } from "@/types";
import { z } from "zod";

const analyzeContentSchema = z.object({
  content: z.string().min(1, "Content cannot be empty."),
});

const calvinismDeepDiveSchema = z.object({
  content: z.string().min(1, "Content for deep dive cannot be empty."),
});

// Temporary in-memory store for reports
interface StoredReportData extends AnalyzeContentOutput {
  title: string;
  originalContent: string;
  analysisType: AnalysisReport['analysisType'];
  createdAt: Date;
}

interface TempReportStore {
  [key: string]: StoredReportData;
}
const tempReportDatabase: TempReportStore = {};


export async function analyzeSubmittedContent(
  input: AnalyzeContentInput
): Promise<AnalyzeContentOutput | { error: string }> {
  const validatedInput = analyzeContentSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }

  try {
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
    return result;
  } catch (error) {
    console.error("Error in initiateCalvinismDeepDive:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during Calvinism deep dive." };
  }
}

export async function saveReportToDatabase(
  reportData: AnalyzeContentOutput,
  title: string,
  originalContent: string,
  analysisType: AnalysisReport['analysisType']
): Promise<string | { error: string }> {
  try {
    console.log("Saving report to temporary database (simulated):", title);
    // Generate a more unique ID for the demo
    const reportId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    tempReportDatabase[reportId] = {
      ...reportData,
      title,
      originalContent,
      analysisType,
      createdAt: new Date(),
    };
    console.log(`Saved report with ID: ${reportId} to tempDB. Current DB size: ${Object.keys(tempReportDatabase).length}`);
    return reportId;
  } catch (e) {
    console.error("Error saving report to temp DB:", e);
    const errorMessage = e instanceof Error ? e.message : "Failed to save report data."
    return { error: errorMessage };
  }
}

export async function fetchReportFromDatabase(reportId: string): Promise<AnalysisReport | null> {
  console.log(`Attempting to fetch report from database for ID: ${reportId}`);
  if (tempReportDatabase[reportId]) {
    const data = tempReportDatabase[reportId];
    console.log(`Found report in tempDB for ID: ${reportId}`);
    return {
      id: reportId,
      userId: "user-123", // Placeholder
      title: data.title,
      analysisType: data.analysisType,
      status: "completed", // Assume completed for temp stored reports
      createdAt: data.createdAt,
      updatedAt: new Date(), // Placeholder, could be data.updatedAt if stored
      originalContent: data.originalContent,
      // Spread AnalyzeContentOutput fields
      summary: data.summary,
      scripturalAnalysis: data.scripturalAnalysis,
      historicalContext: data.historicalContext,
      etymology: data.etymology,
      exposure: data.exposure,
      fallacies: data.fallacies,
      manipulativeTactics: data.manipulativeTactics,
      biblicalRemonstrance: data.biblicalRemonstrance,
      identifiedIsms: data.identifiedIsms,
      calvinismAnalysis: data.calvinismAnalysis,
    };
  }

  // Fallback for the original sample report
  if (reportId === "report-001") {
    const sampleReportData: AnalyzeContentOutput = {
      summary: "This is a brief summary of the analyzed content. It highlights key findings and overall theological alignment with KJV 1611. The content shows tendencies towards [Ism Example] and some elements of Calvinistic thought, particularly regarding [Calvinism Example].",
      scripturalAnalysis: [
        { verse: "John 3:16", analysis: "The submitted text interprets this verse in a way that aligns with universal atonement, consistent with KJV 1611." },
        { verse: "Ephesians 1:4-5", analysis: "The content's explanation of predestination here shows some Calvinistic leanings, potentially misinterpreting the scope of 'adoption'." },
      ],
      historicalContext: "The ideas presented in the content echo debates from the Reformation period, particularly those between Calvinists and Arminians regarding free will and divine sovereignty.",
      etymology: "Key term 'agape' (love): Greek root, signifies unconditional, self-sacrificial love. KJV often translates as 'charity'. Contextual use in submitted text is consistent.",
      exposure: "The content seems to draw from modern evangelical writings, some of which have been influenced by Neo-Calvinism. There's no direct exposure to harmful extremist ideologies detected.",
      fallacies: [
        { type: "Straw Man", description: "Misrepresents an opposing view on salvation to make it easier to critique." },
        { type: "Appeal to Emotion", description: "Uses emotionally charged language to persuade rather than scriptural evidence." },
      ],
      manipulativeTactics: [
        { technique: "Proof-texting", description: "Uses isolated Bible verses out of context to support a preconceived idea." },
        { technique: "Loaded Language", description: "Employs terms with strong emotional connotations to sway the audience." },
      ],
      biblicalRemonstrance: "The KJV 1611 emphasizes God's desire for all to be saved (2 Peter 3:9, 1 Timothy 2:4), which should be considered alongside verses on election. For further study, see Blue Letter Bible (https://www.blueletterbible.org).",
      identifiedIsms: [
        { ism: "Arminianism (Partial)", description: "Emphasizes free will in salvation, conditional election.", evidence: "Statements like 'humans must choose to accept God's offer'." },
        { ism: "Dispensationalism (Minor)", description: "Hints at a pre-tribulation rapture view.", evidence: "Reference to 'the Church being taken out before the great suffering'."},
      ],
      calvinismAnalysis: [
        { element: "Unconditional Election (Hinted)", description: "Suggests God chose specific individuals for salvation irrespective of their actions.", evidence: "Interpretation of Ephesians 1:4-5.", infiltrationTactic: "Subtle rephrasing of 'foreknowledge' as 'predetermination'."},
        { element: "Sovereignty (Emphasized)", description: "Strong focus on God's absolute control over all events, including salvation.", evidence: "Repeated phrases like 'God's sovereign decree'."},
      ],
    };
    return {
      id: "report-001",
      userId: "user-123",
      title: "Sample Analysis: Sermon on Divine Sovereignty",
      analysisType: "text",
      status: "completed",
      createdAt: new Date("2025-05-22T10:00:00Z"),
      updatedAt: new Date("2025-05-22T11:30:00Z"),
      ...sampleReportData,
    };
  }
  
  console.log(`Report not found in tempDB or as sample for ID: ${reportId}`);
  return null;
}
