
"use client";

import { useEffect, useActionState } from "react"; // Changed import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction } from "../actions";

interface ProfileUpdateFormProps {
  userId: string; // Added userId prop
  initialDisplayName: string;
  initialEmail: string;
}

const initialState = {
    message: "",
    success: false,
};

export function ProfileUpdateForm({ userId, initialDisplayName, initialEmail }: ProfileUpdateFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
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

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden input to pass userId to the server action */}
      <input type="hidden" name="userId" value={userId} />
      
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
