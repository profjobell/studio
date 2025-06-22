
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension } from "qr-code-styling";
import { ScanLine, Download, Palette, Settings, Image as ImageIcon, UploadCloud, Trash2, Info } from "lucide-react";
import { siteConfig } from "@/config/site";
import { slugify } from "@/lib/utils";

const qrGeneratorFormSchema = z.object({
  qrInput: z.string().min(1, "QR code value cannot be empty."),
  assignedRole: z.enum(["user", "editor", "admin", "viewer", "contributor"]).default("user"),
  size: z.number().min(50).max(2000).default(256),
  marginSize: z.number().min(0).max(50).default(2),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).default("M"),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").default("#ffffff"),
  foregroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").default("#000000"),
  includeImage: z.boolean().default(false),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  imageWidth: z.number().min(10).max(500).optional(),
  imageHeight: z.number().min(10).max(500).optional(),
  imageMargin: z.number().min(0).max(20).optional(),
  removeImageBackground: z.boolean().default(true),
});

type QrGeneratorFormData = z.infer<typeof qrGeneratorFormSchema>;

const defaultQrOptions: QRCodeStylingOptions = {
  width: 256,
  height: 256,
  type: "svg",
  data: siteConfig.url, // Default data
  image: "", // Default no image
  margin: 2,
  qrOptions: {
    typeNumber: 0,
    mode: "Byte",
    errorCorrectionLevel: "M",
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 0,
    crossOrigin: "anonymous",
  },
  dotsOptions: {
    color: "#000000", // Default KJV Sentinel primary text color (black)
    type: "rounded",
  },
  backgroundOptions: {
    color: "#ffffff", // Default KJV Sentinel background (white)
  },
  cornersSquareOptions: {
    color: "#000000",
    type: "extra-rounded",
  },
  cornersDotOptions: {
    color: "#000000",
    type: "dot",
  },
};


