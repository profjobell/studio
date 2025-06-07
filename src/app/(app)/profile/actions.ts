
"use server";

import type { UserDashboardPreference } from "@/types";
import { ensureUserDashboardPreferencesStore } from "../settings/actions";
import { revalidatePath } from "next/cache";

// Placeholder for actual Firebase Auth or DB operations

export async function updateProfileAction(
  prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const userId = formData.get("userId") as string; // Get userId from formData
  const displayName = formData.get("displayName") as string;
  const email = formData.get("email") as string;
  // const newPassword = formData.get("newPassword") as string;

  console.log("Server Action: Updating profile for userId:", userId, { displayName, email });
  
  if (!displayName || !email) {
    return { success: false, message: "Display name and email are required." };
  }
  if (!userId) {
    return { success: false, message: "User ID is missing. Cannot update profile." };
  }

  // Conceptually update user data if it's a dynamic user
  let profileUpdated = false;
  if (global.tempUserProfilesStoreGlobal) {
    // Find user by ID first, as email might also be changing
    const userIndexById = global.tempUserProfilesStoreGlobal.findIndex(u => u.id === userId);

    if (userIndexById > -1) {
      global.tempUserProfilesStoreGlobal[userIndexById].newDisplayName = displayName;
      // Optionally update email if it changed, though this has implications for conceptual login
      // global.tempUserProfilesStoreGlobal[userIndexById].newUserEmail = email; 
      console.log("Updated conceptual user profile for ID:", userId);
      profileUpdated = true;
    } else {
        // Fallback: if ID not found, try by email if that's a consistent identifier you rely on
        // However, relying on ID passed from form is more robust for conceptual users.
        console.warn(`Conceptual user with ID ${userId} not found in tempUserProfilesStoreGlobal during profile update.`);
    }
  }

  if (profileUpdated) {
    revalidatePath("/profile");
    revalidatePath("/settings"); // If user list on settings page needs update
    revalidatePath("/dashboard"); // If user name is displayed on dashboard
    return { success: true, message: "Profile updated successfully (conceptually)." };
  } else {
    // If not found in conceptual store, it might be a base user or an error.
    // Base users (admin, richard, meta) are not meant to be updated this way in the current conceptual model.
    // We can still return success for UI purposes, as the form values would "change" visually.
    console.log("Profile update attempted for a user not in the conceptual dynamic store, or no actual change made to display name.");
    return { success: true, message: "Profile information processed (base user names are static in this demo)." };
  }
}

export async function deleteAccountAction(): Promise<{ success: boolean; message: string }> {
  console.log("Server Action: Deleting account...");
  // TODO: Implement actual Firebase account deletion logic here
  
  return { success: true, message: "Account deletion process initiated (simulated). You would be signed out and redirected." };
}

// --- User Dashboard Preferences Actions ---
export async function fetchUserDashboardPreference(userId: string): Promise<UserDashboardPreference | null> {
  console.log(`Server Action: Fetching dashboard preference for user ID: ${userId}`);
  const store = await ensureUserDashboardPreferencesStore(); 
  
  if (!store[userId]) {
    const defaultUserType = 'default'; 
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
  const store = await ensureUserDashboardPreferencesStore(); 
  store[userId] = preferenceData;
  revalidatePath("/dashboard"); 
  revalidatePath("/profile");
  return { success: true, message: "Dashboard preference updated successfully." };
}
