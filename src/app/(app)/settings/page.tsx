
"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  fetchAppSettings,
  saveGeneralSettings,
  saveAiSettings,
  saveFeatureFlags,
  manageGlossaryAction,
  editLearnMoreAction,
  manageUsersAction,
  type AppSettings
} from "./actions";
import { useRouter } from "next/navigation"; // For redirection

// Mock admin email for UI simulation
const ADMIN_EMAIL = "admin@kjvsentinel.com"; 

// Simulate getting current user's email. In a real app, this would come from an auth context.
// For demo purposes, we'll simulate it. You can change this value to test admin/non-admin view.
const MOCK_CURRENT_USER_EMAIL = "admin@kjvsentinel.com"; // Change to "user@example.com" to see non-admin view

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGeneral, startSavingGeneralTransition] = useTransition();
  const [isSavingAi, startSavingAiTransition] = useTransition();
  const [isSavingFeatures, startSavingFeaturesTransition] = useTransition();

  // Simulated admin check
  const isUserAdmin = MOCK_CURRENT_USER_EMAIL === ADMIN_EMAIL;

  useEffect(() => {
    if (!isUserAdmin) {
        // Optionally redirect non-admins
        // router.push("/dashboard"); 
        // For now, just prevent loading settings and show access denied message
        setIsLoading(false); 
        return;
    }

    async function loadSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await fetchAppSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        toast({
          title: "Error Loading Settings",
          description: "Could not fetch current application settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [isUserAdmin, toast]);

  const handleFormSubmit = async (
    event: FormEvent<HTMLFormElement>,
    saveAction: (formData: FormData) => Promise<{ success: boolean; message: string; errors?: any[] }>,
    startTransition: React.TransitionStartFunction
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveAction(formData);
      if (result.success) {
        toast({ title: "Settings Saved", description: result.message });
        // Re-fetch settings to reflect changes if needed, though revalidatePath should handle it.
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

  if (!settings) {
    return <p className="text-center text-destructive">Failed to load settings. Please try again.</p>;
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
                  {/* Add other models as needed */}
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

      {/* Content & User Management (Placeholders) */}
      <Card>
        <CardHeader>
          <CardTitle>Content & User Management</CardTitle>
          <CardDescription>Manage application data and users (Placeholder Actions).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={async () => {
                const res = await manageGlossaryAction();
                toast({title: "Glossary Management", description: res.message });
            }}>Manage Glossary Terms</Button>
            <Button variant="outline" onClick={async () => {
                const res = await editLearnMoreAction();
                toast({title: "'Learn More' Guide", description: res.message });
            }}>Edit 'Learn More' Guide</Button>
            <Button variant="outline" onClick={async () => {
                const res = await manageUsersAction();
                toast({title: "User Management", description: res.message });
            }}>Manage Users</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
