
"use server";

import type { AnalysisReport, ClientChatMessage, PrayerAnalysisOutput, AlternatePrayerAnalysisOutput, InDepthCalvinismReportOutput } from "@/types";
import { revalidatePath } from "next/cache";
import { fetchReportFromDatabase as fetchReportData } from "../analyze/actions"; 
import { calvinismDeepDive } from "@/ai/flows/calvinism-deep-dive";
// chatWithReport action is imported from analyze/actions.ts if needed there, or directly from its flow file
// For this file, we primarily need the types and the AnalyzeContentOutput for the global store definition.
import type { AnalyzeContentOutput } from "@/ai/flows/analyze-content";


// Access the global in-memory store from analyze/actions.ts
// Define the structure of the StoredReportData including all new fields.
type StoredReportData = AnalyzeContentOutput & {
  title: string;
  originalContent: string; // Raw content before any preparation
  preparedContent?: string; // Content used for analysis (e.g., after sermon isolation)
  analysisType: AnalysisReport['analysisType'];
  createdAt: Date;
  fileName?: string;
  calvinismDeepDiveAnalysis?: string; 
  aiChatTranscript?: ClientChatMessage[];
  prayerAnalyses?: PrayerAnalysisOutput; 
  alternatePrayerAnalyses?: AnalysisReport['alternatePrayerAnalyses']; 
  inDepthCalvinismReport?: InDepthCalvinismReportOutput; // Added for IDCR results
};

declare global {
  // eslint-disable-next-line no-var
  var tempReportDatabaseGlobal: {
    [key: string]: StoredReportData 
  } | undefined;
}

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


