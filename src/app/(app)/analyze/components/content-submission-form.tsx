
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
import { analyzeSubmittedContent, saveReportToDatabase } from "../actions";
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
    if (values.submissionType === "youtubeLink") {
        if (!values.youtubeUrl || !YOUTUBE_URL_REGEX.test(values.youtubeUrl)) {
            toast({
                title: "Invalid YouTube URL",
                description: "Please provide a valid YouTube URL to see instructions.",
                variant: "destructive",
            });
            return;
        }
        // Open the instructions dialog instead of redirecting
        setShowYoutubeInstructionsDialog(true);
        return; // Stop further processing for YouTube links here
    }

    // For "text" and "file" submissions
    startTransition(async () => {
      try {
        let analysisInput = "";
        let analysisTypeString: AnalysisReport['analysisType'] = "text";
        let submittedFileName: string | undefined = undefined;

        if (values.submissionType === "text" && values.textContent) {
          analysisInput = values.textContent;
          analysisTypeString = "text";
        } else if (values.submissionType === "file" && values.file && (values.file as FileList).length > 0) {
          const file = (values.file as FileList)[0];
          submittedFileName = file.name;

          if (file.type === "text/plain" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "application/pdf") {
             if (file.type === "text/plain") {
                analysisInput = await file.text();
             } else {
                analysisInput = `File submitted for text extraction: ${file.name} (type: ${file.type}). True extraction requires server-side processing. This demo uses filename as placeholder content.`;
                 toast({
                    title: "File Submitted (Text Extraction Simulation)",
                    description: `File "${file.name}" requires server-side text extraction. Using placeholder for AI analysis.`,
                    variant: "default",
                 });
             }
          } else {
            analysisInput = `File submitted: ${file.name} (type: ${file.type}). Audio/Video transcription not yet implemented. Using file name as content for now.`;
            toast({
              title: "File Submitted (Transcription Simulation)",
              description: `File "${file.name}" was submitted. Transcription for audio/video files requires backend implementation. Using file name as content.`,
              variant: "default",
            });
          }
          
          if (file.type.startsWith("audio/")) analysisTypeString = "file_audio";
          else if (file.type.startsWith("video/")) analysisTypeString = "file_video";
          else analysisTypeString = "file_document";

        } else {
          toast({ title: "Error", description: "No content provided for text or file submission.", variant: "destructive" });
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
          analysisInput,
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
              render={({ field: { ref, name, onBlur, onChange, disabled } }) => (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      id={name}
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.target.files)}
                      disabled={disabled || isPending}
                      accept={SUPPORTED_FILE_TYPES.join(",")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 p-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Supported: MP3, WAV, MP4, AVI, PDF, TXT, DOCX. Max 100MB.
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
                      disabled={isPending}
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
          
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
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
