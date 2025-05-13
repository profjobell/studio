
"use server";

import type { AnalysisReport } from "@/types";
import { revalidatePath } from "next/cache";
import { fetchReportFromDatabase as fetchReportData } from "../analyze/actions"; 
import { calvinismDeepDive } from "@/ai/flows/calvinism-deep-dive";
import { chatWithReport, type ChatWithReportInput, type ChatWithReportOutput, ChatWithReportInputSchema } from "@/ai/flows/chat-with-report-flow";


// Access the global in-memory store from analyze/actions.ts
// This assumes tempReportDatabaseGlobal is declared and initialized in analyze/actions.ts
declare global {
  // eslint-disable-next-line no-var
  var tempReportDatabaseGlobal: { 
    [key: string]: import("@/ai/flows/analyze-content").AnalyzeContentOutput & {
      title: string;
      originalContent: string;
      analysisType: AnalysisReport['analysisType'];
      createdAt: Date;
      fileName?: string;
    }
  } | undefined;
}


export async function fetchReportsList(): Promise<Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput>[]> {
  console.log("Server Action: Fetching reports list from global store (simulated)");
  
  const reportsList: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput>[] = [];
  const currentDb = global.tempReportDatabaseGlobal || {};

  for (const reportId in currentDb) {
    const reportData = currentDb[reportId];
    if (reportData) {
      reportsList.push({
        id: reportId,
        userId: "user-123", // Placeholder
        title: reportData.title,
        fileName: reportData.fileName,
        analysisType: reportData.analysisType,
        status: "completed", // Assuming all saved reports are completed
        createdAt: reportData.createdAt,
        updatedAt: reportData.createdAt, // Or new Date() for last access simulation
        originalContent: reportData.originalContent, // Include for potential use in list/deep dive trigger
      });
    }
  }
  // Sort by creation date, newest first
  reportsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return Promise.resolve(reportsList);
}


export async function deleteReportAction(reportId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Attempting to delete report: ${reportId} from global store (simulated)`);
  
  if (global.tempReportDatabaseGlobal && global.tempReportDatabaseGlobal[reportId]) {
    delete global.tempReportDatabaseGlobal[reportId];
    revalidatePath("/reports");
    revalidatePath("/dashboard"); // Also revalidate dashboard as it shows recent reports
    return { success: true, message: `Report ${reportId} deleted successfully.` };
  } else {
    return { success: false, message: `Report ${reportId} not found.` };
  }
}

export async function deleteAllReportsAction(): Promise<{ success: boolean; message: string }> {
  console.log("Server Action: Attempting to delete all reports from global store (simulated)");
  
  if (global.tempReportDatabaseGlobal) {
    const reportCount = Object.keys(global.tempReportDatabaseGlobal).length;
    if (reportCount === 0) {
      return { success: true, message: "Report history is already empty." };
    }
    global.tempReportDatabaseGlobal = {}; // Clears the in-memory database
    revalidatePath("/reports"); // Revalidate the reports list page
    revalidatePath("/dashboard"); // Revalidate the dashboard page
    return { success: true, message: `Successfully cleared ${reportCount} report(s) from history.` };
  } else {
    // This case implies the database was never initialized, or already cleared in a way that made it undefined.
    // We ensure it's an empty object.
    global.tempReportDatabaseGlobal = {};
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { success: true, message: "Report history store was not initialized or already empty, now ensured clear." };
  }
}


export async function generateInDepthCalvinismReportAction(reportId: string): Promise<{ success: boolean; message: string; analysis?: string }> {
  console.log(`Server Action: Generating in-depth Calvinism report for: ${reportId} (simulated)`);
  
  const report = await fetchReportData(reportId); 
  if (!report || !report.originalContent) {
    return { success: false, message: "Original content not found for this report. Cannot perform deep dive." };
  }

  try {
    const deepDiveResult = await calvinismDeepDive({ content: report.originalContent });
    if (deepDiveResult && 'error' in deepDiveResult) {
        return { success: false, message: `Deep dive failed: ${deepDiveResult.error}` };
    }
    if (deepDiveResult && deepDiveResult.analysis) {
        return { success: true, message: "In-depth Calvinism report generated.", analysis: deepDiveResult.analysis };
    }
    return { success: false, message: "Deep dive completed but no analysis returned." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during deep dive.";
    return { success: false, message: errorMessage };
  }
}

export async function chatWithReportAction(
  input: ChatWithReportInput
): Promise<ChatWithReportOutput | { error: string }> {
  const validatedInput = ChatWithReportInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }

  try {
    const result = await chatWithReport(validatedInput.data);
    return result;
  } catch (error) {
    console.error("Error in chatWithReportAction:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during AI chat." };
  }
}
