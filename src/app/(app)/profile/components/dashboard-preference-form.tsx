
"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchUserDashboardPreference, updateUserDashboardPreference } from "../actions";
import type { UserDashboardPreference } from "@/types";
import { Loader2, Image as ImageIcon, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


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

  useEffect(() => {
    if (userId) {
      startLoadingTransition(async () => {
        const fetchedPreference = await fetchUserDashboardPreference(userId);
        if (fetchedPreference) {
          setPreference(fetchedPreference);
        } else {
          // If no preference exists, initialize for the user (could also be done on first save)
          // For now, we use a client-side default, backend will create if not exists on update.
           setPreference({
            ...defaultPreference,
            notes: `Welcome! Customize your dashboard section here.`
          });
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
  };

  const handleSwitchChange = (checked: boolean, name: keyof UserDashboardPreference) => {
    setPreference(prev => ({ ...prev, [name]: checked }));
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
                Personalize the welcome message and image shown on your dashboard.
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
                    onCheckedChange={(checked) => handleSwitchChange(checked, "symbolicPlaceholder")}
                    />
                    <Label htmlFor="symbolicPlaceholder">Use Symbolic Placeholder (instead of Image URL)</Label>
                </div>

                {!preference.symbolicPlaceholder ? (
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                            id="imageUrl"
                            name="imageUrl"
                            value={preference.imageUrl || ""}
                            onChange={handleInputChange}
                            placeholder="https://example.com/your-image.png"
                        />
                        <p className="text-xs text-muted-foreground">Enter a direct link to an image (e.g., PNG, JPG).</p>
                    </div>
                ) : (
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
                        <p className="text-xs text-muted-foreground">Choose a color for the symbolic square.</p>
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
