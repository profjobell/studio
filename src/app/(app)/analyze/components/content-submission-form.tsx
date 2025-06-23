
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useRef } from "react";
import { analyzeSubmittedContent, saveReportToDatabase, isolateSermonOrLectureAction } from "../actions";
import { Loader2, List, XCircle, ClipboardPaste, ShieldQuestion, BookText, SearchCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AnalysisReport } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";


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
  requestIDCR: z.boolean().default(false).optional(), // New checkbox for IDCR
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
  const [isSubmittingAnalysis, startSubmittingAnalysisTransition] = useTransition();
  const [isPreparingText, startPreparingTextTransition] = useTransition();
  const [submissionTypeState, setSubmissionTypeState] = useState<"text" | "file" | "youtubeLink">("text");
  const [displayedFileNames, setDisplayedFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preparedText, setPreparedText] = useState<string | null>(null);
  const [isTextPrepared, setIsTextPrepared] = useState(false);
  const [isolationWarning, setIsolationWarning] = useState<string | null>(null);
  const [rawContentForSaving, setRawContentForSaving] = useState<string>("");


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analysisTitle: "",
      submissionType: "text",
      textContent: "",
      file: undefined,
      youtubeUrl: "",
      analyzePrayers: false,
      requestIDCR: false,
      referenceMaterial: "",
    },
    mode: "onChange", 
  });

  const formValues = form.watch();
  const isTitleValid = formValues.analysisTitle.length >= 5;
  const isContentValidForPreparation = 
    (formValues.submissionType === "text" && (formValues.textContent?.trim() ?? "").length >= 20) ||
    (formValues.submissionType === "file" && formValues.file && formValues.file.length > 0 && Array.from(formValues.file).every(f => f.size <= MAX_FILE_SIZE && SUPPORTED_FILE_TYPES.includes(f.type)));

  const handleClearFiles = () => {
    form.setValue('file', undefined, { shouldValidate: true, shouldDirty: true });
    setDisplayedFileNames([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
    setIsTextPrepared(false);
    setPreparedText(null);
    setIsolationWarning(null);
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

  const handlePrepareText = async () => {
    const values = form.getValues();
    let rawAnalysisInput = "";
    setRawContentForSaving(""); // Clear previous raw content

    if (values.submissionType === "youtubeLink") {
        if (values.youtubeUrl && YOUTUBE_URL_REGEX_COMPREHENSIVE.test(values.youtubeUrl)) {
            window.open('https://kome.ai/tools/youtube-transcript-generator', '_blank');
            toast({
                title: "Transcription Tool Opened",
                description: "Kome.ai has been opened in a new tab. Please use it to get the transcript, then paste it into the 'Text Input' tab here and click 'Prepare Text & View'.",
                duration: 10000, 
            });
        } else {
            toast({
                title: "Invalid YouTube URL",
                description: "Please provide a valid YouTube URL before attempting to get the transcript.",
                variant: "destructive",
            });
        }
        return; 
    }
    
    startPreparingTextTransition(async () => {
        setIsolationWarning(null);
        setPreparedText(null);
        setIsTextPrepared(false);

        try {
            if (values.submissionType === "text" && values.textContent) {
                rawAnalysisInput = values.textContent;
                setRawContentForSaving(rawAnalysisInput);
                toast({ title: "Preparing Text", description: "Isolating sermon/lecture content...", variant: "default" });
                const isolationResult = await isolateSermonOrLectureAction(rawAnalysisInput);
                if ('error' in isolationResult) {
                    setPreparedText(rawAnalysisInput); // Fallback to raw text if isolation errors but still allow analysis
                    setIsolationWarning(`Isolation Error: ${isolationResult.error}. Using full text for analysis.`);
                    toast({ title: "Preparation Warning", description: `Using full text. ${isolationResult.error}`, variant: "default", duration: 7000 });
                } else {
                    setPreparedText(isolationResult.preparedText);
                    if (isolationResult.isolationWarning) setIsolationWarning(isolationResult.isolationWarning);
                    toast({ title: "Text Prepared", description: "Sermon/lecture content isolated for analysis.", variant: "default" });
                }
            } else if (values.submissionType === "file" && values.file && values.file.length > 0) {
                const file = values.file[0]; // Assuming single file for simplicity of preparation step for now
                if (file.type === "text/plain") {
                    rawAnalysisInput = await file.text();
                    setRawContentForSaving(rawAnalysisInput);
                    toast({ title: "Preparing Text File", description: `Reading ${file.name} and isolating sermon/lecture...`, variant: "default" });
                    const isolationResult = await isolateSermonOrLectureAction(rawAnalysisInput);
                     if ('error' in isolationResult) {
                        setPreparedText(rawAnalysisInput);
                        setIsolationWarning(`Isolation Error: ${isolationResult.error}. Using full text for analysis.`);
                        toast({ title: "Preparation Warning", description: `Using full text of ${file.name}. ${isolationResult.error}`, variant: "default", duration: 7000 });
                    } else {
                        setPreparedText(isolationResult.preparedText);
                        if (isolationResult.isolationWarning) setIsolationWarning(isolationResult.isolationWarning);
                        toast({ title: "Text File Prepared", description: `Content from ${file.name} isolated.`, variant: "default" });
                    }
                } else {
                    rawAnalysisInput = `File submitted for analysis: ${file.name}, Type: ${file.type}. Content extraction/transcription is simulated. This placeholder text represents the file's content.`;
                    setRawContentForSaving(rawAnalysisInput); // Save the placeholder as raw
                    setPreparedText(rawAnalysisInput); // For non-txt files, prepared text is the placeholder itself
                    toast({ title: "File Prepared (Simulated)", description: `Placeholder content for ${file.name} is ready for analysis.`, variant: "default" });
                }
            } else {
                toast({ title: "Error", description: "No content provided for preparation.", variant: "destructive" });
                return;
            }
            setIsTextPrepared(true);
        } catch (error) {
            console.error("Text preparation error:", error);
            toast({ title: "Preparation Failed", description: error instanceof Error ? error.message : "An unexpected error occurred during text preparation.", variant: "destructive" });
            setPreparedText(rawContentForSaving || values.textContent || ""); // Fallback
            setIsolationWarning("An error occurred during preparation. Using original text.");
            setIsTextPrepared(true); // Still allow analysis on original if prep fails
        }
    });
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isTextPrepared || !preparedText) {
        toast({ title: "Error", description: "Please prepare the text using the 'Prepare Text & View' button before running analyses.", variant: "destructive"});
        return;
    }

    startSubmittingAnalysisTransition(async () => {
      let analysisTypeString: AnalysisReport['analysisType'] = "text";
      let submittedFileName: string | undefined = undefined; 

      if (values.submissionType === "file" && values.file && values.file.length > 0) {
          const file = values.file[0];
          submittedFileName = file.name;
          if (file.type.startsWith("audio/")) analysisTypeString = "file_audio";
          else if (file.type.startsWith("video/")) analysisTypeString = "file_video";
          else if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "text/plain") {
             analysisTypeString = "file_document";
          } else {
            analysisTypeString = "file_document"; // Default for other mixed types
          }
      } else if (values.submissionType === "text") {
          analysisTypeString = "text";
      }
      // YouTube type is handled by Prepare Text button, won't reach here directly for submission

      try {
        const analysisResult = await analyzeSubmittedContent({ 
            content: preparedText, 
            originalRawContent: rawContentForSaving || values.textContent || "Original content not captured.", // Use state or fallback
            analysisType: analysisTypeString,
            analyzePrayers: values.analyzePrayers || false,
            requestIDCR: values.requestIDCR || false,
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
          rawContentForSaving || values.textContent || "Original content not captured.", // Save original raw content
          preparedText, // Save prepared content
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
          setDisplayedFileNames([]); 
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
          }
          setIsTextPrepared(false);
          setPreparedText(null);
          setIsolationWarning(null);
          setRawContentForSaving("");
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
                  <div className="flex flex-wrap gap-4 items-center">
                      <Button
                          type="button"
                          variant={submissionTypeState === 'text' ? 'default' : 'outline'}
                          onClick={() => {
                              setSubmissionTypeState('text');
                              field.onChange('text');
                              form.setValue('file', undefined);
                              form.setValue('youtubeUrl', '');
                              setDisplayedFileNames([]);
                              setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);
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
                              setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);
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
                              setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);
                          }}
                      >
                          YouTube Link
                      </Button>
                      <Button
                          type="button"
                          variant="secondary"
                          onClick={() => window.open('https://kome.ai/tools/youtube-transcript-generator', '_blank')}
                      >
                         <ExternalLink className="mr-2 h-4 w-4" />
                          Alternate Transcription Resource
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
                      placeholder="Paste or type your religious content here (e.g., a sermon transcript). Then click 'Prepare Text & View' below."
                      className="resize-y min-h-[200px]"
                      {...field}
                      onChange={(e) => { field.onChange(e); setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);}}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the full text. The system will first try to extract the sermon/lecture content.
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
                  setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);
                };
                return (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      id={name} 
                      name={name}
                      ref={fileInputRef} 
                      onBlur={onBlur}
                      onChange={handleFileChange} 
                      disabled={disabled || isSubmittingAnalysis || isPreparingText}
                      accept={SUPPORTED_FILE_TYPES.join(",")}
                      className="p-2 border border-input bg-background rounded-md file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground w-full h-10"
                    />
                  </FormControl>
                  <FormDescription>
                    Single file: MP3, WAV, MP4, AVI, PDF, TXT, DOCX. Max 100MB. (.txt content will undergo sermon/lecture isolation; other files use placeholder descriptions).
                  </FormDescription>
                  <FormMessage />
                  {displayedFileNames.length > 0 && (
                    <div className="mt-3 p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                            <List className="h-4 w-4" />
                            Selected File:
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
                      disabled={isSubmittingAnalysis || isPreparingText}
                       onChange={(e) => { field.onChange(e); setIsTextPrepared(false); setPreparedText(null); setIsolationWarning(null);}}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the YouTube URL. Clicking &apos;Prepare Text & View&apos; (if YouTube type selected) will open Kome.ai for manual transcription.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="button"
            onClick={handlePrepareText}
            disabled={!isTitleValid || !isContentValidForPreparation || isPreparingText || isSubmittingAnalysis || submissionTypeState === 'youtubeLink'}
            variant="secondary"
            className="w-full"
          >
            {isPreparingText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookText className="mr-2 h-4 w-4" />}
            {submissionTypeState === 'youtubeLink' ? "Get Transcript via Kome.ai (then paste to Text tab)" : "Prepare Text & View"}
          </Button>
          
          {isTextPrepared && preparedText && (
            <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/50">
              <Label className="text-md font-semibold">Prepared Text for Analysis:</Label>
              {isolationWarning && (
                <div className="text-sm text-yellow-700 dark:text-yellow-400 p-2 border border-yellow-500/50 rounded-md bg-yellow-500/10 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4"/> {isolationWarning}
                </div>
              )}
              <ScrollArea className="h-40 w-full rounded-md border bg-background p-3">
                <p className="text-sm whitespace-pre-wrap">{preparedText}</p>
              </ScrollArea>
            </div>
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
                    disabled={!isTextPrepared || isSubmittingAnalysis || isPreparingText}
                    id="analyzePrayers"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="analyzePrayers" className={`flex items-center ${(!isTextPrepared || isSubmittingAnalysis) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                     <ShieldQuestion className="mr-2 h-4 w-4 text-primary" />
                    Analyze Prayers within Content
                  </FormLabel>
                  <FormDescription>
                    Enable to perform specific KJV alignment and manipulative language analysis on prayers found in the prepared text.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requestIDCR"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!isTextPrepared || isSubmittingAnalysis || isPreparingText}
                    id="requestIDCR"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="requestIDCR" className={`flex items-center ${(!isTextPrepared || isSubmittingAnalysis) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                     <SearchCheck className="mr-2 h-4 w-4 text-primary" />
                    Request In-Depth Calvinistic Report (IDCR)
                  </FormLabel>
                  <FormDescription>
                    Enable for a comprehensive report on Calvinistic elements, psychological tactics, God&apos;s character representation, Cessationism, and Anti-Semitism.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
            <Button
              type="submit"
              disabled={!isTextPrepared || isSubmittingAnalysis || isPreparingText}
              className="w-full"
            >
              {isSubmittingAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting for Analysis...
                </>
              ) : (
                "Run Analyses"
              )}
            </Button>
        </form>
      </Form>
    </>
  );
}
