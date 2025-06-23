
"use server";

import { analyzeContent, type AnalyzeContentInput, type AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import { calvinismDeepDive, type CalvinismDeepDiveInput, type CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";
import { chatWithReport, type ChatWithReportInput, type ChatWithReportOutput, type ChatMessageHistory as GenkitChatMessageHistory } from "@/ai/flows/chat-with-report-flow";
import { transcribeYouTubeVideoFlow, type TranscribeYouTubeInput, type TranscribeYouTubeOutput } from "@/ai/flows/transcribe-youtube-flow";
import { isolateSermonAI } from "@/ai/flows/isolateSermonAI";
import { analyzePrayersInText, type PrayerAnalysisInput, type PrayerAnalysisOutput } from "@/ai/flows/analyze-prayer-flow"; 
import { alternatePrayerAnalysisFlow, type AlternatePrayerAnalysisInput, type AlternatePrayerAnalysisOutput } from "@/ai/flows/alternate-prayer-analysis-flow"; // Import APA flow
import { generateInDepthCalvinismReport, type InDepthCalvinismReportInput, type InDepthCalvinismReportOutput } from "@/ai/flows/in-depth-calvinism-report-flow"; // Import IDCR flow
import type { AnalysisReport, ClientChatMessage } from "@/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Updated schema to reflect new input structure for analyzeSubmittedContent
const analyzeContentServerSchema = z.object({
  content: z.string().min(1, "Content cannot be empty."), // This will be the "preparedText"
  originalRawContent: z.string().min(1, "Original raw content cannot be empty."), // The content before preparation
  analysisType: z.enum(["text", "file_audio", "file_video", "file_document", "youtube_video"]),
  analyzePrayers: z.boolean().optional(),
  requestIDCR: z.boolean().optional(), // New field for IDCR request
  referenceMaterial: z.string().optional(),
});


const calvinismDeepDiveSchema = z.object({
  content: z.string().min(1, "Content for deep dive cannot be empty."),
});

// Temporary in-memory store for reports
interface StoredReportData extends AnalyzeContentOutput {
  title: string;
  originalContent: string; // This will store the raw, pre-isolation content
  preparedContent?: string; // This will store the content post-isolation, used for analysis
  analysisType: AnalysisReport['analysisType'];
  createdAt: Date;
  fileName?: string;
  calvinismDeepDiveAnalysis?: string; 
  aiChatTranscript?: ClientChatMessage[];
  prayerAnalyses?: PrayerAnalysisOutput; 
  alternatePrayerAnalyses?: AnalysisReport['alternatePrayerAnalyses'];
  inDepthCalvinismReport?: InDepthCalvinismReportOutput; // Added for IDCR results
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
      originalContent: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. This sermon explores the depths of God's sovereignty in salvation, referencing key scriptures and theological arguments. It discusses concepts such as election, predestination, and the irresistible grace of God, aiming to provide a clear understanding from a perspective rooted in the KJV 1611. The implications of these doctrines on Christian life and evangelism are also considered. A sample prayer: Lord, we thank you for your sovereign choice.",
      preparedContent: "This sermon explores the depths of God's sovereignty in salvation, referencing key scriptures and theological arguments. It discusses concepts such as election, predestination, and the irresistible grace of God, aiming to provide a clear understanding from a perspective rooted in the KJV 1611. The implications of these doctrines on Christian life and evangelism are also considered.",
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
      prayerAnalyses: [{ identifiedPrayerText: "Lord, we thank you for your sovereign choice.", kjvAlignmentAssessment: "Acknowledges God's sovereignty, which is a KJV principle. However, the phrasing 'sovereign choice' can be a loaded term often associated with Calvinistic election, which may warrant deeper examination depending on the sermon's context.", manipulativeLanguage: { hasPotentiallyManipulativeElements: false }, overallAssessment: "The prayer is concise and appears doctrinally sound on the surface, but the term 'sovereign choice' could be a subtle indicator of underlying Calvinistic theology." }], 
      alternatePrayerAnalyses: [], 
      inDepthCalvinismReport: undefined, // Initialize IDCR for sample
    };
    global.tempReportDatabaseGlobal[sampleReportId] = sampleReportData;
  }
  tempReportDatabase = global.tempReportDatabaseGlobal;
}