export async function fetchReportsList(): Promise<AnalysisReport[]> {
  console.log("Server Action: Fetching reports list from global store (simulated for full reports)");

  const reportsList: AnalysisReport[] = [];
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
        status: "completed", 
        createdAt: reportData.createdAt,
        updatedAt: reportData.createdAt, 
        originalContent: reportData.originalContent,
        preparedContent: reportData.preparedContent,
        summary: reportData.summary,
        scripturalAnalysis: reportData.scripturalAnalysis,
        historicalContext: reportData.historicalContext,
        etymology: reportData.etymology,
        exposure: reportData.exposure,
        fallacies: reportData.fallacies,
        manipulativeTactics: reportData.manipulativeTactics,
        moralisticFramingAnalysis: reportData.moralisticFramingAnalysis || defaultMoralisticFraming,
        virtueSignallingAnalysis: reportData.virtueSignallingAnalysis || defaultVirtueSignalling,
        identifiedIsms: reportData.identifiedIsms,
        calvinismAnalysis: reportData.calvinismAnalysis,
        biblicalRemonstrance: reportData.biblicalRemonstrance || defaultBiblicalRemonstrance,
        potentialManipulativeSpeakerProfile: reportData.potentialManipulativeSpeakerProfile || "Not assessed.",
        guidanceOnWiseConfrontation: reportData.guidanceOnWiseConfrontation || "General biblical principles apply.",
        calvinismDeepDiveAnalysis: reportData.calvinismDeepDiveAnalysis,
        aiChatTranscript: reportData.aiChatTranscript || [],
        prayerAnalyses: reportData.prayerAnalyses || [], 
        alternatePrayerAnalyses: reportData.alternatePrayerAnalyses || [], 
        inDepthCalvinismReport: reportData.inDepthCalvinismReport, // Include IDCR
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
    global.tempReportDatabaseGlobal = {}; // Clear the object
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
    // Note: This calls the OLDER, simpler calvinismDeepDive flow, not the new IDCR flow.
    // The IDCR is now generated during initial submission if requested.
    // This function might need to be re-evaluated if it's meant to trigger the new IDCR.
    // For now, it correctly calls the existing `calvinismDeepDive` flow.
    const deepDiveResult = await calvinismDeepDive({ content: report.originalContent });
    if (deepDiveResult && 'error' in deepDiveResult) {
        return { success: false, message: `Deep dive failed: ${deepDiveResult.error}` };
    }
    if (deepDiveResult && deepDiveResult.analysis) {
        if (global.tempReportDatabaseGlobal && global.tempReportDatabaseGlobal[reportId]) {
          global.tempReportDatabaseGlobal[reportId].calvinismDeepDiveAnalysis = deepDiveResult.analysis;
          revalidatePath(`/reports/${reportId}`); 
        }
        return { success: true, message: "In-depth Calvinism report generated and added to the current report.", analysis: deepDiveResult.analysis };
    }
    return { success: false, message: "Deep dive completed but no analysis returned." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during deep dive.";
    return { success: false, message: errorMessage };
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

  output += `--- Original Content Submitted ---\n${report.originalContent || 'N/A'}\n\n`;
  if (report.preparedContent && report.preparedContent !== report.originalContent) {
    output += `--- Prepared Content (Used for Analysis) ---\n${report.preparedContent}\n\n`;
  }
  output += `--- Summary ---\n${report.summary || 'N/A'}\n\n`;

  output += `--- Scriptural Analysis (KJV 1611) ---\n`;
  if (report.scripturalAnalysis && report.scripturalAnalysis.length > 0) {
    report.scripturalAnalysis.forEach(sa => {
      output += `Verse: ${sa.verse}\nAnalysis: ${sa.analysis}\n\n`;
    });
  } else { output += `N/A\n\n`; }

  output += `--- Historical Context ---\n${report.historicalContext || 'N/A'}\n\n`;
  output += `--- Etymology of Key Terms ---\n${report.etymology || 'N/A'}\n\n`;
  output += `--- Exposure to Harmful Ideologies ---\n${report.exposure || 'N/A'}\n\n`;

  output += `--- Identified Logical Fallacies (Overall) ---\n`;
  if (report.fallacies && report.fallacies.length > 0) {
    report.fallacies.forEach(f => {
      output += `Type: ${f.type}\nDescription: ${f.description}\n\n`;
    });
  } else { output += `N/A\n\n`; }

  output += `--- Identified Manipulative Tactics (Overall) ---\n`;
  if (report.manipulativeTactics && report.manipulativeTactics.length > 0) {
    report.manipulativeTactics.forEach(mt => {
      output += `Technique: ${mt.technique}\nDescription: ${mt.description}\n\n`;
    });
  } else { output += `N/A\n\n`; }

  output += `--- Moralistic Framing Analysis ---\n`;
  if (report.moralisticFramingAnalysis) {
    const mfa = report.moralisticFramingAnalysis;
    output += `Description: ${mfa.description}\n`;
    output += `Advantages for Speaker Obedience: ${mfa.advantagesForSpeakerObedience}\n`;
    output += `Linked Logical Fallacies:\n`;
    if (mfa.linkedLogicalFallacies && mfa.linkedLogicalFallacies.length > 0) {
      mfa.linkedLogicalFallacies.forEach(llf => output += `  - Fallacy: ${llf.fallacy}\n    Evidence: ${llf.evidence}\n`);
    } else { output += `  N/A\n`; }
    output += `Historical Parallels:\n`;
    if (mfa.historicalParallels && mfa.historicalParallels.length > 0) {
      mfa.historicalParallels.forEach(hp => output += `  - Example: ${hp.example}\n    Description: ${hp.description}\n`);
    } else { output += `  N/A\n`; }
  } else { output += `N/A\n`; }
  output += `\n`;
  
  output += `--- Virtue Signalling Analysis ---\n`;
  if (report.virtueSignallingAnalysis) {
    const vsa = report.virtueSignallingAnalysis;
    output += `Description: ${vsa.description}\n`;
    output += `Advantages for Speaker Obedience: ${vsa.advantagesForSpeakerObedience}\n`;
    output += `Linked Logical Fallacies:\n`;
    if (vsa.linkedLogicalFallacies && vsa.linkedLogicalFallacies.length > 0) {
      vsa.linkedLogicalFallacies.forEach(llf => output += `  - Fallacy: ${llf.fallacy}\n    Evidence: ${llf.evidence}\n`);
    } else { output += `  N/A\n`; }
    output += `Historical Parallels:\n`;
    if (vsa.historicalParallels && vsa.historicalParallels.length > 0) {
      vsa.historicalParallels.forEach(hp => output += `  - Example: ${hp.example}\n    Description: ${hp.description}\n`);
    } else { output += `  N/A\n`; }
  } else { output += `N/A\n`; }
  output += `\n`;

  output += `--- Identified Theological 'Isms' ---\n`;
  if (report.identifiedIsms && report.identifiedIsms.length > 0) {
    report.identifiedIsms.forEach(ism => {
      output += `Ism: ${ism.ism}\nDescription: ${ism.description}\nEvidence: ${ism.evidence}\n\n`;
    });
  } else { output += `N/A\n\n`; }

  output += `--- Calvinism Analysis (KJV 1611) ---\n`;
  if (report.calvinismAnalysis && report.calvinismAnalysis.length > 0) {
    report.calvinismAnalysis.forEach(ca => {
      output += `Element: ${ca.element}\nDescription: ${ca.description}\nEvidence: ${ca.evidence}\nInfiltration Tactic: ${ca.infiltrationTactic || 'N/A'}\n\n`;
    });
  } else { output += `N/A\n\n`; }
  
  if (report.calvinismDeepDiveAnalysis) {
    output += `--- In-Depth Calvinism Examination (Legacy Deep Dive) ---\n${report.calvinismDeepDiveAnalysis}\n\n`;
  }

  if (report.inDepthCalvinismReport) {
    const idcr = report.inDepthCalvinismReport;
    output += `--- In-Depth Calvinistic Report (IDCR) ---\n`;
    output += `1. Overt Calvinism Analysis:\n${idcr.overtCalvinismAnalysis}\n\n`;
    output += `2. Subtle Communication Analysis:\n${idcr.subtleCommunicationAnalysis}\n\n`;
    output += `3. Psychological Tactics Analysis:\n${idcr.psychologicalTacticsAnalysis}\n\n`;
    output += `4. God's Character Representation:\n`;
    output += `   God the Father: ${idcr.godsCharacterRepresentation.godTheFather}\n`;
    output += `   Lord Jesus Christ: ${idcr.godsCharacterRepresentation.lordJesusChrist}\n`;
    output += `   Holy Spirit: ${idcr.godsCharacterRepresentation.holySpirit}\n\n`;
    output += `5. Cessationism Analysis:\n${idcr.cessationismAnalysis}\n\n`;
    output += `6. Anti-Semitism Analysis:\n${idcr.antiSemitismAnalysis}\n\n`;
    output += `7. Further Unearthing Notes:\n${idcr.furtherUnearthingNotes}\n\n`;
  }

  output += `--- Biblical Remonstrance (Detailed Assessment) ---\n`;
  if (report.biblicalRemonstrance) {
    const br = report.biblicalRemonstrance;
    output += `Scriptural Foundation Assessment: ${br.scripturalFoundationAssessment}\n`;
    output += `Historical-Theological Contextualization: ${br.historicalTheologicalContextualization}\n`;
    output += `Rhetorical and Homiletical Observations: ${br.rhetoricalAndHomileticalObservations}\n`;
    output += `Theological Framework Remarks: ${br.theologicalFrameworkRemarks}\n`;
    output += `KJV Scriptural Counterpoints: ${br.kjvScripturalCounterpoints}\n`;
    output += `Suggestions For Further Study: ${br.suggestionsForFurtherStudy}\n`;
  } else { output += `N/A\n`; }
  output += `\n`;
  
  output += `--- Potential Manipulative Speaker Profile ---\n${report.potentialManipulativeSpeakerProfile || 'N/A'}\n\n`;
  output += `--- Guidance on Wise Confrontation ---\n${report.guidanceOnWiseConfrontation || 'N/A'}\n\n`;

  if (report.prayerAnalyses && report.prayerAnalyses.length > 0) {
    output += `--- Prayer Analysis (Initial) ---\n`;
    report.prayerAnalyses.forEach((pa, index) => {
      output += `Prayer ${index + 1} Text: "${pa.identifiedPrayerText}"\n`;
      output += `  KJV Alignment: ${pa.kjvAlignmentAssessment}\n`;
      output += `  Manipulative Language: ${pa.manipulativeLanguage.hasPotentiallyManipulativeElements ? 'Detected' : 'Not Detected'}\n`;
      if (pa.manipulativeLanguage.hasPotentiallyManipulativeElements) {
        output += `    Evidence: ${pa.manipulativeLanguage.evidence?.join('; ') || 'N/A'}\n`;
        output += `    Description: ${pa.manipulativeLanguage.description || 'N/A'}\n`;
      }
      output += `  Overall Assessment: ${pa.overallAssessment}\n\n`;
    });
  }

  if (report.alternatePrayerAnalyses && report.alternatePrayerAnalyses.length > 0) {
    output += `--- Alternate Prayer Analysis Results ---\n`;
    report.alternatePrayerAnalyses.forEach((apaItem, index) => {
      const apa = apaItem.analysis;
      output += `APA for Prayer: "${apaItem.originalPrayerText}" (Analyzed: ${new Date(apaItem.analyzedAt).toLocaleString()})\n`;
      output += `  Overall Summary: ${apa.overallSummary}\n`;
      output += `  Virtue Signalling Assessment: ${apa.virtueSignalling.assessment}\n`;
      apa.virtueSignalling.items.forEach(item => {
        output += `    - Quote: "${item.quote}"\n      Analysis: ${item.analysis}\n`;
      });
      output += `  Manipulative Phrasing Assessment: ${apa.manipulativePhrasing.assessment}\n`;
      apa.manipulativePhrasing.items.forEach(item => {
        output += `    - Type: ${item.type}\n      Quote: "${item.quote}"\n      Analysis: ${item.analysis}\n`;
      });
      output += `  KJV Comparison:\n`;
      output += `    Alignment: ${apa.kjvComparison.alignmentWithScripturalPrinciples}\n`;
      output += `    Warnings Observed: ${apa.kjvComparison.specificWarningsObserved}\n`;
      output += `    Positive Aspects: ${apa.kjvComparison.positiveAspects}\n`;
      output += `    Areas of Concern: ${apa.kjvComparison.areasOfConcern}\n`;
      output += `  Overall Spiritual Integrity: ${apa.overallSpiritualIntegrityAssessment}\n\n`;
    });
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
  return output;
}

export async function saveChatToReportAction(
  originalReportId: string,
  chatMessages: ClientChatMessage[]
): Promise<{ success: boolean; message: string; newReportId?: string }> {
  console.log(`Server Action: Creating new report with chat from original report ID: ${originalReportId}`);

  if (!global.tempReportDatabaseGlobal) {
    global.tempReportDatabaseGlobal = {}; 
    console.warn("tempReportDatabaseGlobal was not initialized. Initializing now.");
    return { success: false, message: "Internal server error: Database not initialized." };
  }

  const originalReportData = global.tempReportDatabaseGlobal[originalReportId];

  if (!originalReportData) {
    console.error(`Original report ID ${originalReportId} not found in tempReportDatabaseGlobal.`);
    return { success: false, message: `Original report ${originalReportId} not found. Could not save chat.` };
  }

  const newReportData = JSON.parse(JSON.stringify(originalReportData));
  
  const newReportId = `${originalReportId}-chat-${Date.now()}`;
  newReportData.title = `${originalReportData.title} (with AI Queries)`;
  newReportData.aiChatTranscript = chatMessages;
  newReportData.createdAt = new Date(); 
  // Note: 'id' field is not part of StoredReportData in the global store keys, the key itself is the ID.
  // So, we don't set newReportData.id = newReportId;

  global.tempReportDatabaseGlobal[newReportId] = newReportData;

  revalidatePath(`/reports`); 
  revalidatePath(`/reports/${newReportId}`); 
  
  return { 
    success: true, 
    message: `New report version "${newReportData.title}" created with chat transcript.`,
    newReportId: newReportId
  };
}
    
