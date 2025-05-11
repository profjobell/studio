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
import { analyzeSubmittedContent, initiateCalvinismDeepDive } from "../actions"; // Assuming actions are in the parent directory
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Corrected import

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

const formSchema = z.object({
  analysisTitle: z.string().min(5, {
    message: "Analysis title must be at least 5 characters.",
  }).max(100, {
    message: "Analysis title must be at most 100 characters.",
  }),
  submissionType: z.enum(["text", "file"]),
  textContent: z.string().optional(),
  file: z.any().optional(), // Using `any` for FileList, will refine with superRefine
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
      const file = data.file[0];
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
    }
  }
});

export function ContentSubmissionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submissionType, setSubmissionType] = useState<"text" | "file">("text");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analysisTitle: "",
      submissionType: "text",
      textContent: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        let analysisInput = "";
        let analysisType: "text" | "file_audio" | "file_video" | "file_document" = "text";

        if (values.submissionType === "text" && values.textContent) {
          analysisInput = values.textContent;
          analysisType = "text";
        } else if (values.submissionType === "file" && values.file && values.file[0]) {
          const file = values.file[0] as File;
          // In a real app, you'd upload the file and get a URL or process it.
          // For now, we'll simulate by reading its content if it's a text file for the AI flow.
          // The AI flow currently only accepts text. So true file handling is a placeholder.
          if (file.type === "text/plain") {
             analysisInput = await file.text();
          } else {
            // For non-text files, send a placeholder or file info.
            // The current AI flow expects 'content: string'.
            // This part needs actual file processing backend.
            analysisInput = `File submitted: ${file.name} (type: ${file.type}). File content processing not yet implemented for this demo.`;
            toast({
              title: "File Submitted (Simulation)",
              description: `File "${file.name}" was submitted. Full processing and analysis of non-text files requires backend implementation. Using file name as content for now.`,
              variant: "default",
            });
          }
          
          if (file.type.startsWith("audio/")) analysisType = "file_audio";
          else if (file.type.startsWith("video/")) analysisType = "file_video";
          else analysisType = "file_document";

        } else {
          toast({ title: "Error", description: "No content provided.", variant: "destructive" });
          return;
        }
        
        // Use the GenAI flow
        const result = await analyzeSubmittedContent({ content: analysisInput });

        toast({
          title: "Analysis Submitted",
          description: "Your content is being analyzed. Title: " + values.analysisTitle,
        });
        
        // For now, just log the result and navigate to a generic reports page or show summary
        console.log("Analysis Result:", result);

        // Example of how to save the result (conceptually, as no DB is set up yet)
        // const reportId = await saveReportToDatabase({ ...result, title: values.analysisTitle, originalContent: analysisInput, analysisType });
        // router.push(`/reports/${reportId}`);
        
        // Placeholder: just showing a success message
        // In a real app, you'd likely navigate to the report page once it's ready.
        // For now, we'll just re-direct to reports list.
        // This would actually go to a specific report page e.g. /reports/some-id
        // For now, let's push to a generic reports page or dashboard.
        // router.push("/reports"); // This needs a reports page to exist.

        // For demonstration, we can simulate showing the summary
         if (result?.summary) {
           toast({
             title: `Analysis Summary for "${values.analysisTitle}"`,
             description: result.summary.substring(0, 200) + "...", // Show a snippet
             duration: 10000,
           });
         }
        form.reset();

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
                 <div className="flex gap-4">
                    <Button 
                        type="button"
                        variant={submissionType === 'text' ? 'default' : 'outline'}
                        onClick={() => {
                            setSubmissionType('text');
                            field.onChange('text');
                        }}
                    >
                        Text Input
                    </Button>
                    <Button 
                        type="button"
                        variant={submissionType === 'file' ? 'default' : 'outline'}
                        onClick={() => {
                            setSubmissionType('file');
                            field.onChange('file');
                        }}
                    >
                        File Upload
                    </Button>
                 </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submissionType === "text" && (
          <FormField
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
                  Directly input the text you want to analyze.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {submissionType === "file" && (
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload File</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept={SUPPORTED_FILE_TYPES.join(",")}
                    onChange={(e) => field.onChange(e.target.files)}
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
  );
}
