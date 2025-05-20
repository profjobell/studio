
"use client";

import { useEffect, useState, useTransition, FormEvent, useActionState as useReactActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as DeleteAlertDialogContent, // Alias to avoid name clash
  AlertDialogDescription as DeleteAlertDialogDescription,
  AlertDialogFooter as DeleteAlertDialogFooter,
  AlertDialogHeader as DeleteAlertDialogHeader,
  AlertDialogTitle as DeleteAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchAppSettings,
  saveGeneralSettings,
  saveAiSettings,
  saveFeatureFlags,
  manageGlossaryAction,
  editLearnMoreAction,
  addUserProfileAction,
  fetchConceptuallyAddedUserProfiles, // Added
  deleteConceptualUserAction, // Added
  type AppSettings,
  type AddUserFormState,
  type ConceptuallyAddedUserProfile // Added
} from "./actions";
import { useRouter } from "next/navigation";
import type { ZodIssue } from "zod";

const ADMIN_EMAIL = "admin@kjvsentinel.com"; 
const MOCK_CURRENT_USER_EMAIL = "admin@kjvsentinel.com"; 

const initialAddUserState: AddUserFormState = {
    message: "",
    success: false,
    errors: undefined,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGeneral, startSavingGeneralTransition] = useTransition();
  const [isSavingAi, startSavingAiTransition] = useTransition();
  const [isSavingFeatures, startSavingFeaturesTransition] = useTransition();

  const [addUserFormState, addUserFormAction, isAddingUserPending] = useReactActionState(addUserProfileAction, initialAddUserState);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const [conceptuallyAddedUsers, setConceptuallyAddedUsers] = useState<ConceptuallyAddedUserProfile[]>([]);
  const [isLoadingUsers, startLoadingUsersTransition] = useTransition();
  const [isDeletingUser, startDeletingUserTransition] = useTransition();
  const [userToDelete, setUserToDelete] = useState<ConceptuallyAddedUserProfile | null>(null);


  const isUserAdmin = MOCK_CURRENT_USER_EMAIL === ADMIN_EMAIL;

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const fetchedSettings = await fetchAppSettings();
      setSettings(fetchedSettings);
      if (isUserAdmin) { // Only load conceptual users if admin
        const fetchedUsers = await fetchConceptuallyAddedUserProfiles();
        setConceptuallyAddedUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error Loading Data",
        description: "Could not fetch initial application data.",
        variant: "destructive",
      });
      setSettings(null);
      setConceptuallyAddedUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserAdmin && !isLoading) return;
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserAdmin, toast]); // Removed isLoading from dependencies to avoid re-triggering loadSettings on its own change

  useEffect(() => {
    if (addUserFormState.message && (addUserFormState.success || addUserFormState.errors)) { 
        if (addUserFormState.success) {
            toast({ title: "User Action", description: addUserFormState.message });
            setIsAddUserDialogOpen(false); 
            // Reload users list
            startLoadingUsersTransition(async () => {
                const fetchedUsers = await fetchConceptuallyAddedUserProfiles();
                setConceptuallyAddedUsers(fetchedUsers);
            });
        } else {
            toast({
                title: "Failed to Add User",
                description: addUserFormState.message + (addUserFormState.errors ? ` ${addUserFormState.errors.map((e: ZodIssue) => e.message).join(', ')}` : ''),
                variant: "destructive",
            });
        }
    }
  }, [addUserFormState, toast]);


  const handleFormSubmit = async (
    event: FormEvent<HTMLFormElement>,
    saveAction: (formData: FormData) => Promise<{ success: boolean; message: string; errors?: ZodIssue[] }>,
    startTransition: React.TransitionStartFunction
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveAction(formData);
      if (result.success) {
        toast({ title: "Settings Saved", description: result.message });
        const fetchedSettings = await fetchAppSettings(); 
        setSettings(fetchedSettings);
      } else {
        toast({
          title: "Save Failed",
          description: result.message + (result.errors ? ` ${result.errors.map(e => e.message).join(', ')}` : ''),
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteConceptualUser = async () => {
    if (!userToDelete) return;
    startDeletingUserTransition(async () => {
      const result = await deleteConceptualUserAction(userToDelete.id);
      if (result.success) {
        toast({ title: "User Deleted", description: result.message });
        setConceptuallyAddedUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      } else {
        toast({ title: "Delete Failed", description: result.message, variant: "destructive" });
      }
      setUserToDelete(null); // Close dialog
    });
  };
  
  if (!isUserAdmin && !isLoading) { 
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center p-8">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="mt-4 text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to view this page. Please contact an administrator if you believe this is an error.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="mt-6">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
       <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-center text-destructive">Failed to load settings.</p>
            <Button onClick={loadInitialData} variant="outline">Try Again</Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ShieldCheck className="mr-3 h-8 w-8 text-primary" /> Admin Settings
        </h1>
      </div>

      {/* General App Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Application Settings</CardTitle>
          <CardDescription>Configure basic application properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveGeneralSettings, startSavingGeneralTransition)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input id="appName" name="appName" defaultValue={settings.general.appName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTheme">Default System Theme</Label>
              <Select name="defaultTheme" defaultValue={settings.general.defaultTheme}>
                <SelectTrigger id="defaultTheme">
                  <SelectValue placeholder="Select a default theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="olive">Olive Swathe</SelectItem>
                  <SelectItem value="beige-brown">Beige & Brown</SelectItem>
                  <SelectItem value="sunrise">Sunrise Vibrant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSavingGeneral}>
              {isSavingGeneral && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save General Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* AI Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Manage AI model settings and safety filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveAiSettings, startSavingAiTransition)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultModel">Default AI Model</Label>
              <Select name="defaultModel" defaultValue={settings.ai.defaultModel}>
                <SelectTrigger id="defaultModel">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="googleai/gemini-pro">Gemini Pro (Example)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Gemini Safety Filters</Label>
              <p className="text-xs text-muted-foreground">Configure thresholds for content blocking.</p>
            </div>
            {[
                {id: "safetyHateSpeech", label: "Hate Speech", category: "HARM_CATEGORY_HATE_SPEECH", value: settings.ai.safetyFilters.hateSpeech},
                {id: "safetyDangerousContent", label: "Dangerous Content", category: "HARM_CATEGORY_DANGEROUS_CONTENT", value: settings.ai.safetyFilters.dangerousContent},
                {id: "safetyHarassment", label: "Harassment", category: "HARM_CATEGORY_HARASSMENT", value: settings.ai.safetyFilters.harassment},
                {id: "safetySexuallyExplicit", label: "Sexually Explicit", category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", value: settings.ai.safetyFilters.sexuallyExplicit},
            ].map(filter => (
                 <div key={filter.id} className="space-y-2">
                    <Label htmlFor={filter.id}>{filter.label}</Label>
                    <Select name={filter.id} defaultValue={filter.value}>
                        <SelectTrigger id={filter.id}><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BLOCK_NONE">Block None</SelectItem>
                            <SelectItem value="BLOCK_ONLY_HIGH">Block Only High</SelectItem>
                            <SelectItem value="BLOCK_MEDIUM_AND_ABOVE">Block Medium & Above</SelectItem>
                            <SelectItem value="BLOCK_LOW_AND_ABOVE">Block Low & Above</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            ))}
            
            <div className="space-y-2">
                <Label>AI API Keys (Placeholder)</Label>
                <Input type="password" placeholder="Enter Google AI API Key (Handled via .env)" disabled />
                <p className="text-xs text-muted-foreground">API keys should be managed via environment variables for security.</p>
            </div>
            <Button type="submit" disabled={isSavingAi}>
              {isSavingAi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save AI Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Feature Flags Card */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable specific application features.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveFeatureFlags, startSavingFeaturesTransition)} className="space-y-4">
            {[
              { id: "podcastGeneration", label: "Podcast Generation", checked: settings.featureFlags.podcastGeneration },
              { id: "personalizedFallacyQuiz", label: "Personalized Fallacy Quizzes", checked: settings.featureFlags.personalizedFallacyQuiz },
              { id: "scriptureMemoryTool", label: "Scripture Memory Tool", checked: settings.featureFlags.scriptureMemoryTool },
              { id: "ismAwarenessQuiz", label: "Ism Awareness Quiz", checked: settings.featureFlags.ismAwarenessQuiz },
            ].map((feature) => (
              <div key={feature.id} className="flex items-center justify-between">
                <Label htmlFor={feature.id} className="flex-grow">{feature.label}</Label>
                <Switch id={feature.id} name={feature.id} defaultChecked={feature.checked} />
              </div>
            ))}
            <Button type="submit" disabled={isSavingFeatures}>
              {isSavingFeatures && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Feature Flags
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Separator />

      {/* Content & User Management */}
      <Card>
        <CardHeader>
          <CardTitle>Content & User Management</CardTitle>
          <CardDescription>Manage application data and users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conceptual User Listing */}
          <div>
            <h3 className="text-lg font-medium mb-2">Conceptually Added Users</h3>
            {isLoadingUsers && <p className="text-sm text-muted-foreground">Loading users...</p>}
            {!isLoadingUsers && conceptuallyAddedUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">No conceptual users added yet in this session.</p>
            )}
            {!isLoadingUsers && conceptuallyAddedUsers.length > 0 && (
              <ul className="space-y-3">
                {conceptuallyAddedUsers.map(user => (
                  <li key={user.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <p className="font-semibold">{user.newDisplayName}</p>
                      <p className="text-sm text-muted-foreground">{user.newUserEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {user.isAdmin && <ShieldCheck className="h-5 w-5 text-primary" title="Admin Privileges"/>}
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setUserToDelete(user)}
                        disabled={isDeletingUser}
                        className="text-destructive hover:text-destructive/80"
                       >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete user</span>
                       </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={async () => {
                const res = await manageGlossaryAction();
                toast({title: "Glossary Management", description: res.message });
            }}>Manage Glossary Terms</Button>
            <Button variant="outline" onClick={async () => {
                const res = await editLearnMoreAction();
                toast({title: "'Learn More' Guide", description: res.message });
            }}>Edit 'Learn More' Guide</Button>
            
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" /> Add New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User Profile</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new user. This is a conceptual feature and does not create real accounts.
                  </DialogDescription>
                </DialogHeader>
                <form action={addUserFormAction} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newUserEmail" className="text-right">
                      Email
                    </Label>
                    <Input id="newUserEmail" name="newUserEmail" type="email" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newDisplayName" className="text-right">
                      Display Name
                    </Label>
                    <Input id="newDisplayName" name="newDisplayName" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newPassword" className="text-right">
                      Password
                    </Label>
                    <Input id="newPassword" name="newPassword" type="password" className="col-span-3" required />
                  </div>
                  <div className="flex items-center space-x-2 mt-2 pl-4">
                    <Switch id="isAdmin" name="isAdmin" />
                    <Label htmlFor="isAdmin">Grant Admin Privileges?</Label>
                  </div>
                  {addUserFormState.message && !addUserFormState.success && (
                     <p className="col-span-4 text-sm text-destructive text-center">{addUserFormState.message}</p>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isAddingUserPending}>
                      {isAddingUserPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add User (Simulated)
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {/* Placeholder for Manage Existing Users - would be a link/button to a separate user management page */}
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      {userToDelete && (
        <DeleteAlertDialogContent>
          <DeleteAlertDialogHeader>
            <DeleteAlertDialogTitle>Are you sure?</DeleteAlertDialogTitle>
            <DeleteAlertDialogDescription>
              This will remove the conceptual user profile for &quot;{userToDelete.newDisplayName}&quot; ({userToDelete.newUserEmail}) from the current session. This action is only for this demo session and does not affect real user accounts.
            </DeleteAlertDialogDescription>
          </DeleteAlertDialogHeader>
          <DeleteAlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConceptualUser} 
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </DeleteAlertDialogFooter>
        </DeleteAlertDialogContent>
      )}
    </div>
  );
}
