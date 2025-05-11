
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import {
  FileText,
  GraduationCap,
  Library,
  UserCircle,
  Settings,
  Brain,
  FileSignature,
  ListChecks,
  Info,
  Puzzle,
  BookOpen,
  Lightbulb,
  type LucideIcon,
  UploadCloud,
  Printer,
  Share2,
  Download,
  Mail,
  Youtube,
  ExternalLink,
  PlayCircle,
  Podcast,
  Mic, 
} from "lucide-react";
import React from "react";

interface FeatureDetail {
  id: string;
  title: string;
  icon?: LucideIcon;
  description: string;
  points?: string[];
  subFeatures?: Array<{
    title: string;
    description: string;
    icon?: LucideIcon;
    htmlContent?: string;
    points?: string[];
  }>;
}

const featuresData: FeatureDetail[] = [
  {
    id: "introduction",
    title: "Welcome to KJV Sentinel",
    icon: Info,
    description: "A personal welcome message from Professor Joseph Bell:\n\n\"Welcome to KJV Sentinel! This app was created in Nottingham, 2025, in response to an observed and urgent need for the 'non-technical' and 'Un-theologicalized', 'un-Seminaried', Saint of God, to quickly and reliably access the tools and facilities that are Bible Based (the KJV 1611) which are received through the transmission under the oversight and protected delivery of the Blessed Holy Spirit. It is our intention that this little tool will, while we are still able to access and reference Truth and Scripturally affirmed information on the internet, provide a ready and edifying research aide in the process of rightly dividing the Word of Truth. This is merely a 'Litmus tool', an aide and not a replacement for individual delving and diligently '...Rightly divide the Word Of Truth' (2 Timothy 2:15).\"\n\nKJV Sentinel is your comprehensive tool for analyzing religious content through the lens of the King James Version (KJV) 1611 Bible. Our platform helps you understand theological accuracy, historical context, detect manipulative tactics, identify various 'isms', and explore Calvinistic influences within submitted materials.",
  },
  {
    id: "content-analysis",
    title: "Core Content Analysis",
    icon: Search,
    description: "Analyze various forms of religious content including text, documents (PDF, TXT, DOCX), audio (MP3, WAV), and video (MP4, AVI - transcription simulated).",
    subFeatures: [
      {
        title: "Submission Process",
        icon: UploadCloud,
        description: "Easily submit your content via text input or file upload on the 'Analyze Content' page.",
        points: [
          "Provide a title for your analysis.",
          "Choose between direct text input or uploading a file.",
          "Supported files are processed for text extraction/transcription (simulated for audio/video).",
        ],
      },
      {
        title: "Standard Analysis Report",
        icon: FileText,
        description: "Receive a detailed report covering:",
        points: [
          "Summary of Findings",
          "Verse-by-Verse Scriptural Analysis (KJV 1611)",
          "Historical Context",
          "Etymology of Key Terms",
          "Potential Exposure to Harmful Ideologies",
          "Identified Logical Fallacies",
          "Detected Manipulative Tactics",
          "Biblical Remonstrance",
          "Identified Theological 'Isms'",
          "Initial Calvinism Influence Assessment",
        ],
      },
    ],
  },
  {
    id: "teaching-analysis",
    title: "Specific Teaching/Philosophy Analysis",
    icon: FileSignature,
    description: "Dedicated analysis for specific teachings, philosophies, or sayings to evaluate their alignment with KJV 1611 principles. Includes an option to record audio input.",
    subFeatures: [
      {
        title: "Submission Process",
        icon: UploadCloud,
        description: "Submit details on the 'Analyze Teaching' page.",
        points: [
          "Enter the teaching/philosophy/saying directly or use the Audio Recorder.",
          "Specify recipient name and title for the letter of clarification.",
          "Choose the desired tone for the letter (Gentle, Firm, Urgent).",
          "Select output formats (PDF, TXT, RTF, Email, Share, Print).",
          "Optionally provide your email for Email/Share and additional notes.",
        ],
      },
       {
        title: "Audio Recording for Teaching Input",
        icon: Mic,
        description: "Directly record your teaching or thoughts using your device's microphone. The recording will be transcribed (simulated) and used as input for the analysis.",
        points: [
          "Click 'Start Recording' to begin.",
          "Click 'Stop Recording' when finished.",
          "Preview the recording if needed.",
          "Click 'Save & Transcribe'. The transcribed text will populate the teaching input field.",
          "The audio file (simulated storage) and transcription details can be saved with the analysis report.",
          "Option to 'Delete Recording' before saving.",
        ],
      },
      {
        title: "Teaching Analysis Report",
        icon: FileText,
        description: "The generated report includes:",
        points: [
          "Church History Context of the teaching.",
          "Promoters and Demonstrators (key figures/groups).",
          "Summary of relevant Church Council decisions.",
          "A detailed Letter of Clarification/Caution (KJV 1611 based).",
          "Biblical Warnings regarding false teachers and erroneous doctrines.",
          "If audio was recorded, metadata about the recording may be included.",
        ],
      },
    ],
  },
  {
    id: "podcast-generation",
    title: "Podcast Generation (For Teaching Analyses)",
    icon: Podcast,
    description: "Generate an audio podcast from your 'Teaching Analysis' reports. This feature uses simulated Text-to-Speech (as a placeholder for potential NotebookLM integration).",
    subFeatures: [
      {
        title: "How to Generate",
        icon: UploadCloud, 
        description: "After a teaching analysis is completed and you are viewing the report, a 'Podcast Generation' section will appear.",
        points: [
          "Select 'Content Scope': Choose which parts of the report to include (e.g., Full Report, Church History, Letter of Caution).",
          "Select 'Treatment Type': Choose between 'General Overview' (simulated 5-10 min) or 'Deep' (simulated 15-20 min).",
          "Click 'Generate Podcast'. The system will simulate audio generation.",
        ],
      },
      {
        title: "Exporting Your Podcast",
        icon: Share2,
        description: "Once generated, you can export the podcast (simulated):",
        points: [
          "Play the audio directly in the browser.",
          "Select 'Export Options': Choose 'Email' or 'Google Drive'.",
          "If 'Email' is selected, provide your email address.",
          "Click 'Export Podcast'. The system will simulate sending an email or uploading to Google Drive.",
        ],
      },
      {
        title: "Important Notes",
        icon: Info,
        description: "Current implementation details:",
        points: [
          "Podcast generation is simulated. A placeholder audio file/link is used.",
          "NotebookLM integration is conceptual due to API limitations. Google Cloud Text-to-Speech is a potential fallback.",
          "This feature is currently available for reports generated via the 'Analyze Teaching' functionality.",
        ],
      }
    ],
  },
  {
    id: "analysis-depths",
    title: "Understanding Analysis Depths & Options",
    icon: Brain,
    description: "KJV Sentinel provides various levels of insight through its reports and specialized tools. While not always separate buttons, these 'depths' describe how you can engage with the analysis results:",
    subFeatures: [
      {
        title: "Overview Analysis",
        description: "Quickly grasp key takeaways from the 'Summary' section of standard reports, including primary 'isms' detected and overall KJV alignment.",
      },
      {
        title: "Scholastic Focus",
        description: "For deeper study, focus on sections like 'Historical Context', 'Etymology', 'Scriptural Analysis', and 'Logical Fallacies' within the standard report.",
      },
      {
        title: "Deep Theological Examination (Standard Report)",
        description: "The full standard content analysis report provides a comprehensive look at all aspects, including 'Manipulative Tactics', detailed 'Identified Isms', and the initial 'Calvinism Analysis'.",
      },
      {
        title: "In-Depth Calvinism Report",
        description: "For content where Calvinistic influences are preliminarily detected, you can request a specialized 'In-Depth Calvinism Report'. This provides a more granular examination of Calvinistic elements, their nuances, and scriptural comparisons.",
      },
      {
        title: "Targeted Teaching Analysis",
        description: "Use the 'Analyze Teaching' feature for a focused analysis of specific doctrines or sayings, resulting in a structured report with historical context and a formal letter of clarification.",
      },
       {
        title: "Full Summary (Conceptual)",
        description: "Conceptually, a 'full summary' involves reviewing all generated reports (standard, deep-dive, teaching analysis if applicable) for a holistic understanding of the submitted content or topic from multiple analytical angles.",
      }
    ],
  },
  {
    id: "report-management",
    title: "Managing Your Reports",
    icon: ListChecks,
    description: "Access and manage all your generated analysis reports.",
    subFeatures: [
      {
        title: "Viewing Reports",
        icon: FileText,
        description: "Reports are presented in an accordion layout for easy navigation. Each section (Summary, Scriptural Analysis, etc.) can be expanded or collapsed.",
        points: [
          "Navigate to 'Content Reports' or 'Teaching Reports' to see lists of your analyses.",
          "Click on a report title to view its detailed contents.",
        ],
      },
      {
        title: "Report Actions",
        icon: Settings,
        description: "For each report, you have several options:",
        points: [
          "Download as PDF (placeholder for content reports, functional for teaching reports via TXT).",
          "Download as TXT (functional for teaching reports).",
          "Share (simulated link, or via Email for teaching reports if email provided).",
          "Print (uses browser's print functionality).",
          "Delete reports from your list.",
        ],
      },
    ],
  },
  {
    id: "document-library",
    title: "Document Library",
    icon: Library,
    description: "Upload and manage your personal reference documents (PDF, TXT, DOCX). These documents can be used as source material for future analysis or personal study. Currently, uploaded documents are stored, but integration into the analysis flow as reference material is a future enhancement.",
  },
  {
    id: "learning-tools",
    title: "Learning Tools",
    icon: GraduationCap,
    description: "Interactive tools to enhance your theological understanding and scripture memory, often drawing from content you've analyzed.",
    subFeatures: [
      {
        title: "Fallacy Detection Quiz",
        icon: Puzzle,
        description: "Test your ability to identify logical fallacies in theological arguments. (Conceptual, based on analyzed content)",
      },
      {
        title: "Scripture Memory Tool",
        icon: BookOpen,
        description: "Save and practice KJV verses identified in your analyses using a flashcard-style interface. (Conceptual)",
      },
      {
        title: "Ism Awareness Quiz",
        icon: Lightbulb,
        description: "Deepen your understanding of various theological 'isms' and Calvinistic influences. (Conceptual, based on analyzed content)",
      },
    ],
  },
  {
    id: "user-profile",
    title: "User Profile & Settings",
    icon: UserCircle,
    description: "Manage your account details and preferences.",
    subFeatures: [
      {
        title: "Profile Management",
        description: "Update your display name and email.",
      },
      {
        title: "Theme Toggle",
        description: "Switch between light, dark, and system themes for optimal viewing comfort.",
      },
      {
        title: "Account Deletion",
        description: "Option to permanently delete your account and associated data.",
      },
    ],
  },
  {
    id: "future-updates",
    title: "Future Enhancements",
    icon: Settings,
    description: "KJV Sentinel is continually evolving. Future updates may include:",
    points: [
        "Direct integration of library documents as reference material in analyses.",
        "Advanced search within reports and library documents.",
        "Full implementation of audio/video transcription (currently simulated for non-text files).",
        "Real audio recording transcription (currently simulated).",
        "Enhanced AI models for even more nuanced analysis.",
        "Community features for sharing insights (with privacy controls).",
        "Full implementation of interactive learning tools (quizzes, scripture memory).",
        "True NotebookLM integration if/when an API becomes available for podcast generation."
    ]
  },
  {
    id: "calvinism-video-resources",
    title: "Understanding Calvinism: Video Resources",
    icon: Youtube,
    description: "Explore these external video resources to deepen your understanding of Calvinism. You can watch an introductory video embedded below or view the full playlist directly on YouTube.",
    subFeatures: [
      {
        title: "Full Playlist on YouTube",
        icon: ExternalLink,
        description: "Access the complete series of videos discussing various aspects of Calvinism.",
        htmlContent: "<p class='text-sm'><a href='https://youtube.com/playlist?list=PLY2G1Gk_v1wOFzOk5PogZnPCioanrblrz&amp;si=kVeQ5zMaT53efNW4' target='_blank' rel='noopener noreferrer' class='text-primary hover:underline'>View Full Playlist on YouTube</a></p>"
      },
      {
        title: "Embedded Video Example",
        icon: PlayCircle,
        description: "Watch a video from the playlist here (Note: This is an example, the full playlist contains more content):",
        htmlContent: `
          <div class="aspect-video mt-2">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/videoseries?list=PLY2G1Gk_v1wOFzOk5PogZnPCioanrblrz" title="YouTube video player for Calvinism playlist" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          </div>`
      }
    ]
  }
];

