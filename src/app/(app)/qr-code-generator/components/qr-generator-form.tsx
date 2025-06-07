
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Image as ImageIcon, Palette, ScanLine } from "lucide-react";

const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

const qrFormSchema = z.object({
  value: z.string().min(1, "Content to encode cannot be empty.").max(500, "Content is too long for a standard QR code."),
  size: z.number().min(50, "Size must be at least 50px.").max(1000, "Size cannot exceed 1000px.").default(256),
  level: z.enum(["L", "M", "Q", "H"]).default("M"),
  bgColor: z.string().regex(hexColorRegex, "Invalid HEX color (e.g., #RRGGBB or #RGB).").default("#FFFFFF"),
  fgColor: z.string().regex(hexColorRegex, "Invalid HEX color (e.g., #RRGGBB or #RGB).").default("#000000"),
  includeMargin: z.boolean().default(true),
  marginSize: z.number().min(0).max(50).optional(), // Corresponds to quietZone in qrcode.react if includeMargin is true
  
  // Image Overlay Fields
  enableImageOverlay: z.boolean().default(false),
  imageSrc: z.string().url("Must be a valid URL for the image source.").optional().or(z.literal('')),
  imageWidth: z.number().min(10).max(200).optional(),
  imageHeight: z.number().min(10).max(200).optional(),
  imageExcavate: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.enableImageOverlay) {
    if (!data.imageSrc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image URL is required when overlay is enabled.",
        path: ["imageSrc"],
      });
    }
    if (!data.imageWidth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image width is required for overlay.",
        path: ["imageWidth"],
      });
    }
    if (!data.imageHeight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image height is required for overlay.",
        path: ["imageHeight"],
      });
    }
  }
});

type QrFormValues = z.infer<typeof qrFormSchema>;

export function QrGeneratorForm() {
  const { toast } = useToast();
  const [qrConfig, setQrConfig] = useState<QrFormValues | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: {
      value: "https://example.com",
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

  const watchEnableImageOverlay = form.watch("enableImageOverlay");

  const onSubmit = (data: QrFormValues) => {
    setQrConfig(data);
    toast({
      title: "QR Code Generated",
      description: "Your QR code has been updated based on your inputs.",
    });
  };
  
  useEffect(() => {
    // Generate QR on initial load with default values
    setQrConfig(form.getValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleDownload = () => {
    const canvas = document.getElementById('qr-canvas-download') as HTMLCanvasElement;
    if (canvas && qrConfig) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream"); // Prompt download
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${qrConfig.value.substring(0,20).replace(/[^a-z0-9]/gi, '_') || 'qrcode'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: "Download Started", description: "Your QR code PNG is downloading." });
    } else {
      toast({ title: "Download Failed", description: "Could not find QR code to download. Please generate one first.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Form Fields */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Text or URL)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter text or URL to encode..." {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size (px)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Error Correction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fgColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foreground Color</FormLabel>
                    <FormControl>
                      <Input placeholder="#000000" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">HEX format (e.g. #000000)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bgColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Color</FormLabel>
                    <FormControl>
                      <Input placeholder="#FFFFFF" {...field} />
                    </FormControl>
                     <FormDescription className="text-xs">HEX format (e.g. #FFFFFF)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="includeMargin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Include Quiet Zone (Margin)</FormLabel>
                    <FormDescription className="text-xs">
                      Adds padding around the QR code. Recommended.
                    </FormDescription>
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
                      <Input type="number" {...field} 
                       onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                       placeholder="e.g., 10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Card>
              <CardHeader className="p-4">
                <FormField
                  control={form.control}
                  name="enableImageOverlay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <FormLabel className="flex items-center gap-2 text-base"><ImageIcon className="h-5 w-5 text-primary"/>Image Overlay</FormLabel>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardHeader>
              {watchEnableImageOverlay && (
                <CardContent className="space-y-4 p-4 pt-0">
                  <FormField
                    control={form.control}
                    name="imageSrc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Width (px)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field}  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Height (px)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field}  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                      control={form.control}
                      name="imageExcavate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Clear space behind image (Excavate)</FormLabel>
                             <FormDescription className="text-xs">Recommended if image is not transparent.</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                </CardContent>
              )}
            </Card>
             <Button type="submit" className="w-full">
                <ScanLine className="mr-2 h-4 w-4" /> Generate / Update QR Code
             </Button>
          </div>

          {/* Right Column: QR Code Preview */}
          <div className="flex flex-col items-center space-y-4">
            <Card className="p-6 sticky top-24">
              <CardTitle className="text-center mb-4">Preview</CardTitle>
              <CardContent className="flex justify-center items-center min-h-[280px] min-w-[280px] bg-muted rounded-md p-4">
                {qrConfig && qrConfig.value ? (
                  <QRCodeCanvas
                    id="qr-canvas-download" // ID for download functionality
                    value={qrConfig.value}
                    size={qrConfig.size}
                    bgColor={qrConfig.bgColor}
                    fgColor={qrConfig.fgColor}
                    level={qrConfig.level}
                    includeMargin={qrConfig.includeMargin}
                    marginSize={qrConfig.includeMargin ? qrConfig.marginSize : undefined}
                    imageSettings={
                      qrConfig.enableImageOverlay && qrConfig.imageSrc && qrConfig.imageWidth && qrConfig.imageHeight
                        ? {
                            src: qrConfig.imageSrc,
                            width: qrConfig.imageWidth,
                            height: qrConfig.imageHeight,
                            excavate: qrConfig.imageExcavate,
                            x: undefined, // Centered
                            y: undefined, // Centered
                          }
                        : undefined
                    }
                  />
                ) : (
                  <p className="text-muted-foreground">Enter content to generate QR code.</p>
                )}
              </CardContent>
            </Card>
            {qrConfig && qrConfig.value && (
              <Button onClick={handleDownload} variant="outline" className="w-full max-w-xs">
                <Download className="mr-2 h-4 w-4" /> Download as PNG
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
