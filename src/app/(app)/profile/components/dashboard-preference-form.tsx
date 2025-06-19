
"use client";

import { useEffect, useState, useTransition, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchUserDashboardPreference, updateUserDashboardPreference } from "../actions";
import type { UserDashboardPreference } from "@/types";
import { Loader2, Image as ImageIcon, Info, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image"; // For preview


interface DashboardPreferenceFormProps {
  userId: string | null;
}

const defaultPreference: UserDashboardPreference = {
  enabled: false,
  imageUrl: "",
  notes: "Customize your dashboard message here!",
  symbolicPlaceholder: true,
  symbolicColor: "#333333",
};

export function DashboardPreferenceForm({ userId }: DashboardPreferenceFormProps) {
  const [preference, setPreference] = useState<UserDashboardPreference>(defaultPreference);
  const [isLoading, startLoadingTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      startLoadingTransition(async () => {
        const fetchedPreference = await fetchUserDashboardPreference(userId);
        if (fetchedPreference) {
          setPreference(fetchedPreference);
          if (fetchedPreference.imageUrl && !fetchedPreference.symbolicPlaceholder) {
            if (fetchedPreference.imageUrl.startsWith('data:image')) {
              setImagePreview(fetchedPreference.imageUrl);
              setUploadedFileName("Previously uploaded image");
            } else {
              setImagePreview(fetchedPreference.imageUrl); // For external URLs
              setUploadedFileName(null); // Not an upload, but an external URL
            }
          } else {
            setImagePreview(null);
            setUploadedFileName(null);
          }
        } else {
           setPreference({
            ...defaultPreference,
            notes: `Welcome! Customize your dashboard section here.`
          });
          setImagePreview(null);
          setUploadedFileName(null);
        }
      });
    }
  }, [userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast({ title: "Error", description: "User not identified.", variant: "destructive" });
      return;
    }

    // If a new file was selected and previewed, its data URI is already in preference.imageUrl
    // If an external URL was typed, it's also in preference.imageUrl
    // If symbolic placeholder is chosen, imageUrl might be irrelevant or could be cleared.

    startSavingTransition(async () => {
      const result = await updateUserDashboardPreference(userId, preference);
      if (result.success) {
        toast({ title: "Preference Saved", description: result.message });
      } else {
        toast({ title: "Save Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreference(prev => ({ ...prev, [name]: value }));
    if (name === "imageUrl") { // If user types in URL, clear file upload state
        setImagePreview(value); // Show preview of typed URL
        setUploadedFileName(null);
    }
  };
  
  const handleSwitchChange = (checked: boolean, name: keyof UserDashboardPreference) => {
    setPreference(prev => ({ ...prev, [name]: checked }));
    if (name === "symbolicPlaceholder" && checked) { // If switching to symbolic, clear image preview
        setImagePreview(null);
        setUploadedFileName(null);
        // Optionally clear imageUrl if symbolic is chosen
        // setPreference(prev => ({ ...prev, imageUrl: "" })); 
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreference(prev => ({ ...prev, imageUrl: dataUri, symbolicPlaceholder: false }));
        setImagePreview(dataUri);
        setUploadedFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading dashboard preferences...</span>
      </div>
    );
  }
  
  if (!userId) {
    return <p className="text-muted-foreground">User ID not available. Cannot load preferences.</p>;
  }

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Custom Dashboard Welcome Section
            </CardTitle>
            <CardDescription>
                Personalize the welcome message and image/placeholder shown on your dashboard.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-2">
                <Switch
                id="enabled"
                name="enabled"
                checked={preference.enabled}
                onCheckedChange={(checked) => handleSwitchChange(checked, "enabled")}
                />
                <Label htmlFor="enabled">Enable Custom Dashboard Section</Label>
            </div>

            {preference.enabled && (
                <>
                <div className="flex items-center space-x-2">
                    <Switch
                    id="symbolicPlaceholder"
                    name="symbolicPlaceholder"
                    checked={preference.symbolicPlaceholder}
                    onCheckedChange={(checked) => {
                        handleSwitchChange(checked, "symbolicPlaceholder");
                        if (checked) { // If switching to symbolic
                            setPreference(prev => ({ ...prev, imageUrl: "" })); // Clear image URL
                            setImagePreview(null);
                            setUploadedFileName(null);
                        }
                    }}
                    />
                    <Label htmlFor="symbolicPlaceholder">Use Symbolic Color Placeholder</Label>
                </div>

                {preference.symbolicPlaceholder ? (
                    <div className="space-y-2">
                        <Label htmlFor="symbolicColor">Symbolic Placeholder Color</Label>
                        <Input
                            id="symbolicColor"
                            name="symbolicColor"
                            type="color"
                            value={preference.symbolicColor || "#000000"}
                            onChange={handleInputChange}
                            className="w-24 h-10 p-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Choose a color for the symbolic square.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="imageUrl">Image URL (External Link)</Label>
                            <Input
                                id="imageUrl"
                                name="imageUrl"
                                value={preference.imageUrl && !preference.imageUrl.startsWith('data:image') ? preference.imageUrl : ""}
                                onChange={handleInputChange}
                                placeholder="https://example.com/your-image.png"
                                disabled={!!uploadedFileName} 
                            />
                            <p className="text-xs text-muted-foreground mt-1">Paste an external image URL, or use the upload option below.</p>
                        </div>
                        <div className="relative p-4 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                            <Label htmlFor="imageUpload" className="block text-sm font-medium text-center cursor-pointer">
                                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                {uploadedFileName ? `File: ${uploadedFileName}` : "Click to upload or drag & drop image"}
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 1MB (recommended)</p>
                            </Label>
                            <Input
                                id="imageUpload"
                                name="imageUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                         {imagePreview && (
                            <div className="mt-2">
                                <Label>Image Preview:</Label>
                                <div className="relative w-full max-w-xs h-32 border rounded-md overflow-hidden bg-muted">
                                <Image src={imagePreview} alt="Preview" fill style={{objectFit: "contain"}} data-ai-hint="image preview"/>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Welcome Message</Label>
                    <Textarea
                    id="notes"
                    name="notes"
                    value={preference.notes || ""}
                    onChange={handleInputChange}
                    placeholder="Your custom message for the dashboard..."
                    rows={3}
                    />
                </div>
                </>
            )}
             <Button type="submit" disabled={isSaving || isLoading || !preference.enabled}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Dashboard Preference
            </Button>
             {!preference.enabled && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Info className="h-3 w-3"/> Enable the custom section to edit and save preferences.
                </p>
            )}
            </form>
        </CardContent>
    </Card>
  );
}

