
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

const YOUTUBE_URL_REGEX_COMPREHENSIVE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;


const formSchema = z.object({
  analysisTitle: z.string().min(5, {
    message: "Analysis title must be at least 5 characters.",
  }).max(100, {
    message: "Analysis title must be at most 100 characters.",
  }),
  submissionType: z.enum(["text", "file", "youtubeLink"]),
  textContent: z.string().optional(),
  file: z.instanceof(FileList).optional(), // Expect a FileList now
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
        message: "Please select at least one file to upload.",
        path: ["file"],
      });
    } else {
      for (let i = 0; i < data.file.length; i++) {
        const file = data.file[i];
        if (file.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" size must be less than ${MAX_FILE_SIZE / (1024*1024)}MB.`,
            path: ["file", i.toString(), "size"], // Path to specific file
          });
        }
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" has an unsupported type. Please upload MP3, WAV, MP4, AVI, PDF, TXT, or DOCX.`,
            path: ["file", i.toString(), "type"], // Path to specific file
          });
        }
      }
    }
  } else if (data.submissionType === "youtubeLink") {
    if (!data.youtubeUrl || !YOUTUBE_URL_REGEX_COMPREHENSIVE.test(data.youtubeUrl)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, or https://www.youtube.com/embed/VIDEO_ID).",
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
    let submittedFileNames: string[] = [];

    if (values.submissionType === "youtubeLink") {
        if (!values.youtubeUrl || !YOUTUBE_URL_REGEX_COMPREHENSIVE.test(values.youtubeUrl)) {
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
        } else if (values.submissionType === "file" && values.file && values.file.length > 0) {
          const fileContents: string[] = [];
          let hasAudio = false;
          let hasVideo = false;
          let hasDocument = false;

          for (let i = 0; i < values.file.length; i++) {
            const file = values.file[i];
            submittedFileNames.push(file.name);

            if (file.type === "text/plain") {
               const text = await file.text();
               fileContents.push(`Content from ${file.name}:\n${text}`);
               hasDocument = true;
               toast({
                  title: "Text File Processed",
                  description: `The text content of "${file.name}" has been read.`,
                  variant: "default",
               });
            } else if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
              fileContents.push(`File submitted: ${file.name}, Type: ${file.type}. Content extraction is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`);
              hasDocument = true;
              toast({
                  title: `File Submitted: ${file.name}`,
                  description: `For PDF/DOCX, content extraction is not live. A description of the file will be analyzed.`,
                  variant: "default",
                  duration: 7000,
              });
            } else if (file.type.startsWith("audio/")) {
              fileContents.push(`File submitted: ${file.name}, Type: ${file.type}. Transcription is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`);
              hasAudio = true;
              toast({
                title: `File Submitted: ${file.name}`,
                description: `Audio transcription is not live. A description of the file will be analyzed.`,
                variant: "default",
                duration: 7000,
              });
            } else if (file.type.startsWith("video/")) {
              fileContents.push(`File submitted: ${file.name}, Type: ${file.type}. Transcription is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`);
              hasVideo = true;
              toast({
                title: `File Submitted: ${file.name}`,
                description: `Video transcription is not live. A description of the file will be analyzed.`,
                variant: "default",
                duration: 7000,
              });
            } else {
              fileContents.push(`Unsupported file type: ${file.name} (type: ${file.type}). A description of the file submission will be used for analysis.`);
               toast({
                title: `Unsupported File Type: ${file.name}`,
                description: `File "${file.name}" has an unsupported type (${file.type}). A placeholder description will be analyzed.`,
                variant: "destructive",
              });
            }
          }
          analysisInput = fileContents.join("\n\n---\n\n"); // Join contents with a separator
          
          if (hasAudio) analysisTypeString = "file_audio";
          else if (hasVideo) analysisTypeString = "file_video";
          else if (hasDocument) analysisTypeString = "file_document";
          else analysisTypeString = "file_document"; // Fallback if only unsupported types somehow got through

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
          analysisInput, 
          analysisTypeString,
          submittedFileNames.join(", ") // Join filenames for storage
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

  const handleYoutubeDialogAction = () => {
    setShowYoutubeInstructionsDialog(false);
    const currentYoutubeUrl = form.getValues("youtubeUrl");
    if (currentYoutubeUrl) {
        const match = currentYoutubeUrl.match(YOUTUBE_URL_REGEX_COMPREHENSIVE);
        if (match && match[1]) {
            window.open(`https://youtubetotranscript.com/?v=${match[1]}`, '_blank');
        } else {
            window.open('https://youtubetotranscript.com/', '_blank');
            toast({
                title: "Opening Transcription Site",
                description: "Could not automatically pre-fill video ID. Please paste your YouTube URL on the site.",
                variant: "default",
            });
        }
    }
  };

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
                      placeholder="Paste or type your religious content here for analysis... If transcribing from YouTube, paste the transcript here."
                      className="resize-y min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Directly input the text you want to analyze. If using a YouTube video, paste the transcript here after obtaining it from an external site.
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
                  <FormLabel>Upload File(s)</FormLabel>
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
                      multiple // Allow multiple file selection
                    />
                  </FormControl>
                  <FormDescription>
                    Supported: MP3, WAV, MP4, AVI, PDF, TXT, DOCX. Max 100MB per file. (.txt content is read; others use placeholder descriptions). You can select multiple files.
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
                    Enter the YouTube URL. Clicking 'Submit' will show instructions for manual transcription via an external site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button type="submit" disabled={isPending || (submissionTypeState === 'youtubeLink' && isTranscribing)} className="w-full">
            {(isPending && submissionTypeState !== 'youtubeLink') ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting for Analysis...
              </>
            ) : (submissionTypeState === 'youtubeLink' && isTranscribing) ? ( 
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
              Clicking "Proceed to Transcribe" will open an external site (youtubetotranscript.com) pre-filled with your video ID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleYoutubeDialogAction}>Proceed to Transcribe</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
