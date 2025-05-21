
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { analyzeSubmittedContent, saveReportToDatabase, transcribeYouTubeVideoAction } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AnalysisReport } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FILE_TYPES = [
  "audio/mpeg", // MP3
  "audio/wav",  // WAV
  "video/mp4",  // MP4
  "video/x-msvideo", // AVI
  "application/pdf", // PDF
  "text/plain", // TXT
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
];

const YOUTUBE_URL_REGEX = /^(https|http):\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const formSchema = z.object({
  analysisTitle: z.string().min(5, {
    message: "Analysis title must be at least 5 characters.",
  }).max(100, {
    message: "Analysis title must be at most 100 characters.",
  }),
  submissionType: z.enum(["text", "file", "youtubeLink"]),
  textContent: z.string().optional(),
  file: z.any().optional(),
  youtubeUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.submissionType === "text") {
    if (!data.textContent || data.textContent.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text content must be at least 20 characters.",
        path: ["textContent"],
      });
    }
  } else if (data.submissionType === "file") {
    if (!data.file || data.file.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a file to upload.",
        path: ["file"],
      });
    } else {
      const fileList = data.file as FileList;
      if (fileList[0]) {
        const file = fileList[0];
        if (file.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File size must be less than ${MAX_FILE_SIZE / (1024*1024)}MB.`,
            path: ["file"],
          });
        }
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unsupported file type. Please upload MP3, WAV, MP4, AVI, PDF, TXT, or DOCX.",
            path: ["file"],
          });
        }
      } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid file data.",
            path: ["file"],
          });
      }
    }
  } else if (data.submissionType === "youtubeLink") {
    if (!data.youtubeUrl || !YOUTUBE_URL_REGEX.test(data.youtubeUrl)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID).",
            path: ["youtubeUrl"],
        });
    }
  }
});

export function ContentSubmissionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [submissionTypeState, setSubmissionTypeState] = useState<"text" | "file" | "youtubeLink">("text");
  const [showYoutubeInstructionsDialog, setShowYoutubeInstructionsDialog] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analysisTitle: "",
      submissionType: "text",
      textContent: "",
      file: undefined,
      youtubeUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let analysisInput = "";
    let analysisTypeString: AnalysisReport['analysisType'] = "text";
    let submittedFileName: string | undefined = undefined;

    if (values.submissionType === "youtubeLink") {
        if (!values.youtubeUrl || !YOUTUBE_URL_REGEX.test(values.youtubeUrl)) {
            toast({
                title: "Invalid YouTube URL",
                description: "Please provide a valid YouTube URL.",
                variant: "destructive",
            });
            return;
        }
        setShowYoutubeInstructionsDialog(true);
        return; 
    }

    startTransition(async () => {
      try {
        if (values.submissionType === "text" && values.textContent) {
          analysisInput = values.textContent;
          analysisTypeString = "text";
        } else if (values.submissionType === "file" && values.file && (values.file as FileList).length > 0) {
          const file = (values.file as FileList)[0];
          submittedFileName = file.name;

          if (file.type === "text/plain") {
             analysisInput = await file.text();
             toast({
                title: "Text File Processing",
                description: `The text content of "${file.name}" is being read and will be used for analysis.`,
                variant: "default",
             });
          } else if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
             analysisInput = `Simulated text extraction for: ${file.name} (type: ${file.type}). The actual content of this file type is not processed by this demo. Analysis will be based on this placeholder text describing the file.`;
             toast({
                title: "File Submitted (Text Extraction Simulation)",
                description: `File "${file.name}" (${file.type}) was submitted. Full text extraction for PDF/DOCX requires server-side processing, which is not implemented in this demo. A placeholder description of the file will be analyzed.`,
                variant: "default",
                duration: 7000,
             });
          } else if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
            analysisInput = `Simulated transcription for file: ${file.name} (type: ${file.type}). Actual audio/video transcription is not implemented in this demo. Analysis will be based on this placeholder text describing the file.`;
            toast({
              title: "File Submitted (Transcription Simulation)",
              description: `File "${file.name}" (${file.type}) submitted. Audio/Video transcription requires backend implementation. A placeholder description of the file will be analyzed.`,
              variant: "default",
              duration: 7000,
            });
          } else {
            analysisInput = `Unsupported file type: ${file.name} (type: ${file.type}). Analysis will be based on this placeholder text.`;
             toast({
              title: "Unsupported File Type",
              description: `File "${file.name}" has an unsupported type (${file.type}). A placeholder description will be analyzed.`,
              variant: "destructive",
            });
          }
          
          if (file.type.startsWith("audio/")) analysisTypeString = "file_audio";
          else if (file.type.startsWith("video/")) analysisTypeString = "file_video";
          else if (file.type === "text/plain" || file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") analysisTypeString = "file_document";
          else analysisTypeString = "file_document"; // Fallback for other unknown types

        } else {
          toast({ title: "Error", description: "No content provided for analysis.", variant: "destructive" });
          return;
        }
        
        const analysisResult = await analyzeSubmittedContent({ content: analysisInput });

        if (analysisResult && 'error' in analysisResult) {
          toast({
            title: "Analysis Failed",
            description: analysisResult.error,
            variant: "destructive",
          });
          return;
        }

        if (!analysisResult) {
          toast({
            title: "Analysis Failed",
            description: "Received no result from analysis.",
            variant: "destructive",
          });
          return;
        }
        
        const saveResult = await saveReportToDatabase(
          analysisResult,
          values.analysisTitle,
          analysisInput, // This is the content sent to the AI
          analysisTypeString,
          submittedFileName
        );

        if (typeof saveResult === 'string') {
          const reportId = saveResult;
          toast({
            title: "Analysis Submitted & Saved",
            description: "Navigating to your report: " + values.analysisTitle,
          });
          router.push(`/reports/${reportId}`);
          form.reset();
          setSubmissionTypeState("text");
        } else {
          toast({
            title: "Failed to Save Report",
            description: saveResult.error || "Could not save the analysis report. Please try again.",
            variant: "destructive",
          });
        }

      } catch (error) {
        console.error("Submission error:", error);
        toast({
          title: "Submission Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="analysisTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Analysis Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sermon on Romans 8 Analysis" {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive title for this analysis.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submissionType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Submission Type</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4">
                      <Button
                          type="button"
                          variant={submissionTypeState === 'text' ? 'default' : 'outline'}
                          onClick={() => {
                              setSubmissionTypeState('text');
                              field.onChange('text');
                              form.setValue('file', undefined);
                              form.setValue('youtubeUrl', '');
                          }}
                      >
                          Text Input
                      </Button>
                      <Button
                          type="button"
                          variant={submissionTypeState === 'file' ? 'default' : 'outline'}
                          onClick={() => {
                              setSubmissionTypeState('file');
                              field.onChange('file');
                              form.setValue('textContent', '');
                              form.setValue('youtubeUrl', '');
                          }}
                      >
                          File Upload
                      </Button>
                      <Button
                          type="button"
                          variant={submissionTypeState === 'youtubeLink' ? 'default' : 'outline'}
                          onClick={() => {
                              setSubmissionTypeState('youtubeLink');
                              field.onChange('youtubeLink');
                              form.setValue('textContent', '');
                              form.setValue('file', undefined);
                          }}
                      >
                          YouTube Link
                      </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {submissionTypeState === "text" && (
            <FormField
              key="text-input-field"
              control={form.control}
              name="textContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste or type your religious content here for analysis..."
                      className="resize-y min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Directly input the text you want to analyze. If transcribing from YouTube, paste the transcript here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {submissionTypeState === "file" && (
            <FormField
              key="file-input-field"
              control={form.control}
              name="file"
              render={({ field: { ref, name, onBlur, onChange: RHFOnChange, disabled } }) => ( 
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      id={name} 
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => RHFOnChange(e.target.files)} 
                      disabled={disabled || isPending || isTranscribing}
                      accept={SUPPORTED_FILE_TYPES.join(",")}
                      className="p-2 border border-input bg-background rounded-md file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground w-full h-10"
                    />
                  </FormControl>
                  <FormDescription>
                    Supported: MP3, WAV, MP4, AVI, PDF, TXT, DOCX. Max 100MB. (.txt content is read; others use placeholder descriptions).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {submissionTypeState === "youtubeLink" && (
            <FormField
              key="youtube-input-field"
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Video URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., https://www.youtube.com/watch?v=your_video_id"
                      {...field}
                      disabled={isPending || isTranscribing}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the YouTube URL. Clicking 'Submit' will show instructions for manual transcription.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button type="submit" disabled={isPending || isTranscribing} className="w-full">
            {(isPending && !isTranscribing) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting for Analysis...
              </>
            ) : isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Link...
              </>
            ) : (
              "Submit for Analysis"
            )}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showYoutubeInstructionsDialog} onOpenChange={setShowYoutubeInstructionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>YouTube Link Instructions</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              Youtube link must be pasted to the transcript web page field, and when complete the transcribed text will be in the Clipboard. Place the text into the 'Text Input' box and submit for analysis. Thank you.
              {"\n\n"}
              You can use sites like <a href="https://youtubetotranscript.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">youtubetotranscript.com</a> or similar services to get the transcript.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setShowYoutubeInstructionsDialog(false)}>Got it!</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
