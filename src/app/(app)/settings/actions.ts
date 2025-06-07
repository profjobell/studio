
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
    ismAwarenessQuiz: false,
  },
};

// In-memory store for app settings (simulating Firestore)
declare global {
  // eslint-disable-next-line no-var
  var tempAppSettingsStoreGlobal: AppSettings | undefined;
  // eslint-disable-next-line no-var
  var tempUserProfilesStoreGlobal: ConceptuallyAddedUserProfile[] | undefined;
}

// Function to ensure the global settings store is initialized
function ensureSettingsStore(): AppSettings {
  if (!global.tempAppSettingsStoreGlobal) {
    console.log("Initializing global.tempAppSettingsStoreGlobal with initialSettings.");
    global.tempAppSettingsStoreGlobal = JSON.parse(JSON.stringify(initialSettings));
  }
  return global.tempAppSettingsStoreGlobal;
}

// Function to ensure the global user profiles store is initialized
function ensureUserProfilesStore(): ConceptuallyAddedUserProfile[] {
  if (!global.tempUserProfilesStoreGlobal) {
    console.log("Initializing global.tempUserProfilesStoreGlobal as empty array.");
    global.tempUserProfilesStoreGlobal = [];
  }
  return global.tempUserProfilesStoreGlobal;
}


// Initialize stores on module load
ensureSettingsStore();
ensureUserProfilesStore();


// --- Server Actions ---

export async function fetchAppSettings(): Promise<AppSettings> {
  console.log("Server Action: Fetching app settings");
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

  console.log("Server Action: Saving General App Settings:", validation.data);
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
    
  console.log("Server Action: Saving AI Configuration:", validation.data);
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

  console.log("Server Action: Saving Feature Flags:", validation.data);
  const store = ensureSettingsStore(); 
  store.featureFlags = validation.data;
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

  // For a "live" version, here you would integrate Firebase Authentication:
  // try {
  //   const userCredential = await createUserWithEmailAndPassword(auth, validation.data.newUserEmail, validation.data.newPassword);
  //   await updateProfile(userCredential.user, { displayName: validation.data.newDisplayName });
  //   if (validation.data.isAdmin) {
  //     // Set custom claims for admin role (requires Admin SDK on a backend)
  //     // For client-side, this part is conceptual or managed differently.
  //     console.log(`Admin role conceptually assigned to ${validation.data.newUserEmail}`);
  //   }
  //   revalidatePath("/settings");
  //   revalidatePath("/profile");
  //   return { success: true, message: `User ${validation.data.newDisplayName} created successfully.`, errors: undefined };
  // } catch (error: any) {
  //   console.error("Error creating Firebase user:", error);
  //   return { success: false, message: error.message || "Failed to create user.", errors: undefined };
  // }
  
  // Current conceptual user addition:
  console.log("Server Action: Adding New Conceptual User Profile:", validation.data);
  const userProfilesStore = ensureUserProfilesStore(); 
  const newUser: ConceptuallyAddedUserProfile = {
    id: `user-${Date.now()}`,
    ...validation.data
  };
  userProfilesStore.push(newUser);
  
  revalidatePath("/settings");
  revalidatePath("/profile"); 
  return { success: true, message: `Conceptual user profile for ${validation.data.newDisplayName} (${validation.data.newUserEmail}) added.`, errors: undefined };
}

export async function fetchConceptuallyAddedUserProfiles(): Promise<ConceptuallyAddedUserProfile[]> {
  console.log("Server Action: Fetching conceptually added user profiles");
  const store = ensureUserProfilesStore(); 
  return JSON.parse(JSON.stringify(store)); 
}

export async function deleteConceptualUserAction(userId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Deleting conceptual user ID: ${userId}`);
  const userProfilesStore = ensureUserProfilesStore();
  const initialLength = userProfilesStore.length;
  global.tempUserProfilesStoreGlobal = userProfilesStore.filter(user => user.id !== userId);

  if (global.tempUserProfilesStoreGlobal.length < initialLength) {
    revalidatePath("/settings");
    revalidatePath("/profile");
    return { success: true, message: `Conceptual user ${userId} deleted.` };
  } else {
    return { success: false, message: `Conceptual user ${userId} not found.` };
  }
}
