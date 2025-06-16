
import type { LucideIcon } from "lucide-react";
import type { AnalyzeContentOutput as FullAnalyzeContentOutput, AnalyzeContentInput as FullAnalyzeContentInput } from "@/ai/flows/analyze-content"; // Renamed to avoid conflict
import type { z } from "zod";
import type { AnalyzeTeachingInputSchema, AnalyzeTeachingOutputSchema } from "@/ai/flows/analyze-teaching-flow";
import type { PrayerAnalysisInput as FullPrayerAnalysisInput, PrayerAnalysisOutput as FullPrayerAnalysisOutput } from "@/ai/flows/analyze-prayer-flow";


export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  label?: string;
  description?: string;
};

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavItem[];
    }
);

// For AI Chat Dialog
export interface ClientChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: string[];
}

// Use the imported FullAnalyzeContentOutput type
export type AnalysisReport = FullAnalyzeContentOutput & {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  fileURL?: string;
  analysisType: "text" | "file_audio" | "file_video" | "file_document" | "youtube_video";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date; // Or string if you store as ISO string
  updatedAt: Date; // Or string
  originalContent?: string; // For text submissions
  calvinismDeepDiveAnalysis?: string; 
  aiChatTranscript?: ClientChatMessage[]; 
  prayerAnalyses?: FullPrayerAnalysisOutput; // Array of prayer analysis results
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // KJV Sentinel specific fields
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentReference = {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadDate: Date;
  // Optional: extracted text snippet for preview, indexed keywords
  extractedText?: string;
  indexedKeywords?: string[];
};

// Re-exporting the full types from the AI flow
export type AnalyzeContentInput = FullAnalyzeContentInput;
export type AnalyzeContentOutput = FullAnalyzeContentOutput;

export type { CalvinismDeepDiveInput, CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";


// Types for the new Teaching Analysis Feature
export type AnalyzeTeachingInput = z.infer<typeof AnalyzeTeachingInputSchema>;
export type AnalyzeTeachingOutput = z.infer<typeof AnalyzeTeachingOutputSchema>;

export type PodcastData = {
  status: "pending" | "generating" | "generated" | "failed" | "exporting" | "exported";
  contentScope: Array<"Full Report" | "Church History" | "Promoters" | "Church Council" | "Letter of Caution" | "Warnings">;
  treatmentType: "General Overview" | "Deep";
  audioUrl?: string;
  exportOptions: Array<"Email" | "Google Drive">;
  exportStatus: "pending" | "completed" | "failed";
  lastError?: string;
};

export type AudioRecordingData = {
  status: "pending" | "saved" | "transcribed" | "failed";
  audioUrl: string; // URL to audio file in Firebase Storage (or simulated path)
  transcription?: string; // Transcribed text, might be same as main teaching text
  timestamp: Date;
};

export type TeachingAnalysisReport = {
  id: string;
  userId: string; // Simulated user ID
  // Inputs from form
  teaching: string;
  recipientNameTitle: string;
  tonePreference: 'gentle' | 'firm' | 'urgent';
  outputFormats: Array<'PDF' | 'TXT' | 'RTF' | 'Email' | 'Share' | 'Print'>;
  userEmail?: string;
  additionalNotes?: string;
  // Output from AI
  analysisResult: AnalyzeTeachingOutput;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  analysisMode?: "Overview" | "Scholastic" | "Deep" | "Very Deep" | "Full Summary"; // Added as per prompt
  podcast?: PodcastData | null; // Added for podcast feature
  recording?: AudioRecordingData | null; // Added for audio recording feature
};

export type UserDashboardPreference = {
  enabled: boolean;
  imageUrl?: string;
  notes?: string;
  symbolicPlaceholder?: boolean; // If true, imageUrl is ignored, and a default square is shown
  symbolicColor?: string; // e.g., 'black', '#333333'
};

// Types for Prayer Analysis
export type PrayerAnalysisInput = FullPrayerAnalysisInput;
export type PrayerAnalysisOutput = FullPrayerAnalysisOutput; // This is already an array type
export type SinglePrayerAnalysis = z.infer<typeof SinglePrayerAnalysisSchema>; // If needed for individual items
