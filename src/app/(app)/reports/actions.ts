"use server";

import type { AnalysisReport } from "@/types";
import { revalidatePath } from "next/cache";
import { fetchReportFromDatabase as fetchReportData } from "../analyze/actions"; // Using the existing fetcher
import { calvinismDeepDive } from "@/ai/flows/calvinism-deep-dive";

// Temporary in-memory store for demo purposes. In a real app, this would be Firestore.
// This sample data matches the structure used in reports/page.tsx for listing.
// The full report data is fetched by fetchReportData from analyze/actions.ts
let tempReportsDB: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[] = [
   {
    id: "report-001", // This ID should match one from analyze/actions.ts for deep dive to work
    userId: "user-123",
    title: "Analysis of Sermon on John 3:16, May 2025",
    analysisType: "text",
    status: "completed",
    createdAt: new Date("2025-05-20T10:00:00Z"),
    updatedAt: new Date("2025-05-20T11:30:00Z"),
    originalContent: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." // Sample original content
  },
  {
    id: "report-002",
    userId: "user-123",
    title: "Review of 'The Pilgrim's Progress' Chapter 1 (Audio)",
    fileName: "pilgrims_progress_ch1.mp3",
    analysisType: "file_audio",
    status: "processing",
    createdAt: new Date("2025-05-21T14:00:00Z"),
    updatedAt: new Date("2025-05-21T14:05:00Z"),
  },
  {
    id: "report-003",
    userId: "user-123",
    title: "Doctrinal Statement Evaluation (PDF)",
    fileName: "church_doctrine.pdf",
    analysisType: "file_document",
    status: "failed",
    createdAt: new Date("2025-05-19T09:30:00Z"),
    updatedAt: new Date("2025-05-19T09:35:00Z"),
  },
];

export async function fetchReportsList(): Promise<Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput>[]> {
  console.log("Server Action: Fetching reports list (simulated)");
  // In a real app, fetch only metadata for the list view.
  return Promise.resolve(tempReportsDB);
}


export async function deleteReportAction(reportId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Attempting to delete report: ${reportId} (simulated)`);
  const initialLength = tempReportsDB.length;
  tempReportsDB = tempReportsDB.filter(report => report.id !== reportId);

  if (tempReportsDB.length < initialLength) {
    // Also delete from the full report data store if separate
    // e.g., deleteFromTempReportDatabase(reportId) from analyze/actions if it existed
    revalidatePath("/reports");
    return { success: true, message: `Report ${reportId} deleted successfully.` };
  } else {
    return { success: false, message: `Report ${reportId} not found.` };
  }
}

export async function generateInDepthCalvinismReportAction(reportId: string): Promise<{ success: boolean; message: string; analysis?: string }> {
  console.log(`Server Action: Generating in-depth Calvinism report for: ${reportId} (simulated)`);
  
  const report = await fetchReportData(reportId); // Fetch the full report to get originalContent
  if (!report || !report.originalContent) {
    return { success: false, message: "Original content not found for this report. Cannot perform deep dive." };
  }

  try {
    const deepDiveResult = await calvinismDeepDive({ content: report.originalContent });
    if (deepDiveResult && 'error' in deepDiveResult) {
        return { success: false, message: `Deep dive failed: ${deepDiveResult.error}` };
    }
    if (deepDiveResult && deepDiveResult.analysis) {
         // In a real app, you might save this new analysis or link it to the original report.
         // For demo, we just return the analysis.
        return { success: true, message: "In-depth Calvinism report generated.", analysis: deepDiveResult.analysis };
    }
    return { success: false, message: "Deep dive completed but no analysis returned." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during deep dive.";
    return { success: false, message: errorMessage };
  }
}