// Server Action for Isolating Sermon/Lecture from text
export async function isolateSermonOrLectureAction(
  rawTextContent: string
): Promise<{ preparedText: string; isolationWarning?: string } | { error: string }> {
  if (!rawTextContent || typeof rawTextContent !== 'string' || rawTextContent.trim() === "") {
    return { error: "Text content for preparation cannot be empty." };
  }
  try {
    const isolationResult = await isolateSermonAI({ transcript: rawTextContent });
    if (isolationResult.sermon && isolationResult.sermon.trim() !== "" && isolationResult.sermon !== "No sermon or lecture content found.") {
      return { preparedText: isolationResult.sermon, isolationWarning: isolationResult.warning };
    } else {
      // If isolation fails to find a distinct sermon, we might return the original text or a specific message.
      // For now, let's return the original if no sermon is explicitly identified but the input wasn't just "No sermon..."
      // Or, if it explicitly says "No sermon...", we might want to indicate that.
      // For this use case, if isolation says "No sermon...", we treat it as such. Otherwise, use original.
      if (isolationResult.sermon === "No sermon or lecture content found.") {
        return { error: "No distinct sermon or lecture content could be identified. Analysis might be less effective or use the full text." }; // Or return { preparedText: rawTextContent, isolationWarning: "No sermon/lecture found; using full text." }
      }
      return { preparedText: rawTextContent, isolationWarning: "Sermon/lecture isolation did not find distinct content; using original text for analysis." };
    }
  } catch (error) {
    console.error("Error during sermon/lecture isolation action:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred during text preparation." };
  }
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
): Promise<(AnalyzeContentOutput & { prayerAnalyses?: PrayerAnalysisOutput; inDepthCalvinismReport?: InDepthCalvinismReportOutput }) | { error: string }> {
  
  const validatedSubmission = analyzeContentServerSchema.safeParse(submission);
  if (!validatedSubmission.success) {
      return { error: validatedSubmission.error.errors.map(e => e.message).join(", ") };
  }
  // 'content' here is the preparedText, 'originalRawContent' is the raw input before preparation
  const { content: preparedContentToAnalyze, originalRawContent, analysisType, analyzePrayers, requestIDCR, referenceMaterial } = validatedSubmission.data;

  let mainAnalysisResult: AnalyzeContentOutput;
  let prayerAnalysisResults: PrayerAnalysisOutput | undefined = undefined;
  let idcrResult: InDepthCalvinismReportOutput | undefined = undefined;
  let isolationWarningMessage: string | undefined = undefined; // This warning is from the preparation step, not this action

  // The 'preparedContentToAnalyze' is already the result of sermon isolation if 'text' type.
  // So, we don't need to call isolateSermonAI here again.
  // However, the form might still pass an isolationWarning from its preparation step if needed.

  // Prepare input for main content analysis
  const mainAnalysisInput: AnalyzeContentInput = { 
    content: preparedContentToAnalyze,
    referenceMaterial: referenceMaterial 
  };

  try {
    // Perform main content analysis
    mainAnalysisResult = await analyzeContent(mainAnalysisInput);
    if ('error' in mainAnalysisResult) { 
      return mainAnalysisResult; // This error would be from the analyzeContent flow itself
    }
    
    // If analyzePrayers is true, perform prayer analysis on the ORIGINAL content
    if (analyzePrayers) {
      try {
        prayerAnalysisResults = await analyzePrayersInText({ textContent: originalRawContent });
      } catch (prayerError) {
        console.error("Error during prayer analysis step:", prayerError);
        mainAnalysisResult.summary += "\n\nWarning: Prayer analysis encountered an error and could not be completed.";
      }
    }

    // If requestIDCR is true, perform In-Depth Calvinistic Report on PREPARED content
    if (requestIDCR) {
      try {
        idcrResult = await generateInDepthCalvinismReport({ content: preparedContentToAnalyze });
      } catch (idcrError) {
        console.error("Error during IDCR generation:", idcrError);
        mainAnalysisResult.summary += "\n\nWarning: In-Depth Calvinistic Report generation encountered an error and could not be completed.";
      }
    }

    // Combine results
    const finalReport: AnalyzeContentOutput & { prayerAnalyses?: PrayerAnalysisOutput; inDepthCalvinismReport?: InDepthCalvinismReportOutput } = {
      ...mainAnalysisResult,
      prayerAnalyses: prayerAnalysisResults || [], 
      inDepthCalvinismReport: idcrResult,
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
  reportData: AnalyzeContentOutput & { prayerAnalyses?: PrayerAnalysisOutput; inDepthCalvinismReport?: InDepthCalvinismReportOutput }, 
  title: string,
  originalContent: string, // This is the raw content before any preparation
  preparedContent: string, // This is the content used for analysis (after sermon isolation if applicable)
  analysisType: AnalysisReport['analysisType'],
  fileName?: string
): Promise<string | { error: string }> {
  try {
    const reportId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const dataToStore: StoredReportData = {
      ...reportData, 
      title,
      originalContent, 
      preparedContent,
      analysisType,
      createdAt: new Date(),
      moralisticFramingAnalysis: reportData.moralisticFramingAnalysis || defaultMoralisticFraming,
      virtueSignallingAnalysis: reportData.virtueSignallingAnalysis || defaultVirtueSignalling,
      biblicalRemonstrance: reportData.biblicalRemonstrance || defaultBiblicalRemonstrance,
      potentialManipulativeSpeakerProfile: reportData.potentialManipulativeSpeakerProfile || "Not assessed.",
      guidanceOnWiseConfrontation: reportData.guidanceOnWiseConfrontation || "General biblical principles apply.",
      calvinismDeepDiveAnalysis: reportData.calvinismDeepDiveAnalysis, 
      aiChatTranscript: [], 
      prayerAnalyses: reportData.prayerAnalyses || [], 
      alternatePrayerAnalyses: [], 
      inDepthCalvinismReport: reportData.inDepthCalvinismReport, // Save IDCR
    };

    if (analysisType !== 'text' && fileName) {
      dataToStore.fileName = fileName;
    }
    
    tempReportDatabase[reportId] = dataToStore;
    return reportId;
  } catch (e) {
    console.error("Error saving report to temp DB:", e);
    const errorMessage = e instanceof Error ? e.message : "Failed to save report data."
    return { error: errorMessage };
  }
}

export async function fetchReportFromDatabase(reportId: string): Promise<AnalysisReport | null> {
  if (tempReportDatabase[reportId]) {
    const data = tempReportDatabase[reportId];
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
      preparedContent: data.preparedContent,
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
      prayerAnalyses: data.prayerAnalyses || [], 
      alternatePrayerAnalyses: data.alternatePrayerAnalyses || [],
      inDepthCalvinismReport: data.inDepthCalvinismReport, // Fetch IDCR
    };
  }
  
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

export async function runAlternatePrayerAnalysisAction(
  reportId: string,
  prayerTextToAnalyze: string
): Promise<{ success: boolean; analysis?: AlternatePrayerAnalysisOutput; error?: string }> {
  if (!tempReportDatabase || !tempReportDatabase[reportId]) {
    return { success: false, error: "Original report not found to append APA result." };
  }

  try {
    const apaInput: AlternatePrayerAnalysisInput = { prayerText: prayerTextToAnalyze };
    const analysisResult = await alternatePrayerAnalysisFlow(apaInput);

    const newApaEntry = {
      originalPrayerText: prayerTextToAnalyze,
      analysis: analysisResult,
      analyzedAt: new Date(),
    };

    if (!tempReportDatabase[reportId].alternatePrayerAnalyses) {
      tempReportDatabase[reportId].alternatePrayerAnalyses = [];
    }
    tempReportDatabase[reportId].alternatePrayerAnalyses!.push(newApaEntry);
    
    revalidatePath(`/reports/${reportId}`);
    return { success: true, analysis: analysisResult };

  } catch (error) {
    console.error("Error in runAlternatePrayerAnalysisAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during Alternate Prayer Analysis.";
    return { success: false, error: errorMessage };
  }
}
