
"use server";

import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import { calvinismDeepDive, type CalvinismDeepDiveInput, type CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";
import { chatWithReport, type ChatWithReportInput, type ChatWithReportOutput, type ChatMessageHistory as GenkitChatMessageHistory } from "@/ai/flows/chat-with-report-flow"; // Renamed import to avoid conflict
import { transcribeYouTubeVideoFlow, type TranscribeYouTubeInput, type TranscribeYouTubeOutput } from "@/ai/flows/transcribe-youtube-flow"; // Import new flow
import { isolateSermonAI } from "@/ai/flows/isolateSermonAI"; // Import the sermon isolation flow
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
  fileName?: string;
  calvinismDeepDiveAnalysis?: string;
}

interface TempReportStore {
  [key: string]: StoredReportData;
}

declare global {
  var tempReportDatabaseGlobal: TempReportStore | undefined;
}

let tempReportDatabase: TempReportStore;

if (process.env.NODE_ENV === 'production') {
  tempReportDatabase = {};
} else {
  if (!global.tempReportDatabaseGlobal) {
    global.tempReportDatabaseGlobal = {};
    const sampleReportId = "report-001";
    const sampleReportData: StoredReportData = {
      title: "Sample Analysis: Sermon on Divine Sovereignty",
      originalContent: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. This sermon explores the depths of God's sovereignty in salvation, referencing key scriptures and theological arguments. It discusses concepts such as election, predestination, and the irresistible grace of God, aiming to provide a clear understanding from a perspective rooted in the KJV 1611. The implications of these doctrines on Christian life and evangelism are also considered.",
      analysisType: "text",
      createdAt: new Date("2025-05-22T10:00:00Z"),
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
      calvinismDeepDiveAnalysis: undefined,
    };
    global.tempReportDatabaseGlobal[sampleReportId] = sampleReportData;
  }
  tempReportDatabase = global.tempReportDatabaseGlobal;
}

// New Server Action for YouTube Transcription
export async function transcribeYouTubeVideoAction(
  url: string
): Promise<TranscribeYouTubeOutput> {
  if (!url) {
    return { transcript: '', status: 'error', errorMessage: 'YouTube URL cannot be empty.' };
  }
  try {
    const result = await transcribeYouTubeVideoFlow({ youtubeUrl: url });
    return result;
  } catch (error) {
    console.error("Error in transcribeYouTubeVideoAction:", error);
    return { transcript: '', status: 'error', errorMessage: error instanceof Error ? error.message : "An unexpected error occurred during YouTube transcription." };
  }
}


export async function analyzeSubmittedContent(
  submission: { content: string; analysisType: AnalysisReport['analysisType']; }
): Promise<AnalyzeContentOutput | { error: string }> {
  
  let contentToActuallyAnalyze = submission.content;
  let isolationWarningMessage: string | undefined = undefined;

  if (submission.analysisType === "text") {
    const validatedInputForIsolation = z.string().min(1, "Content for sermon isolation cannot be empty.").safeParse(submission.content);
    if (!validatedInputForIsolation.success) {
      return { error: validatedInputForIsolation.error.errors.map(e => e.message).join(", ") };
    }
    
    try {
      const isolationResult = await isolateSermonAI({ transcript: validatedInputForIsolation.data });
      if (isolationResult.sermon && isolationResult.sermon.trim() !== "" && isolationResult.sermon !== "No sermon or lecture content found.") {
        contentToActuallyAnalyze = isolationResult.sermon;
        if (isolationResult.warning) {
          isolationWarningMessage = `Sermon/Lecture Isolation Warning: ${isolationResult.warning}`;
        }
      } else {
        // If sermon is "No sermon or lecture content found." or empty after trim.
        return { error: "No sermon or lecture content could be identified in the provided text. Analysis cannot proceed." };
      }
    } catch (error) {
      console.error("Error during sermon isolation step:", error);
      return { error: error instanceof Error ? error.message : "An unexpected error occurred during sermon/lecture isolation." };
    }
  }

  const validatedInputForAnalysis = analyzeContentSchema.safeParse({ content: contentToActuallyAnalyze });
  if (!validatedInputForAnalysis.success) {
    // This might happen if isolated content is somehow invalid for the main analysis schema, though less likely if it's just text.
    return { error: validatedInputForAnalysis.error.errors.map(e => e.message).join(", ") };
  }

  try {
    const analysisResult = await analyzeContent(validatedInputForAnalysis.data);
    
    // Prepend isolation warning to the summary if it exists and analysis was successful
    if (isolationWarningMessage && analysisResult && !('error' in analysisResult)) {
      analysisResult.summary = `${isolationWarningMessage}\n\n${analysisResult.summary}`;
    }
    
    return analysisResult;
  } catch (error) {
    console.error("Error in analyzeContent (after potential isolation):", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during the main content analysis." };
  }
}

export async function initiateCalvinismDeepDive(
  input: CalvinismDeepDiveInput & { reportId: string }
): Promise<CalvinismDeepDiveOutput | { error: string }> {
  const validatedInput = calvinismDeepDiveSchema.safeParse({ content: input.content });
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(", ") };
  }
  
  try {
    const result = await calvinismDeepDive({content: validatedInput.data.content});

    if ('analysis' in result && tempReportDatabase[input.reportId]) {
      tempReportDatabase[input.reportId].calvinismDeepDiveAnalysis = result.analysis;
      console.log(`Updated report ${input.reportId} with Calvinism deep dive analysis.`);
    } else if ('error' in result) {
      console.error("Error in initiateCalvinismDeepDive flow call:", result.error);
      return result;
    } else if (!tempReportDatabase[input.reportId]){
      console.warn(`Report ID ${input.reportId} not found in temp database after deep dive.`);
    }
    
    return result;
  } catch (error) {
    console.error("Error in initiateCalvinismDeepDive:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during Calvinism deep dive." };
  }
}

export async function saveReportToDatabase(
  reportData: AnalyzeContentOutput,
  title: string,
  originalContent: string, // This should be the raw user input
  analysisType: AnalysisReport['analysisType'],
  fileName?: string
): Promise<string | { error: string }> {
  try {
    console.log("Saving report to temporary database (simulated):", title);
    const reportId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const dataToStore: StoredReportData = {
      ...reportData, // Results from analyzing the (potentially isolated) sermon
      title,
      originalContent, // The raw input from the user
      analysisType,
      createdAt: new Date(),
      calvinismDeepDiveAnalysis: undefined, // Initialize this
    };

    if (analysisType !== 'text' && fileName) {
      dataToStore.fileName = fileName;
    }
    
    tempReportDatabase[reportId] = dataToStore;

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
  console.log('Current tempReportDatabase keys at fetch:', Object.keys(tempReportDatabase));

  if (tempReportDatabase[reportId]) {
    const data = tempReportDatabase[reportId];
    console.log(`Found report in tempDB for ID: ${reportId}`);
    return {
      id: reportId,
      userId: "user-123", 
      title: data.title,
      fileName: data.fileName,
      analysisType: data.analysisType,
      status: "completed", 
      createdAt: data.createdAt,
      updatedAt: new Date(), 
      originalContent: data.originalContent,
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
      calvinismDeepDiveAnalysis: data.calvinismDeepDiveAnalysis,
    };
  }
  
  console.log(`Report not found in tempDB for ID: ${reportId}`);
  return null;
}

export async function chatWithReportAction(
  input: ChatWithReportInput,
): Promise<ChatWithReportOutput | { error: string }> {
  try {
    const result = await chatWithReport(input); 
    return result;
  } catch (error) {
    console.error("Error in chatWithReportAction:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during AI chat with report." };
  }
}
    
