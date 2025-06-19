
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserDashboardPreference } from "@/types";

// Define a type for all settings
export interface AppSettings {
  general: {
    appName: string;
    defaultTheme: string;
  };
  ai: {
    defaultModel: string;
    safetyFilters: {
      hateSpeech: string;
      dangerousContent: string;
      harassment: string;
      sexuallyExplicit: string;
    };
  };
  featureFlags: {
    podcastGeneration: boolean;
    personalizedFallacyQuiz: boolean;
    scriptureMemoryTool: boolean;
    ismAwarenessQuiz: boolean;
  };
}

// Initial default settings
const initialSettings: AppSettings = {
  general: {
    appName: "KJV Sentinel",
    defaultTheme: "system",
  },
  ai: {
    defaultModel: "googleai/gemini-2.0-flash",
    safetyFilters: {
      hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
      dangerousContent: "BLOCK_MEDIUM_AND_ABOVE",
      harassment: "BLOCK_MEDIUM_AND_ABOVE",
      sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
    },
  },
  featureFlags: {
    podcastGeneration: true,
    personalizedFallacyQuiz: true,
    scriptureMemoryTool: true,
    ismAwarenessQuiz: true, 
  },
};

// In-memory store for app settings (simulating Firestore)
declare global {
  // eslint-disable-next-line no-var
  var tempAppSettingsStoreGlobal: AppSettings | undefined;
  // eslint-disable-next-line no-var
  var tempUserProfilesStoreGlobal: ConceptuallyAddedUserProfile[] | undefined;
  // eslint-disable-next-line no-var
  var userDashboardPreferencesStoreGlobal: { [userId: string]: UserDashboardPreference } | undefined;
}

// Function to ensure the global settings store is initialized
function ensureSettingsStore(): AppSettings {
  if (!global.tempAppSettingsStoreGlobal) {
    global.tempAppSettingsStoreGlobal = JSON.parse(JSON.stringify(initialSettings));
  }
  return global.tempAppSettingsStoreGlobal;
}

// Function to ensure the global user profiles store is initialized
function ensureUserProfilesStore(): ConceptuallyAddedUserProfile[] {
  if (!global.tempUserProfilesStoreGlobal) {
    global.tempUserProfilesStoreGlobal = [];
  }
  return global.tempUserProfilesStoreGlobal;
}

export async function ensureUserDashboardPreferencesStore(): Promise<{ [userId: string]: UserDashboardPreference }> {
  if (!global.userDashboardPreferencesStoreGlobal) {
    global.userDashboardPreferencesStoreGlobal = {
      'default': { 
        enabled: true, 
        notes: "Default user dashboard message. Edit this on your profile.", 
        symbolicPlaceholder: false, 
        imageUrl: "https://placehold.co/300x200.png"
      },
      'admin': { enabled: true, notes: "Admin User: The image provided appeared all black. This square is a symbolic placement.", symbolicPlaceholder: true, symbolicColor: "black" },
      'richard': { enabled: true, notes: "Richard's custom dashboard message. Welcome back!", imageUrl: "https://placehold.co/200x100.png" },
      'meta': { enabled: true, notes: "Meta Admin: Dashboard ready for configuration.", symbolicPlaceholder: true, symbolicColor: "hsl(var(--primary))" },
    };
  }
  return global.userDashboardPreferencesStoreGlobal;
}


// Initialize stores on module load
ensureSettingsStore();
ensureUserProfilesStore();
ensureUserDashboardPreferencesStore();


// --- Server Actions ---

export async function fetchAppSettings(): Promise<AppSettings> {
  const store = ensureSettingsStore(); 
  return JSON.parse(JSON.stringify(store)); 
}

const generalSettingsSchema = z.object({
  appName: z.string().min(3, "App name must be at least 3 characters"),
  defaultTheme: z.enum([
    "light",
    "dark",
    "system",
    "olive",
    "beige-brown",
    "sunrise",
  ]),
});

export async function saveGeneralSettings(
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const appName = formData.get("appName") as string;
  const defaultTheme = formData.get("defaultTheme") as string;

  const validation = generalSettingsSchema.safeParse({ appName, defaultTheme });
  if (!validation.success) {
    return { success: false, message: "Validation failed.", errors: validation.error.issues };
  }

  const store = ensureSettingsStore(); 
  store.general = validation.data;
  
  revalidatePath("/settings");
  return { success: true, message: "General settings saved successfully." };
}

const aiSettingsSchema = z.object({
    defaultModel: z.string().min(1, "Default AI model cannot be empty."),
    safetyHateSpeech: z.string(),
    safetyDangerousContent: z.string(),
    safetyHarassment: z.string(),
    safetySexuallyExplicit: z.string(),
});

