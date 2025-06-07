
"use server";

import type { UserDashboardPreference } from "@/types";
import { ensureUserDashboardPreferencesStore } from "../settings/actions";
import { revalidatePath } from "next/cache";

// Placeholder for actual Firebase Auth or DB operations

// The server action now accepts `prevState` as the first argument,
// and `formData` as the second, as expected by `useActionState`.
export async function updateProfileAction(
  prevState: { success: boolean; message: string }, // Or `any` if you don't use prevState
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const displayName = formData.get("displayName") as string;
  const email = formData.get("email") as string;
  // const newPassword = formData.get("newPassword") as string; // if handling password

  console.log("Server Action: Updating profile:", { displayName, email });
  // TODO: Implement actual Firebase update logic here:
  // e.g., updateProfile(auth.currentUser, { displayName, email });
  // if (newPassword) { updatePassword(auth.currentUser, newPassword); }
  
  // Simulate success/failure
  if (displayName && email) {
    // For demo purposes, we'll just log and return success.
    // In a real app, you would interact with your backend/Firebase here.

    // Conceptually update user data if it's a dynamic user
    if (global.tempUserProfilesStoreGlobal) {
        const userIdFromEmail = localStorage.getItem('conceptualUserType'); // Assuming email is unique identifier for base conceptual, or id for dynamic
        const userIndex = global.tempUserProfilesStoreGlobal.findIndex(u => u.newUserEmail === email || u.id === userIdFromEmail);
        if(userIndex > -1 && global.tempUserProfilesStoreGlobal[userIndex].newUserEmail === email) { // Check if the email matches the found user
             global.tempUserProfilesStoreGlobal[userIndex].newDisplayName = displayName;
             console.log("Updated display name for conceptual user: ", email);
             revalidatePath("/profile");
             revalidatePath("/settings"); // If user list on settings page needs update
        } else if (global.baseConceptualUsers && global.baseConceptualUsers[email]) {
            // This part is tricky as baseConceptualUsers is not easily mutable server-side
            console.log("Attempted to update a base conceptual user's display name - requires different handling.");
        }
    }


    return { success: true, message: "Profile updated successfully (simulated)." };
  }
  return { success: false, message: "Failed to update profile. Display name and email are required (simulated)." };
}

export async function deleteAccountAction(): Promise<{ success: boolean; message: string }> {
  console.log("Server Action: Deleting account...");
  // TODO: Implement actual Firebase account deletion logic here
  // e.g., await deleteUser(auth.currentUser);
  // This action should ideally trigger a sign-out and redirect on the client after success.
  
  // Simulate success
  return { success: true, message: "Account deletion process initiated (simulated). You would be signed out and redirected." };
}

// --- User Dashboard Preferences Actions ---
export async function fetchUserDashboardPreference(userId: string): Promise<UserDashboardPreference | null> {
  console.log(`Server Action: Fetching dashboard preference for user ID: ${userId}`);
  const store = await ensureUserDashboardPreferencesStore(); // This function is exported from settings/actions.ts
  
  // Fallback for users not explicitly in store (e.g. newly conceptualized dynamic users before first save)
  if (!store[userId]) {
    const defaultUserType = 'default'; // Or derive based on some logic if needed
    const conceptualUser = global.tempUserProfilesStoreGlobal?.find(u => u.id === userId);
    const displayName = conceptualUser?.newDisplayName || userId;

    return {
        enabled: false,
        notes: `Welcome, ${displayName}! Customize your dashboard section via your profile page.`,
        symbolicPlaceholder: true,
        symbolicColor: 'hsl(var(--muted-foreground))'
    };
  }
  return store[userId];
}

export async function updateUserDashboardPreference(
  userId: string,
  preferenceData: UserDashboardPreference
): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Updating dashboard preference for user ID: ${userId}`, preferenceData);
  const store = await ensureUserDashboardPreferencesStore(); // This function is exported from settings/actions.ts
  store[userId] = preferenceData;
  revalidatePath("/dashboard"); 
  revalidatePath("/profile");
  return { success: true, message: "Dashboard preference updated successfully." };
}
