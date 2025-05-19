
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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

// In-memory store for app settings (simulating Firestore)
declare global {
  // eslint-disable-next-line no-var
  var tempAppSettingsStoreGlobal: AppSettings | undefined;
}

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
    ismAwarenessQuiz: false, // Example: initially disabled
  },
};

if (process.env.NODE_ENV === 'production') {
  if (!global.tempAppSettingsStoreGlobal) {
    global.tempAppSettingsStoreGlobal = JSON.parse(JSON.stringify(initialSettings));
  }
} else {
  if (!global.tempAppSettingsStoreGlobal) {
    global.tempAppSettingsStoreGlobal = JSON.parse(JSON.stringify(initialSettings));
  }
}
const tempAppSettingsStore = global.tempAppSettingsStoreGlobal;


// --- Server Actions ---

export async function fetchAppSettings(): Promise<AppSettings> {
  console.log("Server Action: Fetching app settings (simulated)");
  return JSON.parse(JSON.stringify(tempAppSettingsStore)); // Return a deep copy
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
  //prevState: any, // For useActionState - if we switch to it
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const appName = formData.get("appName") as string;
  const defaultTheme = formData.get("defaultTheme") as string;

  const validation = generalSettingsSchema.safeParse({ appName, defaultTheme });
  if (!validation.success) {
    return { success: false, message: "Validation failed.", errors: validation.error.issues };
  }

  console.log("Server Action: Saving General App Settings (simulated):", validation.data);
  if (tempAppSettingsStore) {
    tempAppSettingsStore.general = validation.data;
  }
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
  //prevState: any,
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
    
  console.log("Server Action: Saving AI Configuration (simulated):", validation.data);
  if (tempAppSettingsStore) {
    tempAppSettingsStore.ai = {
        defaultModel: validation.data.defaultModel,
        safetyFilters: {
            hateSpeech: validation.data.safetyHateSpeech,
            dangerousContent: validation.data.safetyDangerousContent,
            harassment: validation.data.safetyHarassment,
            sexuallyExplicit: validation.data.safetySexuallyExplicit,
        }
    };
  }
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
  //prevState: any,
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

  console.log("Server Action: Saving Feature Flags (simulated):", validation.data);
  if (tempAppSettingsStore) {
    tempAppSettingsStore.featureFlags = validation.data;
  }
  revalidatePath("/settings");
  return { success: true, message: "Feature flags saved successfully." };
}

export async function manageGlossaryAction() {
  console.log("Server Action: Manage Glossary Terms (placeholder)");
  return { success: true, message: "Navigating to glossary management (placeholder)." };
}

export async function editLearnMoreAction() {
  console.log("Server Action: Edit 'Learn More' Guide Content (placeholder)");
  return { success: true, message: "Navigating to guide editor (placeholder)." };
}

export async function manageUsersAction() {
  console.log("Server Action: Manage Users (placeholder)");
  // This would typically navigate to a user management page or open a detailed dialog.
  // For now, just a log and a toast message precursor.
  return { success: true, message: "User management interface would open here (placeholder)." };
}

// New Action for Adding User Profile
const addUserProfileSchema = z.object({
  newUserEmail: z.string().email("Invalid email address."),
  newDisplayName: z.string().min(3, "Display name must be at least 3 characters."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  isAdmin: z.boolean().optional(),
});

export async function addUserProfileAction(
  prevState: { success: boolean; message: string; errors?: z.ZodIssue[] },
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
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

  console.log("Server Action: Adding New User Profile (Simulated):", validation.data);
  // In a real app, you would:
  // 1. Call Firebase Auth to create the user: admin.auth().createUser({...})
  // 2. If successful, potentially set custom claims for admin role.
  // 3. Store additional profile info in Firestore if needed.
  
  // For this demo, we just log it.
  return { success: true, message: `User profile for ${validation.data.newDisplayName} (${validation.data.newUserEmail}) added conceptually.` };
}
