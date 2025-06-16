
"use server";

import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import { calvinismDeepDive, type CalvinismDeepDiveInput, type CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";
import { chatWithReport, type ChatWithReportInput, type ChatWithReportOutput, type ChatMessageHistory as GenkitChatMessageHistory } from "@/ai/flows/chat-with-report-flow";
import { transcribeYouTubeVideoFlow, type TranscribeYouTubeInput, type TranscribeYouTubeOutput } from "@/ai/flows/transcribe-youtube-flow";
import { isolateSermonAI } from "@/ai/flows/isolateSermonAI";
import { analyzePrayersInText, type PrayerAnalysisInput, type PrayerAnalysisOutput } from "@/ai/flows/analyze-prayer-flow"; // Import prayer analysis flow
import type { AnalysisReport, ClientChatMessage } from "@/types";
import { z } from "zod";

const analyzeContentServerSchema = z.object({
  content: z.string().min(1, "Content cannot be empty."),
  referenceMaterial: z.string().optional(),
  analysisType: z.enum(["text", "file_audio", "file_video", "file_document", "youtube_video"]),
  analyzePrayers: z.boolean().optional(),
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
  aiChatTranscript?: ClientChatMessage[];
  prayerAnalyses?: PrayerAnalysisOutput; // Added for prayer analysis results
}

interface TempReportStore {
  [key: string]: StoredReportData;
}

declare global {
  var tempReportDatabaseGlobal: TempReportStore | undefined;
}

let tempReportDatabase: TempReportStore;

const defaultMoralisticFraming = {
  description: "Not specifically assessed or no clear moralistic framing detected.",
  advantagesForSpeakerObedience: "N/A",
  linkedLogicalFallacies: [],
  historicalParallels: [],
};

const defaultVirtueSignalling = {
  description: "Not specifically assessed or no clear virtue signalling detected.",
  advantagesForSpeakerObedience: "N/A",
  linkedLogicalFallacies: [],
  historicalParallels: [],
};

const defaultBiblicalRemonstrance = {
  scripturalFoundationAssessment: "No specific issues noted or not applicable.",
  historicalTheologicalContextualization: "Standard KJV 1611 interpretation assumed unless otherwise noted.",
  rhetoricalAndHomileticalObservations: "Standard delivery assumed unless otherwise noted.",
  theologicalFrameworkRemarks: "Assumed to be within general KJV 1611 orthodoxy unless specific points are raised.",
  kjvScripturalCounterpoints: "No specific counterpoints raised or not applicable.",
  suggestionsForFurtherStudy: "Continue general study of the KJV 1611.",
};


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
      identifiedIsms: [
        { ism: "Arminianism (Partial)", description: "Emphasizes free will in salvation, conditional election.", evidence: "Statements like 'humans must choose to accept God's offer'." },
        { ism: "Dispensationalism (Minor)", description: "Hints at a pre-tribulation rapture view.", evidence: "Reference to 'the Church being taken out before the great suffering'."},
      ],
      calvinismAnalysis: [
        { element: "Unconditional Election (Hinted)", description: "Suggests God chose specific individuals for salvation irrespective of their actions.", evidence: "Interpretation of Ephesians 1:4-5.", infiltrationTactic: "Subtle rephrasing of 'foreknowledge' as 'predetermination'."},
        { element: "Sovereignty (Emphasized)", description: "Strong focus on God's absolute control over all events, including salvation.", evidence: "Repeated phrases like 'God's sovereign decree'."},
      ],
      moralisticFramingAnalysis: defaultMoralisticFraming,
      virtueSignallingAnalysis: defaultVirtueSignalling,
      biblicalRemonstrance: defaultBiblicalRemonstrance,
      potentialManipulativeSpeakerProfile: "The speaker profile for this sample is not specifically assessed for manipulative traits beyond general rhetorical observations.",
      guidanceOnWiseConfrontation: "For this sample, confrontation guidance would focus on ensuring understanding of the original KJV context of cited verses and encouraging dialogue on differing interpretations of sovereignty and election.",
      calvinismDeepDiveAnalysis: undefined,
      aiChatTranscript: [],
      prayerAnalyses: [], // Initialize prayer analyses for sample
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
  submission: z.infer<typeof analyzeContentServerSchema>
): Promise<AnalyzeContentOutput | { error: string }> {
  
  const validatedSubmission = analyzeContentServerSchema.safeParse(submission);
  if (!validatedSubmission.success) {
      return { error: validatedSubmission.error.errors.map(e => e.message).join(", ") };
  }
  const { content, analysisType, analyzePrayers, referenceMaterial } = validatedSubmission.data;

  let contentToActuallyAnalyze = content;
  let isolationWarningMessage: string | undefined = undefined;

  if (analysisType === "text") {
    const validatedInputForIsolation = z.string().min(1, "Content for sermon isolation cannot be empty.").safeParse(content);
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
        return { error: "No sermon or lecture content could be identified in the provided text. Analysis cannot proceed." };
      }
    } catch (error) {
      console.error("Error during sermon isolation step:", error);
      return { error: error instanceof Error ? error.message : "An unexpected error occurred during sermon/lecture isolation." };
    }
  }

  // Prepare input for main content analysis
  const mainAnalysisInput: AnalyzeContentInput = { 
    content: contentToActuallyAnalyze,
    referenceMaterial: referenceMaterial 
  };

  try {
    // Perform main content analysis
    const mainAnalysisResult = await analyzeContent(mainAnalysisInput);
    if ('error' in mainAnalysisResult) { // Check if analyzeContent returned an error object
      return mainAnalysisResult;
    }
    
    if (isolationWarningMessage) {
      mainAnalysisResult.summary = `${isolationWarningMessage}\n\n${mainAnalysisResult.summary}`;
    }

    // If analyzePrayers is true, perform prayer analysis
    let prayerAnalysisResults: PrayerAnalysisOutput | undefined = undefined;
    if (analyzePrayers) {
      try {
        // Pass the *contentToActuallyAnalyze* (isolated sermon or original file content) to prayer analysis
        prayerAnalysisResults = await analyzePrayersInText({ textContent: contentToActuallyAnalyze });
      } catch (prayerError) {
        console.error("Error during prayer analysis step:", prayerError);
        // Optionally append a warning to the main summary if prayer analysis fails
        mainAnalysisResult.summary += "\n\nWarning: Prayer analysis encountered an error and could not be completed.";
      }
    }

    // Combine results
    const finalReport: AnalyzeContentOutput = {
      ...mainAnalysisResult,
      prayerAnalyses: prayerAnalysisResults || [], // Add prayer analyses if performed
    };
    
    return finalReport;

  } catch (error) {
    console.error("Error in main content analysis or prayer analysis integration:", error);
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
  reportData: AnalyzeContentOutput, // This now includes prayerAnalyses
  title: string,
  originalContent: string, 
  analysisType: AnalysisReport['analysisType'],
  fileName?: string
): Promise<string | { error: string }> {
  try {
    console.log("Saving report to temporary database (simulated):", title);
    const reportId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const dataToStore: StoredReportData = {
      ...reportData, 
      title,
      originalContent, 
      analysisType,
      createdAt: new Date(),
      moralisticFramingAnalysis: reportData.moralisticFramingAnalysis || defaultMoralisticFraming,
      virtueSignallingAnalysis: reportData.virtueSignallingAnalysis || defaultVirtueSignalling,
      biblicalRemonstrance: reportData.biblicalRemonstrance || defaultBiblicalRemonstrance,
      potentialManipulativeSpeakerProfile: reportData.potentialManipulativeSpeakerProfile || "Not assessed.",
      guidanceOnWiseConfrontation: reportData.guidanceOnWiseConfrontation || "General biblical principles apply.",
      calvinismDeepDiveAnalysis: reportData.calvinismDeepDiveAnalysis, 
      aiChatTranscript: [], 
      prayerAnalyses: reportData.prayerAnalyses || [], // Store prayer analyses
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
      moralisticFramingAnalysis: data.moralisticFramingAnalysis || defaultMoralisticFraming,
      virtueSignallingAnalysis: data.virtueSignallingAnalysis || defaultVirtueSignalling,
      identifiedIsms: data.identifiedIsms,
      calvinismAnalysis: data.calvinismAnalysis,
      biblicalRemonstrance: data.biblicalRemonstrance || defaultBiblicalRemonstrance,
      potentialManipulativeSpeakerProfile: data.potentialManipulativeSpeakerProfile || "Not assessed.",
      guidanceOnWiseConfrontation: data.guidanceOnWiseConfrontation || "General biblical principles apply.",
      calvinismDeepDiveAnalysis: data.calvinismDeepDiveAnalysis,
      aiChatTranscript: data.aiChatTranscript || [],
      prayerAnalyses: data.prayerAnalyses || [], // Fetch prayer analyses
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
