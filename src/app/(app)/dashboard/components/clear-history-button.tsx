
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { deleteAllReportsAction } from "../../reports/actions";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClearHistoryButtonProps {
  disabled?: boolean;
}

export function ClearHistoryButton({ disabled = false }: ClearHistoryButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleClearHistory = async () => {
    startTransition(async () => {
      const result = await deleteAllReportsAction();
      if (result.success) {
        toast({
          title: "History Cleared",
          description: result.message,
        });
        // Optionally, force a refresh or rely on revalidatePath from server action
        // For instance, router.refresh() could be used if needed,
        // but revalidatePath should make the server component re-fetch.
        // This might be useful if the component itself needs to visually update
        // based on the `disabled` prop which depends on the fetched data.
        // However, for now, we assume revalidatePath is sufficient.
      } else {
        toast({
          title: "Clear History Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      setShowDialog(false);
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={disabled || isPending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        Clear History
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all analysis reports from your history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Yes, clear all history"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
