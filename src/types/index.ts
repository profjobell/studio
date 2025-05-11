import type { LucideIcon } from "lucide-react";
import type { AnalyzeContentOutput } from "@/ai/flows/analyze-content";
import type { z } from "zod";
import type { AnalyzeTeachingInputSchema, AnalyzeTeachingOutputSchema } from "@/ai/flows/analyze-teaching-flow";


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


export type AnalysisReport = AnalyzeContentOutput & {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  fileURL?: string;
  analysisType: "text" | "file_audio" | "file_video" | "file_document";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date; // Or string if you store as ISO string
  updatedAt: Date; // Or string
  originalContent?: string; // For text submissions
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

// Simplified types for AI flow outputs for now
// These are already defined in the AI flow files but re-exporting or creating specific report types can be useful.
export type { AnalyzeContentInput, AnalyzeContentOutput } from "@/ai/flows/analyze-content";
export type { CalvinismDeepDiveInput, CalvinismDeepDiveOutput } from "@/ai/flows/calvinism-deep-dive";


// Types for the new Teaching Analysis Feature
export type AnalyzeTeachingInput = z.infer<typeof AnalyzeTeachingInputSchema>;
export type AnalyzeTeachingOutput = z.infer<typeof AnalyzeTeachingOutputSchema>;

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
};