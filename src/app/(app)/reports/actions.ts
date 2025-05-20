
"use server";

import type { AnalysisReport, ClientChatMessage } from "@/types";
import { revalidatePath } from "next/cache";
import { fetchReportFromDatabase as fetchReportData } from "../analyze/actions";
import { calvinismDeepDive } from "@/ai/flows/calvinism-deep-dive";
import { chatWithReport, type ChatWithReportInput, type ChatWithReportOutput } from "@/ai/flows/chat-with-report-flow";


// Access the global in-memory store from analyze/actions.ts
declare global {
  // eslint-disable-next-line no-var
  var tempReportDatabaseGlobal: {
    [key: string]: import("@/ai/flows/analyze-content").AnalyzeContentOutput & {
      title: string;
      originalContent: string;
      analysisType: AnalysisReport['analysisType'];
      createdAt: Date;
      fileName?: string;
      fallacies: Array<{ type: string; description: string; }>;
      calvinismDeepDiveAnalysis?: string;
      aiChatTranscript?: ClientChatMessage[];
    }
  } | undefined;
}


export async function fetchReportsList(): Promise<AnalysisReport[]> {
  console.log("Server Action: Fetching reports list from global store (simulated for full reports)");

  const reportsList: AnalysisReport[] = [];
  const currentDb = global.tempReportDatabaseGlobal || {};

  for (const reportId in currentDb) {
    const reportData = currentDb[reportId];
    if (reportData) {
      reportsList.push({
        id: reportId,
        userId: "user-123",
        title: reportData.title,
        fileName: reportData.fileName,
        analysisType: reportData.analysisType,
        status: "completed",
        createdAt: reportData.createdAt,
        updatedAt: reportData.createdAt,
        originalContent: reportData.originalContent,
        summary: reportData.summary,
        scripturalAnalysis: reportData.scripturalAnalysis,
        historicalContext: reportData.historicalContext,
        etymology: reportData.etymology,
        exposure: reportData.exposure,
        fallacies: reportData.fallacies,
        manipulativeTactics: reportData.manipulativeTactics,
        biblicalRemonstrance: reportData.biblicalRemonstrance,
        identifiedIsms: reportData.identifiedIsms,
        calvinismAnalysis: reportData.calvinismAnalysis,
        calvinismDeepDiveAnalysis: reportData.calvinismDeepDiveAnalysis,
        aiChatTranscript: reportData.aiChatTranscript,
      });
    }
  }
  reportsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return Promise.resolve(reportsList);
}


