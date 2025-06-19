
"use client";

import { useEffect, useState, useTransition, FormEvent, useActionState as useReactActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ShieldCheck, UserPlus, Trash2, BookOpen, Edit3 } from "lucide-react";
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
  AlertDialogContent as DeleteAlertDialogContent, 
  AlertDialogDescription as DeleteAlertDialogDescription,
  AlertDialogFooter as DeleteAlertDialogFooter,
  AlertDialogHeader as DeleteAlertDialogHeader,
  AlertDialogTitle as DeleteAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchAppSettings,
  saveGeneralSettings,
  saveAiSettings,
  saveFeatureFlags,
  addUserProfileAction,
  fetchConceptuallyAddedUserProfiles, 
  deleteConceptualUserAction, 
  type AppSettings,
  type AddUserFormState,
  type ConceptuallyAddedUserProfile 
} from "./actions";
import { useRouter } from "next/navigation";
import type { ZodIssue } from "zod";
import { useTheme } from "next-themes";
import { FeaturesGuideModal } from "@/components/features-guide";


const ADMIN_EMAILS = ["admin@kjvsentinel.com", "meta@kjvsentinel.com"]; 

const initialAddUserState: AddUserFormState = {
    message: "",
    success: false,
    errors: undefined,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGeneral, startSavingGeneralTransition] = useTransition();
  const [isSavingAi, startSavingAiTransition] = useTransition();
  const [isSavingFeatures, startSavingFeaturesTransition] = useTransition();

  const [addUserFormState, addUserFormAction, isAddingUserPending] = useReactActionState(addUserProfileAction, initialAddUserState);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const addUserFormRef = useRef<HTMLFormElement>(null);

  const [conceptuallyAddedUsers, setConceptuallyAddedUsers] = useState<ConceptuallyAddedUserProfile[]>([]);
  const [isLoadingUsers, startLoadingUsersTransition] = useTransition();
  const [isDeletingUser, startDeletingUserTransition] = useTransition();
  const [userToDelete, setUserToDelete] = useState<ConceptuallyAddedUserProfile | null>(null);

  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);


  useEffect(() => {
    const activeUserEmail = localStorage.getItem('conceptualUserEmail');
    const bypassActive = localStorage.getItem('adminBypassActive') === 'true';
    if (bypassActive || (activeUserEmail && ADMIN_EMAILS.includes(activeUserEmail.toLowerCase())) ) {
      setIsUserAdmin(true);
    } else {
      setIsUserAdmin(false);
    }
    setAuthCheckCompleted(true);
  }, []);


  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const fetchedSettings = await fetchAppSettings();
      setSettings(fetchedSettings);
      const fetchedUsers = await fetchConceptuallyAddedUserProfiles();
      setConceptuallyAddedUsers(fetchedUsers);
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
    if (authCheckCompleted) {
        if (isUserAdmin) {
            loadInitialData();
        } else {
            setIsLoading(false); 
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserAdmin, authCheckCompleted]);

  useEffect(() => {
    if (addUserFormState.message && (addUserFormState.success || addUserFormState.errors)) { 
        if (addUserFormState.success) {
            toast({ title: "User Action", description: addUserFormState.message });
            setIsAddUserDialogOpen(false); 
            addUserFormRef.current?.reset(); 
            startLoadingUsersTransition(async () => {
                const fetchedUsers = await fetchConceptuallyAddedUserProfiles();
                setConceptuallyAddedUsers(fetchedUsers);
            });
        } else {
            toast({
                title: "Failed to Add User",
                description: addUserFormState.message + (addUserFormState.errors ? ` Errors: ${addUserFormState.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ')}` : ''),
                variant: "destructive",
                duration: 7000,
            });
        }
    }
  }, [addUserFormState, toast]);


  const handleFormSubmit = async (
    event: FormEvent<HTMLFormElement>,
    saveAction: (formData: FormData) => Promise<{ success: boolean; message: string; errors?: ZodIssue[] }>,
    startTransition: React.TransitionStartFunction,
    actionType?: "general" | "ai" | "features"
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveAction(formData);
      if (result.success) {
        toast({ title: "Settings Saved", description: result.message });
        const fetchedSettings = await fetchAppSettings(); 
        setSettings(fetchedSettings);
        if (actionType === "general" && fetchedSettings) {
            setTheme(fetchedSettings.general.defaultTheme);
        }
      } else {
        toast({
          title: "Save Failed",
          description: result.message + (result.errors ? ` Errors: ${result.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')}` : ''),
          variant: "destructive",
          duration: 7000,
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
      setUserToDelete(null); 
    });
  };
  
  if (!authCheckCompleted) {
    return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
    );
  }

  if (!isUserAdmin) { 
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

  if (!settings && !isLoading) { 
    return (
       <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-center text-destructive">Failed to load settings.</p>
            <Button onClick={loadInitialData} variant="outline">Try Again</Button>
        </div>
    );
  }
  
  if (!settings) return null;


  return (
    <>
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ShieldCheck className="mr-3 h-8 w-8 text-primary" /> Admin Settings
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Application Settings</CardTitle>
          <CardDescription>Configure basic application properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveGeneralSettings, startSavingGeneralTransition, "general")} className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Manage AI model settings and safety filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveAiSettings, startSavingAiTransition, "ai")} className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable specific application features.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleFormSubmit(e, saveFeatureFlags, startSavingFeaturesTransition, "features")} className="space-y-4">
            {[
              { id: "podcastGeneration", label: "Podcast Generation (Teaching Reports)", checked: settings.featureFlags.podcastGeneration },
              { id: "personalizedFallacyQuiz", label: "Personalized Fallacy Quizzes (from Reports)", checked: settings.featureFlags.personalizedFallacyQuiz },
              { id: "scriptureMemoryTool", label: "Scripture Memory Tool", checked: settings.featureFlags.scriptureMemoryTool },
              { id: "ismAwarenessQuiz", label: "Ism Awareness Quiz (Learning Tools)", checked: settings.featureFlags.ismAwarenessQuiz },
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

      <Card>
        <CardHeader>
          <CardTitle>Content & User Management</CardTitle>
          <CardDescription>Manage application data and users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Conceptually Added Users (Current Session)</h3>
            {isLoadingUsers && <p className="text-sm text-muted-foreground">Loading users...</p>}
            {!isLoadingUsers && conceptuallyAddedUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">No conceptual users added yet in this session.</p>
            )}
            {!isLoadingUsers && conceptuallyAddedUsers.length > 0 && (
              <ScrollArea className="max-h-60 border rounded-md">
                <ul className="space-y-px p-3">
                  {conceptuallyAddedUsers.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
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
              </ScrollArea>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={() => router.push('/glossary')}>
                <BookOpen className="mr-2 h-4 w-4" /> Manage Glossary Terms
            </Button>
            
            <FeaturesGuideModal>
                <Button variant="outline">
                    <Edit3 className="mr-2 h-4 w-4" /> View/Edit 'Learn More' Guide
                </Button>
            </FeaturesGuideModal>
            
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" /> Add New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Add New User Profile</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new user profile.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow py-4 pr-2 -mr-2">
                  <form ref={addUserFormRef} action={addUserFormAction} className="space-y-4">
                    <div>
                      <Label htmlFor="newUserEmail-add">Email</Label>
                      <Input id="newUserEmail-add" name="newUserEmail" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="newDisplayName-add">Display Name</Label>
                      <Input id="newDisplayName-add" name="newDisplayName" required />
                    </div>
                    <div>
                      <Label htmlFor="newPassword-add">Password</Label>
                      <Input id="newPassword-add" name="newPassword" type="password" required />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="isAdmin-add" name="isAdmin" />
                      <Label htmlFor="isAdmin-add">Grant Admin Privileges?</Label>
                    </div>
                    {addUserFormState.message && !addUserFormState.success && (
                      <p className="text-sm text-destructive text-center">{addUserFormState.message}</p>
                    )}
                    {addUserFormState.errors && (
                      <ul className="text-sm text-destructive list-disc list-inside">
                        {addUserFormState.errors.map((err, i) => <li key={i}>{err.path.join('.')}: {err.message}</li>)}
                      </ul>
                    )}
                    <DialogFooter className="mt-4 sticky bottom-0 bg-background py-3">
                      <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isAddingUserPending}>
                        {isAddingUserPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add User
                      </Button>
                    </DialogFooter>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {userToDelete && (
        <DeleteAlertDialogContent> 
          <DeleteAlertDialogHeader>
            <DeleteAlertDialogTitle>Are you sure?</DeleteAlertDialogTitle>
            <DeleteAlertDialogDescription>
              This will remove the conceptual user profile for &quot;{userToDelete.newDisplayName}&quot; ({userToDelete.newUserEmail}) from the current session.
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
    <FeaturesGuideModal> 
        <span className="hidden">Hidden Trigger for Programmatic Features Guide Modal</span>
    </FeaturesGuideModal>
    </>
  );
}