export function QrGeneratorForm() {
  const { toast } = useToast();
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<QrGeneratorFormData>({
    resolver: zodResolver(qrGeneratorFormSchema),
    defaultValues: {
      qrInput: siteConfig.url,
      assignedRole: "user",
      size: 256,
      marginSize: 2,
      errorCorrectionLevel: "M",
      backgroundColor: "#ffffff",
      foregroundColor: "#000000",
      includeImage: false,
      imageUrl: "",
      imageWidth: 100,
      imageHeight: 100,
      imageMargin: 2,
      removeImageBackground: true,
    },
    mode: "onChange" 
  });
  
  const constructAndSetQrValue = (values: QrGeneratorFormData) => {
    let dataToEncode = values.qrInput;
    if (values.qrInput.startsWith(siteConfig.url) || values.qrInput.startsWith(window.location.origin)) {
      try {
        const url = new URL(values.qrInput);
        url.searchParams.set("role", values.assignedRole);
        dataToEncode = url.toString();
      } catch (e) {
        console.warn("Could not parse QR input as URL to add role:", e);
      }
    }
    
    if (qrCodeInstance) {
      const imageToUse = values.includeImage ? (uploadedImage || values.imageUrl || "") : "";
      qrCodeInstance.update({
        width: values.size,
        height: values.size,
        data: dataToEncode,
        margin: values.marginSize,
        qrOptions: { errorCorrectionLevel: values.errorCorrectionLevel },
        dotsOptions: { color: values.foregroundColor },
        backgroundOptions: { color: values.backgroundColor },
        image: imageToUse,
        imageOptions: {
          imageSize: 0.4, // Example, adjust as needed
          margin: values.imageMargin || 0,
          hideBackgroundDots: values.removeImageBackground,
          crossOrigin: "anonymous",
        }
      });
       qrCodeInstance.getRawData("svg").then(blob => {
        if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrDataUrl(reader.result as string);
            };
            reader.readAsDataURL(blob);
        }
      });
    }
  };
  
  useEffect(() => {
    if (!qrRef.current) return;
    const qrInstance = new QRCodeStyling({
        ...defaultQrOptions,
        data: form.getValues("qrInput"), // Use initial form value
    });
    qrInstance.append(qrRef.current);
    setQrCodeInstance(qrInstance);

     qrInstance.getRawData("svg").then(blob => {
        if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrDataUrl(reader.result as string);
            };
            reader.readAsDataURL(blob);
        }
      });

    return () => {
        if (qrRef.current) {
            qrRef.current.innerHTML = "";
        }
        setQrCodeInstance(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initial QR code generation on mount with default values
    constructAndSetQrValue(form.getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  async function onSubmit(values: QrGeneratorFormData) {
    console.log("Form submitted with values:", values);
    constructAndSetQrValue(values);
    toast({
      title: "QR Code Updated",
      description: "The QR code preview has been updated with your settings.",
    });
  }

  const handleDownload = (extension: FileExtension) => {
    if (qrCodeInstance) {
      qrCodeInstance.download({ name: `${slugify(form.getValues("qrInput").substring(0,20)) || "kjv-sentinel-qr"}-${Date.now()}`, extension });
    } else {
      toast({ title: "Error", description: "QR Code instance not available for download.", variant: "destructive"});
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        form.setValue("imageUrl", reader.result as string, { shouldValidate: true, shouldDirty: true }); 
        toast({ title: "Image Uploaded", description: "Image selected for QR code center." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    form.setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true }); 
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: "Image Removed", description: "Image cleared from QR code center." });
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic QR Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                key="qrInputField"
                control={form.control}
                name="qrInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code Value / Text Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the text or URL for the QR code"
                        className="resize-y min-h-[100px]"
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      This is the main content that will be encoded into the QR code.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                key="assignedRoleField"
                control={form.control}
                name="assignedRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Role (for App Invites)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This role will be embedded in the QR code if it&apos;s for an app invite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="button" variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full text-sm">
            <Settings className="mr-2 h-4 w-4" /> {showAdvanced ? "Hide" : "Show"} Advanced Styling Options
          </Button>

          {showAdvanced && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Styling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    key="sizeField"
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (pixels)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    key="marginSizeField"
                    control={form.control}
                    name="marginSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margin (pixels)</FormLabel>
                        <FormControl>
                           <Input 
                            type="number" 
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  key="errorCorrectionLevelField"
                  control={form.control}
                  name="errorCorrectionLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Error Correction Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select error correction level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="L">Low (L)</SelectItem>
                          <SelectItem value="M">Medium (M)</SelectItem>
                          <SelectItem value="Q">Quartile (Q)</SelectItem>
                          <SelectItem value="H">High (H)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <FormField
                        key="backgroundColorField"
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor="backgroundColorInput">Background Color</FormLabel>
                            <div className="flex items-center gap-2">
                            <Input id="backgroundColorInput" type="text" {...field} placeholder="#FFFFFF" className="flex-grow"/>
                            <Input type="color" value={field.value} onChange={field.onChange} className="p-0 h-10 w-12 cursor-pointer" />
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        key="foregroundColorField"
                        control={form.control}
                        name="foregroundColor"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor="foregroundColorInput">Foreground Color (Dots)</FormLabel>
                             <div className="flex items-center gap-2">
                            <Input id="foregroundColorInput" type="text" {...field} placeholder="#000000" className="flex-grow"/>
                            <Input type="color" value={field.value} onChange={field.onChange} className="p-0 h-10 w-12 cursor-pointer"/>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                  key="includeImageField"
                  control={form.control}
                  name="includeImage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                      <div className="space-y-0.5">
                        <FormLabel>Embed Image in Center</FormLabel>
                        <FormDescription>
                          Add a small logo or image to the center of the QR code.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("includeImage") && (
                  <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                    <FormField
                      key="imageUrlField"
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (or Upload)</FormLabel>
                           <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://example.com/logo.png" 
                              value={field.value || ""}
                              disabled={!!uploadedImage}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Label htmlFor="imageUploadButton" className="shrink-0 text-sm font-medium">
                            Upload Image:
                        </Label>
                        <Input 
                            id="imageUploadButton"
                            type="file" 
                            accept="image/png, image/jpeg, image/svg+xml" 
                            onChange={handleImageUpload} 
                            className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-muted file:text-foreground hover:file:bg-primary/10 flex-grow"
                            ref={fileInputRef}
                        />
                        {uploadedImage && (
                            <Button variant="ghost" size="icon" onClick={handleRemoveImage} title="Remove uploaded image">
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        )}
                    </div>
                    {uploadedImage && (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Preview of uploaded image:</p>
                            <img src={uploadedImage} alt="Uploaded preview" className="max-w-[100px] max-h-[100px] border rounded-md mt-1 bg-white" data-ai-hint="uploaded image logo" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <FormField
                        key="imageWidthField"
                        control={form.control}
                        name="imageWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Img Width</FormLabel>
                            <FormControl>
                               <Input 
                                type="number" 
                                {...field}
                                value={field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        key="imageHeightField"
                        control={form.control}
                        name="imageHeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Img Height</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        key="imageMarginField"
                        control={form.control}
                        name="imageMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Img Margin</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      key="removeImageBackgroundField"
                      control={form.control}
                      name="removeImageBackground"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                           <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                           </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Remove background around image dots
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" variant="secondary">
            <ScanLine className="mr-2 h-4 w-4" /> Submit and Update QR
          </Button>
        </form>
      </Form>

      <div className="md:col-span-1 space-y-6 sticky top-20 self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ScanLine className="mr-2 h-5 w-5 text-primary" /> QR Code Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4 min-h-[280px]">
            {qrDataUrl ? (
                 <img src={qrDataUrl} alt="Generated QR Code" className="max-w-full h-auto rounded-md border bg-background shadow-md" data-ai-hint="qr code" />
             ) : (
                <div ref={qrRef} className="bg-white p-2 border rounded-md shadow-md" aria-label="QR Code Preview Area"></div>
             )
            }
            {!qrCodeInstance && <p className="mt-2 text-sm text-muted-foreground">Initializing QR Code...</p>}
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <div className="flex w-full gap-2">
              <Button onClick={() => handleDownload("svg")} className="flex-1" variant="outline" disabled={!qrCodeInstance}>
                <Download className="mr-2 h-4 w-4" /> SVG
              </Button>
              <Button onClick={() => handleDownload("png")} className="flex-1" variant="outline" disabled={!qrCodeInstance}>
                <Download className="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button onClick={() => handleDownload("jpeg")} className="flex-1" variant="outline" disabled={!qrCodeInstance}>
                <Download className="mr-2 h-4 w-4" /> JPEG
              </Button>
            </div>
          </CardFooter>
        </Card>
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" /> Usage Tips
                </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
                <p><strong>QR Value:</strong> This is the data your QR code will contain (e.g., a URL, text, contact info).</p>
                <p><strong>Role Embedding:</strong> If using for app invites, the 'Assigned Role' will be added as a URL parameter to the QR value if it&apos;s a valid URL.</p>
                <p><strong>Styling:</strong> Adjust size, colors, and error correction. Higher error correction allows the QR to be read even if partially obscured, but makes dots smaller.</p>
                <p><strong>Embedded Image:</strong> Use a clear, simple image for best results. Test readability after embedding.</p>
                <p><strong>Download:</strong> SVG is recommended for scalability. PNG/JPEG are good for web use.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
