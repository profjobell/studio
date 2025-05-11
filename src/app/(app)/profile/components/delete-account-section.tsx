"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteAccountAction } from "../actions";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      startTransition(async () => {
        const result = await deleteAccountAction();
        if (result.success) {
          toast({ title: "Account Deletion", description: result.message });
          // TODO: Implement actual sign out and redirect
          // For demo, we'll simulate redirect after a delay
          setTimeout(() => router.push('/signin'), 2000); 
        } else {
          toast({ title: "Deletion Failed", description: result.message, variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm">
        Deleting your account is permanent and cannot be undone. All your data, including analysis reports and uploaded documents, will be removed.
      </p>
      <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Deleting..." : "Delete My Account"}
      </Button>
    </div>
  );
}
