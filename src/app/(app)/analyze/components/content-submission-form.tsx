
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useRef, useEffect } from "react";
import { analyzeSubmittedContent, saveReportToDatabase } from "../actions";
import { Loader2, List, XCircle, ClipboardPaste, ShieldQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AnalysisReport } from "@/types";


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

const YOUTUBE_URL_REGEX_COMPREHENSIVE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;


const formSchema = z.object({
  analysisTitle: z.string().min(5, {
    message: "Analysis title must be at least 5 characters.",
  }).max(100, {
    message: "Analysis title must be at most 100 characters.",
  }),
  submissionType: z.enum(["text", "file", "youtubeLink"]),
  textContent: z.string().optional(),
  file: typeof window !== 'undefined' ? z.instanceof(FileList).optional() : z.any().optional(),
  youtubeUrl: z.string().optional(),
  analyzePrayers: z.boolean().default(false).optional(), 
  referenceMaterial: z.string().optional(), 
}).superRefine((data, ctx) => {
  if (data.submissionType === "text") {
    if (!data.textContent || data.textContent.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text content must be at least 20 characters for analysis (after potential sermon isolation).",
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
      if (typeof FileList !== 'undefined' && data.file instanceof FileList) {
        for (let i = 0; i < data.file.length; i++) {
          const file = data.file[i];
          if (file.size > MAX_FILE_SIZE) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `File "${file.name}" size must be less than ${MAX_FILE_SIZE / (1024*1024)}MB.`,
              path: ["file", i.toString(), "size"], 
            });
          }
          if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `File "${file.name}" has an unsupported type. Please upload MP3, WAV, MP4, AVI, PDF, TXT, or DOCX.`,
              path: ["file", i.toString(), "type"],
            });
          }
        }
      }
    }
  } else if (data.submissionType === "youtubeLink") {
    if (!data.youtubeUrl || !YOUTUBE_URL_REGEX_COMPREHENSIVE.test(data.youtubeUrl)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID).",
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
  const [displayedFileNames, setDisplayedFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analysisTitle: "",
      submissionType: "text",
      textContent: "",
      file: undefined,
      youtubeUrl: "",
      analyzePrayers: false,
      referenceMaterial: "",
    },
    mode: "onChange", 
  });

  const formValues = form.watch();
  const isFormGenerallyValid = 
    formValues.analysisTitle.length >= 5 &&
    (
      (formValues.submissionType === "text" && (formValues.textContent?.trim() ?? "").length >= 20) ||
      (formValues.submissionType === "file" && formValues.file && formValues.file.length > 0 && Array.from(formValues.file).every(f => f.size <= MAX_FILE_SIZE && SUPPORTED_FILE_TYPES.includes(f.type))) ||
      (formValues.submissionType === "youtubeLink" && formValues.youtubeUrl && YOUTUBE_URL_REGEX_COMPREHENSIVE.test(formValues.youtubeUrl))
    );


  const handleClearFiles = () => {
    form.setValue('file', undefined, { shouldValidate: true, shouldDirty: true });
    setDisplayedFileNames([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };

  const generateSuggestedTitle = (text: string): string => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    const titleWords = words.slice(0, 5).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return titleWords.join(" ");
  };

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      toast({
        title: "Clipboard API not supported",
        description: "Your browser does not support pasting from the clipboard.",
        variant: "destructive",
      });
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        form.setValue("textContent", text, { shouldValidate: true, shouldDirty: true });
        const suggestedTitle = generateSuggestedTitle(text);
        if (suggestedTitle && !form.getValues("analysisTitle")) { 
          form.setValue("analysisTitle", suggestedTitle, { shouldValidate: true, shouldDirty: true });
           toast({
            title: "Pasted from Clipboard",
            description: "Content pasted and a title has been suggested.",
          });
        } else {
           toast({
            title: "Pasted from Clipboard",
            description: "Content has been pasted into the text area.",
          });
        }
      } else {
        toast({
          title: "Clipboard Empty",
          description: "There was no text content on your clipboard.",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      toast({
        title: "Paste Failed",
        description: "Could not paste from clipboard. Permission might have been denied or an error occurred.",
        variant: "destructive",
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.submissionType === "youtubeLink") {
        if (values.youtubeUrl && YOUTUBE_URL_REGEX_COMPREHENSIVE.test(values.youtubeUrl)) {
            window.open('https://kome.ai/tools/youtube-transcript-generator', '_blank');
            toast({
                title: "Transcription Tool Opened",
                description: "Kome.ai has been opened in a new tab. Please use it to get the transcript, then paste it into the 'Text Input' tab here for analysis.",
                duration: 10000, 
            });
        } else {
            toast({
                title: "Invalid YouTube URL",
                description: "Please provide a valid YouTube URL before attempting to get the transcript.",
                variant: "destructive",
            });
        }
        return; // Stop further processing for YouTube links
    }

    startTransition(async () => {
      let rawAnalysisInput = ""; 
      let analysisTypeString: AnalysisReport['analysisType'] = "text";
      let submittedFileNames: string[] = []; 

      try {
        if (values.submissionType === "text" && values.textContent) {
          rawAnalysisInput = values.textContent;
          analysisTypeString = "text";
          toast({
            title: "Processing Text",
            description: "Isolating sermon/lecture content before analysis...",
            variant: "default",
          });
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
                  title: "Text File Processing",
                  description: `The text content of "${file.name}" will be used for analysis. (Sermon isolation will apply if it resembles a transcript).`,
                  variant: "default",
                  duration: 7000,
               });
            } else if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
              const placeholderText = `File submitted: ${file.name}, Type: ${file.type}. Content extraction is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`;
              fileContents.push(placeholderText);
              hasDocument = true;
              toast({
                  title: `File Submitted: ${file.name}`,
                  description: `For PDF/DOCX, content extraction is a simulation. A placeholder description will be analyzed.`,
                  variant: "default",
                  duration: 7000,
              });
            } else if (file.type.startsWith("audio/")) {
              const placeholderText = `File submitted: ${file.name}, Type: ${file.type}. Transcription is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`;
              fileContents.push(placeholderText);
              hasAudio = true;
              toast({
                title: `File Submitted: ${file.name}`,
                description: `Audio transcription is simulated. A placeholder description of the file will be analyzed.`,
                variant: "default",
                duration: 7000,
              });
            } else if (file.type.startsWith("video/")) {
              const placeholderText = `File submitted: ${file.name}, Type: ${file.type}. Transcription is not performed for this file type in the current system. A description of the file submission will be used for analysis if applicable.`;
              fileContents.push(placeholderText);
              hasVideo = true;
              toast({
                title: `File Submitted: ${file.name}`,
                description: `Video transcription is simulated. A placeholder description of the file will be analyzed.`,
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
          rawAnalysisInput = fileContents.join("\n\n---\n\n"); 
          
          if (hasAudio) analysisTypeString = "file_audio";
          else if (hasVideo) analysisTypeString = "file_video";
          else if (hasDocument) analysisTypeString = "file_document";
          else analysisTypeString = "file_document"; // Default for other mixed types
        } else {
          toast({ title: "Error", description: "No content provided for analysis.", variant: "destructive" });
          return;
        }
        
        const analysisResult = await analyzeSubmittedContent({ 
            content: rawAnalysisInput, 
            analysisType: analysisTypeString,
            analyzePrayers: values.analyzePrayers || false,
            referenceMaterial: values.referenceMaterial,
        });

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
          rawAnalysisInput, 
          analysisTypeString,
          submittedFileNames.join(", ") || undefined 
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
          setDisplayedFileNames([]); 
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
          }
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
                  A descriptive title for this analysis (min 5 characters).
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
                              setDisplayedFileNames([]);
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
                              setDisplayedFileNames([]);
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Text Content</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePasteFromClipboard}
                      className="ml-auto"
                    >
                      <ClipboardPaste className="mr-2 h-4 w-4" />
                      Paste
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Paste or type your religious content here for analysis (e.g., a sermon transcript). The AI will attempt to isolate the main sermon/lecture before analysis."
                      className="resize-y min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the full text. The system will first try to extract the sermon/lecture content before theological analysis.
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
              render={({ field: { name, onBlur, onChange: RHFOnChange, disabled } }) => {
                const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                  const files = event.target.files;
                  RHFOnChange(files); 
                  if (files && files.length > 0) {
                    setDisplayedFileNames(Array.from(files).map(f => f.name));
                  } else {
                    setDisplayedFileNames([]);
                  }
                };
                return (
                <FormItem>
                  <FormLabel>Upload File(s)</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      id={name} 
                      name={name}
                      ref={fileInputRef} 
                      onBlur={onBlur}
                      onChange={handleFileChange} 
                      disabled={disabled || isPending}
                      accept={SUPPORTED_FILE_TYPES.join(",")}
                      className="p-2 border border-input bg-background rounded-md file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground w-full h-10"
                      multiple
                    />
                  </FormControl>
                  <FormDescription>
                    Supported: MP3, WAV, MP4, AVI, PDF, TXT, DOCX. Max 100MB per file. (.txt content will undergo sermon/lecture isolation if applicable; other files use placeholder descriptions).
                  </FormDescription>
                  <FormMessage />
                  {displayedFileNames.length > 0 && (
                    <div className="mt-3 p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                            <List className="h-4 w-4" />
                            Selected Files:
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFiles}
                          className="text-destructive hover:text-destructive/80 p-1 h-auto"
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Clear
                        </Button>
                      </div>
                      <ul className="list-disc list-inside pl-5 text-sm text-muted-foreground space-y-1">
                        {displayedFileNames.map((fileName, index) => (
                          <li key={index}>{fileName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </FormItem>
                );
              }}
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
                    Enter the YouTube URL. Clicking &apos;Get Transcript&apos; will open Kome.ai for manual transcription.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="referenceMaterial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Optional Reference Material</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste any additional reference text or KJV scripture passages you want the AI to specifically consider..."
                    className="resize-y min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This material will be provided to the AI alongside your main content for analysis.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="analyzePrayers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!isFormGenerallyValid || isPending}
                    id="analyzePrayers"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="analyzePrayers" className="flex items-center cursor-pointer">
                     <ShieldQuestion className="mr-2 h-4 w-4 text-primary" />
                    Analyze Prayers within Content
                  </FormLabel>
                  <FormDescription>
                    Enable to perform specific KJV alignment and manipulative language analysis on prayers found in the submitted text. (Requires valid main submission).
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
            <Button
              type="submit"
              disabled={!isFormGenerallyValid || (submissionTypeState !== 'youtubeLink' && isPending)}
              className="w-full"
            >
              {submissionTypeState === 'youtubeLink' ? (
                "Get Transcript (Kome.ai)"
              ) : isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting for Analysis...
                </>
              ) : (
                "Submit for Analysis"
              )}
            </Button>
        </form>
      </Form>
    </>
  );
}

