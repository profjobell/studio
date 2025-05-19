
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initiateCalvinismDeepDive } from "../../../analyze/actions"; 
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CalvinismDeepDiveButtonProps {
  reportId: string;
  contentToAnalyze: string;
}

export function CalvinismDeepDiveButton({ reportId, contentToAnalyze }: CalvinismDeepDiveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [showDialog, setShowDialog] = useState(false);
  const [deepDiveResult, setDeepDiveResult] = useState<string | null>(null);

  const handleDeepDive = async () => {
    startTransition(async () => {
      setDeepDiveResult(null); 
      setShowDialog(true); 

      try {
        // Pass reportId along with content
        const result = await initiateCalvinismDeepDive({ reportId, content: contentToAnalyze });
        
        if (result && 'error' in result) {
          toast({
            title: "Deep Dive Failed",
            description: result.error,
            variant: "destructive",
          });
        } else if (result && result.analysis) {
          setDeepDiveResult(result.analysis);
          toast({
            title: "Calvinism Deep Dive Complete",
            description: "The detailed analysis is now available in this dialog and has been added to the main report.",
          });
          router.refresh(); // Refresh the page to show updated report data
        } else {
           toast({
            title: "Deep Dive Issue",
            description: "Received no specific analysis from the deep dive.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Deep Dive Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      <Button onClick={handleDeepDive} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Request In-Depth Calvinism Report"
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>In-Depth Calvinism Analysis Result</AlertDialogTitle>
            <AlertDialogDescription>
              Below is the detailed analysis of Calvinistic elements for report ID: {reportId}. This has also been added to the main report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4 px-1">
            {isPending && !deepDiveResult && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating report...</p>
                </div>
            )}
            {deepDiveResult && (
              <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {deepDiveResult}
              </article>
            )}
            {!isPending && !deepDiveResult && (
                 <p className="text-muted-foreground text-center py-10">No analysis result to display. Please try generating the report.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeepDiveResult(null)}>Close</AlertDialogCancel>
            {/* Optionally add a save/print button for the deep dive result here */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
