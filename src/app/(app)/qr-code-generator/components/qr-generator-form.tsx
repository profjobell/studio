
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Image as ImageIcon, Palette, ScanLine, UserPlus, LinkIcon } from "lucide-react";

const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

const qrFormSchema = z.object({
  baseInviteUrl: z.string().url("Must be a valid base URL (e.g., https://yourapp.com/invite-signup).").default("https://kjvsentinel.example.com/invited-signup"),
  invitedUserEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  assignedRole: z.enum(["User", "Editor (Conceptual)", "Admin (Conceptual)"]).default("User"),
  definedPrivileges: z.string().optional().describe("Comma-separated conceptual privileges, e.g., view_reports,edit_settings"),
  
  size: z.number().min(50).max(1000).default(256),
  level: z.enum(["L", "M", "Q", "H"]).default("M"),
  bgColor: z.string().regex(hexColorRegex, "Invalid HEX color (e.g., #RRGGBB or #RGB).").default("#FFFFFF"),
  fgColor: z.string().regex(hexColorRegex, "Invalid HEX color (e.g., #RRGGBB or #RGB).").default("#000000"),
  includeMargin: z.boolean().default(true),
  marginSize: z.number().min(0).max(50).optional(),
  
  enableImageOverlay: z.boolean().default(false),
  imageSrc: z.string().url("Must be a valid URL for the image source.").optional().or(z.literal('')),
  imageWidth: z.number().min(10).max(200).optional(),
  imageHeight: z.number().min(10).max(200).optional(),
  imageExcavate: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.enableImageOverlay) {
    if (!data.imageSrc) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image URL required.", path: ["imageSrc"] });
    if (!data.imageWidth) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image width required.", path: ["imageWidth"] });
    if (!data.imageHeight) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image height required.", path: ["imageHeight"] });
  }
  // Ensure marginSize is provided if includeMargin is true and marginSize is not explicitly set to 0
  if (data.includeMargin && typeof data.marginSize !== 'number') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Margin size is required when 'Quiet Zone' is enabled.", path: ["marginSize"] });
  }
});

type QrFormValues = z.infer<typeof qrFormSchema>;