export async function saveAiSettings(
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
    const defaultModel = formData.get("defaultModel") as string;
    const safetyHateSpeech = formData.get("safetyHateSpeech") as string;
    const safetyDangerousContent = formData.get("safetyDangerousContent") as string;
    const safetyHarassment = formData.get("safetyHarassment") as string;
    const safetySexuallyExplicit = formData.get("safetySexuallyExplicit") as string;

    const validation = aiSettingsSchema.safeParse({
        defaultModel,
        safetyHateSpeech,
        safetyDangerousContent,
        safetyHarassment,
        safetySexuallyExplicit,
    });

    if (!validation.success) {
        return { success: false, message: "Validation failed.", errors: validation.error.issues };
    }
    
  const store = ensureSettingsStore(); 
  store.ai = {
      defaultModel: validation.data.defaultModel,
      safetyFilters: {
          hateSpeech: validation.data.safetyHateSpeech,
          dangerousContent: validation.data.safetyDangerousContent,
          harassment: validation.data.safetyHarassment,
          sexuallyExplicit: validation.data.safetySexuallyExplicit,
      }
  };
  revalidatePath("/settings");
  return { success: true, message: "AI settings saved successfully." };
}

const featureFlagsSchema = z.object({
    podcastGeneration: z.boolean(),
    personalizedFallacyQuiz: z.boolean(),
    scriptureMemoryTool: z.boolean(),
    ismAwarenessQuiz: z.boolean(),
});

export async function saveFeatureFlags(
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  
  const dataToValidate = {
    podcastGeneration: formData.get("podcastGeneration") === "on",
    personalizedFallacyQuiz: formData.get("personalizedFallacyQuiz") === "on",
    scriptureMemoryTool: formData.get("scriptureMemoryTool") === "on",
    ismAwarenessQuiz: formData.get("ismAwarenessQuiz") === "on",
  };

  const validation = featureFlagsSchema.safeParse(dataToValidate);

   if (!validation.success) {
    return { success: false, message: "Validation failed.", errors: validation.error.issues };
  }

  const store = ensureSettingsStore(); 
  store.featureFlags = validation.data;
  revalidatePath("/settings");
  revalidatePath("/learning"); // To reflect updated learning tools
  return { success: true, message: "Feature flags saved successfully." };
}

export async function manageGlossaryAction() {
  return { success: true, message: "Navigating to glossary management (placeholder)." };
}

export async function editLearnMoreAction() {
  return { success: true, message: "Navigating to guide editor (placeholder)." };
}

const addUserProfileSchema = z.object({
  newUserEmail: z.string().email("Invalid email address."),
  newDisplayName: z.string().min(3, "Display name must be at least 3 characters."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  isAdmin: z.boolean().optional(),
});

export type ConceptuallyAddedUserProfile = z.infer<typeof addUserProfileSchema> & { id: string };

export type AddUserFormState = {
    success: boolean;
    message: string;
    errors?: z.ZodIssue[];
};


export async function addUserProfileAction(
  prevState: AddUserFormState,
  formData: FormData
): Promise<AddUserFormState> {
  const data = {
    newUserEmail: formData.get("newUserEmail") as string,
    newDisplayName: formData.get("newDisplayName") as string,
    newPassword: formData.get("newPassword") as string,
    isAdmin: formData.get("isAdmin") === "on",
  };

  const validation = addUserProfileSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, message: "Validation failed.", errors: validation.error.issues };
  }
  
  const userProfilesStore = ensureUserProfilesStore(); 
  const newUser: ConceptuallyAddedUserProfile = {
    id: `user-${Date.now()}`,
    ...validation.data
  };
  userProfilesStore.push(newUser);

  // Initialize dashboard preference for the new user
  const dashboardPrefsStore = await ensureUserDashboardPreferencesStore(); 
  dashboardPrefsStore[newUser.id] = {
    enabled: false, // Default to disabled
    notes: `Welcome, ${validation.data.newDisplayName}! Customize your dashboard message on your profile.`,
    symbolicPlaceholder: true,
    symbolicColor: "hsl(var(--muted-foreground))"
  };
  
  revalidatePath("/settings");
  revalidatePath("/profile"); 
  return { success: true, message: `Conceptual user profile for ${validation.data.newDisplayName} (${validation.data.newUserEmail}) added.`, errors: undefined };
}

export async function fetchConceptuallyAddedUserProfiles(): Promise<ConceptuallyAddedUserProfile[]> {
  const store = ensureUserProfilesStore(); 
  return JSON.parse(JSON.stringify(store)); 
}

export async function deleteConceptualUserAction(userId: string): Promise<{ success: boolean; message: string }> {
  const userProfilesStore = ensureUserProfilesStore();
  const initialLength = userProfilesStore.length;
  global.tempUserProfilesStoreGlobal = userProfilesStore.filter(user => user.id !== userId);

  const dashboardPrefsStore = await ensureUserDashboardPreferencesStore(); 
  if (dashboardPrefsStore[userId]) {
    delete dashboardPrefsStore[userId];
  }

  if (global.tempUserProfilesStoreGlobal.length < initialLength) {
    revalidatePath("/settings");
    revalidatePath("/profile");
    return { success: true, message: `Conceptual user ${userId} deleted.` };
  } else {
    return { success: false, message: `Conceptual user ${userId} not found.` };
  }
}