export function FeaturesGuideModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredFeatures = featuresData.filter(feature =>
    feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (feature.subFeatures && feature.subFeatures.some(sub =>
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.htmlContent && sub.htmlContent.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  );

  const defaultOpenAccordionItems = ["introduction", "calvinism-video-resources"];
  if (filteredFeatures.length === 1 && filteredFeatures[0]) { 
      defaultOpenAccordionItems.push(filteredFeatures[0].id);
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">KJV Sentinel Features Guide</DialogTitle>
          <DialogDescription>
            An overview of the features, analysis options, tools, and report functionalities available in this app.
          </DialogDescription>
        </DialogHeader>
        <div className="relative my-4">
          <Input
            type="search"
            placeholder="Search features..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <ScrollArea className="flex-grow pr-4">
          <Accordion type="multiple" defaultValue={defaultOpenAccordionItems} className="w-full">
            {filteredFeatures.map((feature) => (
              <AccordionItem value={feature.id} key={feature.id}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    {feature.icon && <feature.icon className="h-5 w-5 text-primary" />}
                    {feature.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pl-2">
                  <p dangerouslySetInnerHTML={{ __html: feature.description.replace(/\n/g, "<br />") }} />
                  {feature.points && feature.points.length > 0 && (
                         <ul className="list-disc list-inside pl-4 space-y-1">
                              {feature.points.map((point, pIndex) => (
                                <li key={pIndex} dangerouslySetInnerHTML={{ __html: point.replace(/\n/g, "<br />") }}></li>
                              ))}
                          </ul>
                  )}
                  {feature.subFeatures && feature.subFeatures.length > 0 && (
                    <div className="space-y-3 mt-3">
                      {feature.subFeatures.map((subFeature, index) => (
                        <div key={index} className="ml-4 p-3 border rounded-md bg-background/50">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                            {subFeature.icon && <subFeature.icon className="h-4 w-4 text-primary/80" />}
                            {subFeature.title}
                          </h4>
                          <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: subFeature.description.replace(/\n/g, "<br />") }} />
                          {subFeature.points && subFeature.points.length > 0 && (
                            <ul className="list-disc list-inside pl-4 space-y-1 mt-1 text-xs">
                              {subFeature.points.map((point, pIndex) => (
                                <li key={pIndex} dangerouslySetInnerHTML={{ __html: point.replace(/\n/g, "<br />") }}></li>
                              ))}
                            </ul>
                          )}
                          {subFeature.htmlContent && (
                            <div className="mt-2 text-xs" dangerouslySetInnerHTML={{ __html: subFeature.htmlContent }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
             {filteredFeatures.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No features match your search.</p>
            )}
          </Accordion>
        </ScrollArea>
        <DialogFooter className="text-xs text-muted-foreground pt-4">
            This guide will be updated as new features are added.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