export function QrGeneratorForm() {
  const { toast } = useToast();
  const [generatedQrValue, setGeneratedQrValue] = useState<string>("");
  const [qrDisplayConfig, setQrDisplayConfig] = useState<Partial<QrFormValues> & { value: string } | null>(null);

  const form = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: {
      baseInviteUrl: "https://kjvsentinel.example.com/invited-signup",
      invitedUserEmail: "",
      assignedRole: "User",
      definedPrivileges: "view_content",
      size: 256,
      level: "M",
      bgColor: "#FFFFFF",
      fgColor: "#000000",
      includeMargin: true,
      marginSize: 10,
      enableImageOverlay: false,
      imageSrc: "",
      imageWidth: 40,
      imageHeight: 40,
      imageExcavate: true,
    },
    mode: "onChange",
  });

  const watchAllFields = form.watch(); // Watch all fields for real-time updates

  useEffect(() => {
    const currentValues = form.getValues();
    constructAndSetQrValue(currentValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAllFields]); // Re-run when any form field changes

  const constructAndSetQrValue = (data: QrFormValues) => {
    let url = new URL(data.baseInviteUrl || "https://example.com"); // Default if base empty
    if (data.invitedUserEmail) url.searchParams.append("email", data.invitedUserEmail);
    if (data.assignedRole) url.searchParams.append("role", data.assignedRole);
    if (data.definedPrivileges) url.searchParams.append("privileges", data.definedPrivileges.split(',').map(p=>p.trim()).join(','));
    
    const finalQrValue = url.toString();
    setGeneratedQrValue(finalQrValue);
    setQrDisplayConfig({
        value: finalQrValue,
        size: data.size,
        level: data.level,
        bgColor: data.bgColor,
        fgColor: data.fgColor,
        includeMargin: data.includeMargin,
        marginSize: data.includeMargin ? data.marginSize : 0, // Ensure marginSize is 0 if not included
        enableImageOverlay: data.enableImageOverlay,
        imageSrc: data.imageSrc,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imageExcavate: data.imageExcavate,
    });
  };

  const onSubmit = (data: QrFormValues) => {
    // constructAndSetQrValue is already called by useEffect on field changes
    // This explicit call ensures it's set on manual submit if needed, or for toast
    constructAndSetQrValue(data); 
    toast({
      title: "Invite QR Code Parameters Updated",
      description: "Your invite QR code preview has been updated based on the form.",
    });
  };
  
  const handleDownload = () => {
    const canvas = document.getElementById('qr-canvas-download') as HTMLCanvasElement;
    if (canvas && qrDisplayConfig) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      const emailPart = form.getValues("invitedUserEmail")?.split('@')[0] || "invite";
      downloadLink.download = `kjv_invite_${emailPart}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: "Download Started", description: "Your QR code PNG is downloading." });
    } else {
      toast({ title: "Download Failed", description: "Could not find QR code to download. Please ensure parameters are set.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary"/>Invite Link Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                    <FormField
                    control={form.control}
                    name="baseInviteUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Base Invite URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://yourapp.com/join" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">The URL where invited users will be directed.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="invitedUserEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Invited User&apos;s Email (Optional)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="assignedRole"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assign Role (Conceptual)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="User">User</SelectItem>
                            <SelectItem value="Editor (Conceptual)">Editor (Conceptual)</SelectItem>
                            <SelectItem value="Admin (Conceptual)">Admin (Conceptual)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="definedPrivileges"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Define Privileges (Conceptual)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g., view_reports, edit_glossary (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Comma-separated list of conceptual privileges.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="p-4">
                     <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/>QR Code Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="size" render={({ field }) => ( <FormItem> <FormLabel>Size (px)</FormLabel> <FormControl> <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="level" render={({ field }) => ( <FormItem> <FormLabel>Error Correction</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger> </FormControl> <SelectContent> <SelectItem value="L">Low (L)</SelectItem> <SelectItem value="M">Medium (M)</SelectItem> <SelectItem value="Q">Quartile (Q)</SelectItem> <SelectItem value="H">High (H)</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="fgColor" render={({ field }) => ( <FormItem> <FormLabel>Foreground Color</FormLabel> <FormControl> <Input placeholder="#000000" {...field} /> </FormControl> <FormDescription className="text-xs">HEX</FormDescription> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="bgColor" render={({ field }) => ( <FormItem> <FormLabel>Background Color</FormLabel> <FormControl> <Input placeholder="#FFFFFF" {...field} /> </FormControl> <FormDescription className="text-xs">HEX</FormDescription> <FormMessage /> </FormItem> )}/>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="includeMargin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Quiet Zone (Margin)</FormLabel>
                            <FormDescription className="text-xs">Recommended padding around QR code.</FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {form.watch('includeMargin') && (
                      <FormField
                        control={form.control}
                        name="marginSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Margin Size (px)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="e.g., 10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                 <CardTitle className="text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary"/>Image Overlay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <FormField
                  control={form.control}
                  name="enableImageOverlay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Image Overlay</FormLabel>
                        <FormDescription className="text-xs">Embed an image in the center.</FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch('enableImageOverlay') && (
                  <>
                    <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem> <FormLabel>Image URL</FormLabel> <FormControl> <Input placeholder="https://example.com/logo.png" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="imageWidth" render={({ field }) => ( <FormItem> <FormLabel>Image Width (px)</FormLabel> <FormControl> <Input type="number" {...field}  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /> </FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={form.control} name="imageHeight" render={({ field }) => ( <FormItem> <FormLabel>Image Height (px)</FormLabel> <FormControl> <Input type="number" {...field}  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                    <FormField
                      control={form.control}
                      name="imageExcavate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 pt-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Clear space behind image</FormLabel>
                            <FormDescription className="text-xs">Recommended if image is not transparent.</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
             <Button type="submit" className="w-full" variant="secondary" onClick={() => onSubmit(form.getValues())}>
                <ScanLine className="mr-2 h-4 w-4" /> Update QR Preview (or submit form)
             </Button>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Card className="p-6 sticky top-24">
              <CardTitle className="text-center mb-4 flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-primary"/>Invite QR Preview
              </CardTitle>
              <CardContent className="flex justify-center items-center min-h-[280px] min-w-[280px] bg-muted rounded-md p-4">
                {qrDisplayConfig && qrDisplayConfig.value ? (
                  <QRCodeCanvas
                    id="qr-canvas-download"
                    value={qrDisplayConfig.value}
                    size={qrDisplayConfig.size || 256}
                    bgColor={qrDisplayConfig.bgColor}
                    fgColor={qrDisplayConfig.fgColor}
                    level={qrDisplayConfig.level as "L"|"M"|"Q"|"H"}
                    includeMargin={qrDisplayConfig.includeMargin}
                    marginSize={qrDisplayConfig.includeMargin && typeof qrDisplayConfig.marginSize === 'number' ? qrDisplayConfig.marginSize : 0}
                    imageSettings={
                      qrDisplayConfig.enableImageOverlay && qrDisplayConfig.imageSrc && qrDisplayConfig.imageWidth && qrDisplayConfig.imageHeight
                        ? {
                            src: qrDisplayConfig.imageSrc,
                            width: qrDisplayConfig.imageWidth,
                            height: qrDisplayConfig.imageHeight,
                            excavate: qrDisplayConfig.imageExcavate ?? true,
                            x: undefined, // Let library center it
                            y: undefined, // Let library center it
                          }
                        : undefined
                    }
                  />
                ) : (
                  <p className="text-muted-foreground">Enter details to generate invite QR code.</p>
                )}
              </CardContent>
                 <FormDescription className="text-xs text-center mt-2">
                    Encoded Value: <br/>
                    <span className="break-all font-mono text-muted-foreground opacity-75">
                        {generatedQrValue.length > 100 ? `${generatedQrValue.substring(0,97)}...` : generatedQrValue}
                    </span>
                </FormDescription>
            </Card>
            {qrDisplayConfig && qrDisplayConfig.value && (
              <Button onClick={handleDownload} variant="outline" className="w-full max-w-xs" type="button">
                <Download className="mr-2 h-4 w-4" /> Download as PNG
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