export async function deleteReportAction(reportId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Attempting to delete report: ${reportId} from global store (simulated)`);

  if (global.tempReportDatabaseGlobal && global.tempReportDatabaseGlobal[reportId]) {
    delete global.tempReportDatabaseGlobal[reportId];
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/learning/report-fallacy-quiz");
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
    global.tempReportDatabaseGlobal = {};
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/learning/report-fallacy-quiz");
    return { success: true, message: `Successfully cleared ${reportCount} report(s) from history.` };
  } else {
    global.tempReportDatabaseGlobal = {};
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/learning/report-fallacy-quiz");
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
        if (global.tempReportDatabaseGlobal && global.tempReportDatabaseGlobal[reportId]) {
          global.tempReportDatabaseGlobal[reportId].calvinismDeepDiveAnalysis = deepDiveResult.analysis;
          revalidatePath(`/reports/${reportId}`);
        }
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
  try {
    const result = await chatWithReport(input);
    return result;
  } catch (error) {
    console.error("Error in chatWithReportAction:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during AI chat." };
  }
}

export async function generateContentReportTxtOutput(reportId: string): Promise<string> {
  const report = await fetchReportData(reportId);
  if (!report) {
    return "Error: Report not found.";
  }

  let output = `KJV Sentinel - Content Analysis Report\n`;
  output += `Title: ${report.title}\n`;
  output += `Generated: ${new Date(report.createdAt).toLocaleString()}\n`;
  if (report.fileName) output += `Original File: ${report.fileName}\n`;
  output += `Analysis Type: ${report.analysisType.replace(/_/g, " ")}\n\n`;

  output += `--- Summary ---\n${report.summary || 'N/A'}\n\n`;

  if (report.originalContent) {
    output += `--- Original Content Submitted ---\n${report.originalContent}\n\n`;
  }

  output += `--- Scriptural Analysis ---\n`;
  if (report.scripturalAnalysis && report.scripturalAnalysis.length > 0) {
    report.scripturalAnalysis.forEach(sa => {
      output += `Verse: ${sa.verse}\nAnalysis: ${sa.analysis}\n\n`;
    });
  } else {
    output += `N/A\n\n`;
  }

  output += `--- Historical Context ---\n${report.historicalContext || 'N/A'}\n\n`;
  output += `--- Etymology ---\n${report.etymology || 'N/A'}\n\n`;
  output += `--- Exposure ---\n${report.exposure || 'N/A'}\n\n`;

  output += `--- Logical Fallacies ---\n`;
  if (report.fallacies && report.fallacies.length > 0) {
    report.fallacies.forEach(f => {
      output += `Type: ${f.type}\nDescription: ${f.description}\n\n`;
    });
  } else {
    output += `N/A\n\n`;
  }

  output += `--- Manipulative Tactics ---\n`;
  if (report.manipulativeTactics && report.manipulativeTactics.length > 0) {
    report.manipulativeTactics.forEach(mt => {
      output += `Technique: ${mt.technique}\nDescription: ${mt.description}\n\n`;
    });
  } else {
    output += `N/A\n\n`;
  }

  output += `--- Identified Isms ---\n`;
  if (report.identifiedIsms && report.identifiedIsms.length > 0) {
    report.identifiedIsms.forEach(ism => {
      output += `Ism: ${ism.ism}\nDescription: ${ism.description}\nEvidence: ${ism.evidence}\n\n`;
    });
  } else {
    output += `N/A\n\n`;
  }

  output += `--- Calvinism Analysis ---\n`;
  if (report.calvinismAnalysis && report.calvinismAnalysis.length > 0) {
    report.calvinismAnalysis.forEach(ca => {
      output += `Element: ${ca.element}\nDescription: ${ca.description}\nEvidence: ${ca.evidence}\nInfiltration Tactic: ${ca.infiltrationTactic || 'N/A'}\n\n`;
    });
  } else {
    output += `N/A\n\n`;
  }

  if (report.calvinismDeepDiveAnalysis) {
    output += `--- In-Depth Calvinism Examination ---\n${report.calvinismDeepDiveAnalysis}\n\n`;
  }

  if (report.aiChatTranscript && report.aiChatTranscript.length > 0) {
    output += `--- AI Chat Discussion ---\n`;
    report.aiChatTranscript.forEach(msg => {
      output += `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
      if (msg.sources && msg.sources.length > 0) {
        output += `Sources: ${msg.sources.join(', ')}\n`;
      }
      output += `\n`;
    });
  }

  output += `--- Biblical Remonstrance ---\n${report.biblicalRemonstrance || 'N/A'}\n\n`;

  return output;
}

export async function saveChatToReportAction(
  reportId: string,
  chatMessages: ClientChatMessage[]
): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Saving chat to report ID: ${reportId}`);

  if (!global.tempReportDatabaseGlobal) {
    global.tempReportDatabaseGlobal = {}; // Initialize if undefined
    console.warn("tempReportDatabaseGlobal was not initialized. Initializing now.");
  }

  const report = global.tempReportDatabaseGlobal[reportId];

  if (report) {
    // Ensure aiChatTranscript is an array before pushing
    if (!Array.isArray(report.aiChatTranscript)) {
      report.aiChatTranscript = [];
    }
    // Replace the transcript with the current session's chat.
    report.aiChatTranscript = chatMessages;
    
    // Persist the change back to the global store (if it's not directly mutating)
    global.tempReportDatabaseGlobal[reportId] = report;

    revalidatePath(`/reports/${reportId}`);
    return { success: true, message: "Chat transcript saved to report successfully." };
  } else {
    console.error(`Report ID ${reportId} not found in tempReportDatabaseGlobal.`);
    return { success: false, message: `Report ${reportId} not found. Could not save chat.` };
  }
}
