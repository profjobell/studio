
'use server';

import { z } from 'zod';
import { analyzeTeachingAgainstKJV, type AnalyzeTeachingInput, type AnalyzeTeachingOutput } from '@/ai/flows/analyze-teaching-flow';
import type { TeachingAnalysisReport, PodcastData, AudioRecordingData } from '@/types';

// Schema for form validation before calling AI
export const TeachingAnalysisFormSchema = z.object({
  teaching: z.string().min(20, 'Teaching content must be at least 20 characters.'),
  recipientNameTitle: z.string().min(3, 'Recipient details are required.'),
  tonePreference: z.enum(['gentle', 'firm', 'urgent']),
  outputFormats: z.array(z.enum(['PDF', 'TXT', 'RTF', 'Email', 'Share', 'Print'])).min(1, 'At least one output format must be selected.'),
  userEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  additionalNotes: z.string().optional(),
}).refine(data => {
  if ((data.outputFormats.includes('Email') || data.outputFormats.includes('Share')) && (!data.userEmail || data.userEmail.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Email address is required if Email or Share output format is selected.',
  path: ['userEmail'],
});


// Temporary in-memory store for teaching_analyses
interface TempTeachingAnalysisStore {
  [key: string]: TeachingAnalysisReport;
}

// Make tempTeachingAnalysisDatabase survive hot-reloads in dev by attaching to global
declare global {
  // eslint-disable-next-line no-var
  var tempTeachingAnalysisDatabaseGlobal: TempTeachingAnalysisStore | undefined;
}

let tempTeachingAnalysisDatabase: TempTeachingAnalysisStore;

if (process.env.NODE_ENV === 'production') {
  tempTeachingAnalysisDatabase = {};
} else {
  if (!global.tempTeachingAnalysisDatabaseGlobal) {
    global.tempTeachingAnalysisDatabaseGlobal = {};
    // Pre-populate a sample teaching analysis for development
    const sampleTeachingAnalysisId = "teach-analysis-001";
    const sampleTeachingAnalysisData: TeachingAnalysisReport = {
      id: sampleTeachingAnalysisId,
      userId: "user-123", // Simulated
      teaching: "The 'Word of Faith' teaching that believers can use faith as a force to create their own realities and material wealth.",
      recipientNameTitle: "Pastor Everyman",
      tonePreference: "firm",
      outputFormats: ["PDF", "TXT"],
      userEmail: "test@example.com",
      additionalNotes: "Concerned about its prevalence on television.",
      analysisResult: {
        churchHistoryContext: "The Word of Faith movement, while having roots in earlier faith healing and New Thought philosophies of the 19th century, largely coalesced in the mid-to-late 20th century. Figures like E.W. Kenyon are often cited as precursors, with Kenneth Hagin Sr. being a key systematizer and popularizer. It gained significant traction through televangelism from the 1970s onwards. Historically, mainstream Christian denominations have critiqued its core tenets, particularly its views on faith, prosperity, and suffering, as deviating from orthodox biblical interpretation based on a KJV 1611 understanding which emphasizes God's sovereignty and the complexities of faith not as a manipulative force but as trust in God's will.",
        promotersDemonstrators: [
          { name: "Kenneth Hagin Sr.", description: "Often called the 'father' of the modern Word of Faith movement, Hagin's teachings on faith, healing, and prosperity have been highly influential through his Rhema Bible Training Centers and numerous books." },
          { name: "Kenneth Copeland", description: "A prominent televangelist and author, Copeland has widely promoted Word of Faith doctrines, emphasizing positive confession and financial prosperity as a right of believers." },
          { name: "Creflo Dollar", description: "Known for his teachings on prosperity and tithing, Dollar is a contemporary figure who espouses many Word of Faith principles to a large audience." }
        ],
        churchCouncilSummary: "Major historical church councils (Nicaea, Chalcedon, etc.) did not directly address the 'Word of Faith' movement as it is a modern phenomenon. However, foundational orthodox doctrines established by these councils regarding the nature of God, Christ, and salvation often stand in contrast to some Word of Faith interpretations. For example, the sovereignty of God, as understood from a KJV 1611 perspective and affirmed implicitly by early councils, challenges the idea of faith as a force man controls. Gnostic-like tendencies (secret knowledge or formulas for faith) were condemned early in church history.",
        letterOfClarification: `Dear Pastor Everyman,\n\nGrace be unto you, and peace, from God our Father, and from the Lord Jesus Christ. It is with a spirit of concern, yet in accordance with the scriptural mandate given in Galatians 6:1 (KJV 1611), "Brethren, if a man be overtaken in a fault, ye which are spiritual, restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted," and the charge in 2 Timothy 4:2 (KJV), "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine," that I address the teaching commonly known as 'Word of Faith,' particularly the idea that believers can use faith as a force to create their own realities and material wealth.\n\nThis teaching, when examined against the Holy Scriptures (KJV 1611), presents significant contradictions. For instance, the pursuit of material wealth as a primary indicator of faith or God's blessing is contrary to 1 Timothy 6:5-10 (KJV), which warns against those who suppose "that gain is godliness: from such withdraw thyself," and states, "For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows." Furthermore, our Lord Jesus Christ taught in Matthew 6:24 (KJV), "No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon."\n\nTherefore, I must caution, as the Apostle Paul did in Galatians 1:6-9 (KJV), against any teaching that perverts the gospel of Christ: "But though we, or an angel from heaven, preach any other gospel unto you than that which we have preached unto you, let him be accursed." Similarly, 1 Timothy 1:3-7 (KJV) warns against giving heed to "fables and endless genealogies, which minister questions, rather than godly edifying which is in faith." The focus on faith as a creative force mirrors some of the "profane and vain babblings" warned against in 2 Timothy 2:16-18 (KJV), which "increase unto more ungodliness."\n\nI urge a return to the simplicity and truth of the Gospel, as found in the KJV 1611. A call to repentance, as highlighted in Acts 3:19 (KJV), "Repent ye therefore, and be converted, that your sins may be blotted out," and a godly sorrow that "worketh repentance to salvation not to be repented of," as in 2 Corinthians 7:10 (KJV), are foundational to true Christian faith, rather than a formula for material gain.\n\nI extend this letter in a firm desire for biblical fidelity and remain open to dialogue, praying for a restoration to the pure doctrine of Christ as revealed in His Word.\n\nIn His Service,\nA Watchman for the Truth`,
        biblicalWarnings: "The KJV 1611 Bible sternly warns against teachings that deviate from the apostles' doctrine. Galatians 1:8-9 (KJV) states: 'But though we, or an angel from heaven, preach any other gospel unto you than that which we have preached unto you, let him be accursed. As we said before, so say I now again, If any man preach any other gospel unto you than that ye have received, let him be accursed.' 1 Timothy 1:3-4 (KJV) commands to 'charge some that they teach no other doctrine, Neither give heed to fables...' and James 3:1 (KJV) cautions, 'My brethren, be not many masters, knowing that we shall receive the greater condemnation.' These verses underscore the gravity of doctrinal purity."
      },
      createdAt: new Date("2025-06-01T10:00:00Z"),
      status: "completed",
      analysisMode: "Deep",
      podcast: null,
      recording: null,
    };
    global.tempTeachingAnalysisDatabaseGlobal[sampleTeachingAnalysisId] = sampleTeachingAnalysisData;
  }
  tempTeachingAnalysisDatabase = global.tempTeachingAnalysisDatabaseGlobal;
}


export async function submitTeachingAnalysisAction(
  formData: z.infer<typeof TeachingAnalysisFormSchema>,
  audioDetails?: { audioUrl: string; transcription: string } // Optional audio details
): Promise<{ success: boolean; message: string; analysisId?: string }> {
  const validatedFields = TeachingAnalysisFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  }

  const { recipientNameTitle, tonePreference, additionalNotes, outputFormats, userEmail } = validatedFields.data;
  // Use transcription from audioDetails if available, otherwise use form's teaching field
  const teachingContent = audioDetails ? audioDetails.transcription : validatedFields.data.teaching;

  const aiInput: AnalyzeTeachingInput = {
    teaching: teachingContent,
    recipientNameTitle,
    tonePreference,
    additionalNotes,
  };

  try {
    const analysisResult = await analyzeTeachingAgainstKJV(aiInput);

    const newAnalysisId = `teach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newReport: TeachingAnalysisReport = {
      id: newAnalysisId,
      userId: 'user-123', // Simulate current user
      teaching: teachingContent,
      recipientNameTitle,
      tonePreference,
      outputFormats,
      userEmail,
      additionalNotes,
      analysisResult,
      createdAt: new Date(),
      status: 'completed',
      analysisMode: "Full Summary", // Default or determine based on inputs
      podcast: null,
      recording: audioDetails ? {
        status: 'transcribed',
        audioUrl: audioDetails.audioUrl,
        transcription: audioDetails.transcription,
        timestamp: new Date(),
      } : null,
    };

    tempTeachingAnalysisDatabase[newAnalysisId] = newReport;
    console.log(`Teaching analysis ${newAnalysisId} saved to temp DB. DB size: ${Object.keys(tempTeachingAnalysisDatabase).length}`);

    return { success: true, message: 'Teaching analysis submitted successfully.', analysisId: newAnalysisId };
  } catch (error) {
    console.error('Error in submitTeachingAnalysisAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    return { success: false, message: errorMessage };
  }
}

export async function fetchTeachingAnalysisFromDatabase(id: string): Promise<TeachingAnalysisReport | null> {
  console.log(`Fetching teaching analysis report from temp DB for ID: ${id}`);
  if (tempTeachingAnalysisDatabase[id]) {
    return tempTeachingAnalysisDatabase[id];
  }
  return null;
}

export async function fetchTeachingAnalysesListFromDatabase(): Promise<TeachingAnalysisReport[]> {
  console.log("Fetching list of teaching analyses from temp DB");
  return Object.values(tempTeachingAnalysisDatabase).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteTeachingAnalysisAction(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to delete teaching analysis report: ${id} from temp DB`);
  if (tempTeachingAnalysisDatabase[id]) {
    delete tempTeachingAnalysisDatabase[id];
    // In a real app, revalidatePath would be used here.
    // revalidatePath('/teaching-reports');
    return { success: true, message: `Teaching analysis ${id} deleted.` };
  }
  return { success: false, message: `Teaching analysis ${id} not found.` };
}

export function generateTxtOutput(report: TeachingAnalysisReport): string {
  const { teaching, recipientNameTitle, analysisResult, createdAt } = report;
  let output = `KJV Sentinel - Teaching Analysis Report\n`;
  output += `Generated: ${createdAt.toLocaleString()}\n\n`;
  output += `Teaching Submitted:\n${teaching}\n\n`;
  output += `Recipient: ${recipientNameTitle}\n\n`;
  output += `--- Church History Context ---\n${analysisResult.churchHistoryContext}\n\n`;
  output += `--- Promoters/Demonstrators ---\n`;
  analysisResult.promotersDemonstrators.forEach(p => {
    output += `  ${p.name}:\n  ${p.description}\n\n`;
  });
  output += `--- Church Council Summary ---\n${analysisResult.churchCouncilSummary}\n\n`;
  output += `--- Letter of Clarification (Tone: ${report.tonePreference}) ---\n${analysisResult.letterOfClarification}\n\n`;
  output += `--- Biblical Warnings on False Teachers (KJV 1611) ---\n${analysisResult.biblicalWarnings}\n\n`;
  
  if(report.additionalNotes) {
    output += `--- Additional User Notes ---\n${report.additionalNotes}\n\n`;
  }
  return output;
}


// --- Podcast Related Server Actions ---

export async function generatePodcastAction(
  analysisId: string,
  reportContent: string,
  treatmentType: string,
  contentScope: string[]
): Promise<{ success: boolean; message: string; audioUrl?: string; podcastData?: PodcastData }> {
  console.log(`Server Action: Generating podcast for analysis ID: ${analysisId}`);
  console.log(`Treatment Type: ${treatmentType}, Content Scope: ${contentScope.join(', ')}`);
  // Simulate AI podcast generation

  if (!tempTeachingAnalysisDatabase[analysisId]) {
    return { success: false, message: `Analysis report ${analysisId} not found.` };
  }

  await new Promise(resolve => setTimeout(resolve, 3000));
  const audioUrl = `/placeholder-podcast-${analysisId}.mp3`; 

  const updatedPodcastData: Partial<PodcastData> = {
    status: 'generated',
    audioUrl: audioUrl,
    treatmentType: treatmentType as PodcastData['treatmentType'],
    contentScope: contentScope as PodcastData['contentScope'],
  };
  
  tempTeachingAnalysisDatabase[analysisId].podcast = {
    ...(tempTeachingAnalysisDatabase[analysisId].podcast ?? {
      status: 'pending', 
      contentScope: [],
      treatmentType: 'General Overview',
      exportOptions: [],
      exportStatus: 'pending',
    }),
    ...updatedPodcastData,
  };

  return { 
    success: true, 
    message: 'Podcast generated successfully (simulated).', 
    audioUrl,
    podcastData: tempTeachingAnalysisDatabase[analysisId].podcast
  };
}

export async function exportPodcastAction(
  analysisId: string,
  audioUrl: string,
  exportOptions: Array<'Email' | 'Google Drive'>,
  email?: string
): Promise<{ success: boolean; message: string, podcastData?: PodcastData }> {
  console.log(`Server Action: Exporting podcast for analysis ID: ${analysisId}`);

  if (!tempTeachingAnalysisDatabase[analysisId]) {
    return { success: false, message: `Analysis report ${analysisId} not found.` };
  }
  if (!tempTeachingAnalysisDatabase[analysisId].podcast) {
    return { success: false, message: `Podcast data not found for report ${analysisId}. Generate podcast first.` };
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (exportOptions.includes('Email') && email) {
    console.log(`Simulating email to: ${email} with attachment: ${audioUrl}`);
  }
  if (exportOptions.includes('Google Drive')) {
    console.log(`Simulating upload to Google Drive: ${audioUrl}`);
  }
  
  tempTeachingAnalysisDatabase[analysisId].podcast!.exportStatus = 'completed';
  tempTeachingAnalysisDatabase[analysisId].podcast!.exportOptions = exportOptions;
  tempTeachingAnalysisDatabase[analysisId].podcast!.status = 'exported';

  return { 
    success: true, 
    message: 'Podcast export process completed (simulated).',
    podcastData: tempTeachingAnalysisDatabase[analysisId].podcast
  };
}

export async function updateTeachingReportPodcastDataAction(
  analysisId: string,
  podcastData: PodcastData
): Promise<{ success: boolean; message: string; updatedReport?: TeachingAnalysisReport }> {
  if (!tempTeachingAnalysisDatabase[analysisId]) {
    return { success: false, message: "Report not found." };
  }
  tempTeachingAnalysisDatabase[analysisId].podcast = podcastData;
  return { 
    success: true, 
    message: "Podcast data updated successfully.",
    updatedReport: tempTeachingAnalysisDatabase[analysisId]
  };
}

// --- Audio Recording Related Server Actions ---
export async function transcribeAudioAction(
  audioDataUrl: string // The audio blob as a data URL from client
): Promise<{ success: boolean; transcription?: string; audioStoragePath?: string; message: string }> {
  try {
    // Simulate upload to storage
    const simulatedFileName = `recording-${Date.now()}-${Math.random().toString(16).substring(2,6)}.webm`; // Assuming webm from recorder
    const audioStoragePath = `/simulated-user-recordings/${simulatedFileName}`;
    console.log(`Simulating "upload" of audio data to (virtual path): ${audioStoragePath}`);
    // In a real app, you'd convert DataURL to Blob/Buffer and upload to Firebase Storage.
    // For now, we just generate a path.

    // Simulate transcription process
    console.log("Simulating transcription...");
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // Simulate network and processing delay

    // Generate a more plausible, varied transcription
    const phrases = [
      "The user discussed the importance of faith in daily life, referencing several key scriptures from the King James Bible.",
      "An interesting point was raised about the historical context of the early church and its relevance today.",
      "This recording seems to focus on the nature of God's sovereignty and human free will, a classic theological debate.",
      "Several questions were posed regarding the interpretation of prophecies in the book of Revelation.",
      "The speaker emphasized the need for discernment in an age of misinformation, urging listeners to study the Word diligently.",
      "A personal testimony was shared, highlighting a moment of divine intervention and guidance.",
      "Concerns were expressed about certain modern teachings deviating from traditional KJV 1611 interpretations."
    ];
    const transcription = phrases[Math.floor(Math.random() * phrases.length)] + ` (Audio path: ${audioStoragePath})`;
    
    console.log(`Simulated transcription: "${transcription}"`);
    
    return { 
      success: true, 
      transcription, 
      audioStoragePath, // This is the simulated path
      message: "Audio processed and transcribed successfully (simulated)." 
    };
  } catch (error) {
    console.error("Error in transcribeAudioAction (simulated):", error);
    const errorMessage = error instanceof Error ? error.message : "Transcription failed due to an unexpected server error.";
    return { success: false, message: errorMessage };
  }
}
