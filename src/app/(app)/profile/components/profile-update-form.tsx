"use client";

import { useEffect, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction } from "../actions";

interface ProfileUpdateFormProps {
  initialDisplayName: string;
  initialEmail: string;
}

const initialState = {
    message: "",
    success: false,
};

export function ProfileUpdateForm({ initialDisplayName, initialEmail }: ProfileUpdateFormProps) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Profile Updated", description: state.message });
      } else {
        toast({ title: "Update Failed", description: state.message, variant: "destructive" });
      }
    }
  }, [state, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
        formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input id="displayName" name="displayName" defaultValue={initialDisplayName} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" defaultValue={initialEmail} disabled={isPending} />
        </div>
      </div>
      
      <div className="space-y-2">
          <Label htmlFor="newPassword">New Password (Optional)</Label>
          <Input id="newPassword" name="newPassword" type="password" placeholder="Leave blank to keep current password" disabled={isPending} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
