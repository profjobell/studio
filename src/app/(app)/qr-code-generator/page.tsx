
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrGeneratorForm } from "./components/qr-generator-form";
import { QrCode } from "lucide-react";

export const metadata = {
  title: "QR Code Generator - KJV Sentinel",
  description: "Generate custom QR codes with various options.",
};

export default function QrCodeGeneratorPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <QrCode className="mr-3 h-8 w-8 text-primary" />
          QR Code Generator
        </h1>
        <p className="text-muted-foreground">
          Create and customize QR codes for your text, URLs, or other data.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Generate Your QR Code</CardTitle>
          <CardDescription>
            Fill in the details below to create your custom QR code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrGeneratorForm />
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>QR Code Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Content:</strong> Keep the encoded text or URL concise for better scannability.</p>
          <p><strong>Size:</strong> Ensure the QR code is large enough to be easily scanned by most devices.</p>
          <p><strong>Error Correction:</strong> Higher levels (Q, H) allow the QR code to be scanned even if partially damaged, but increase density.</p>
          <p><strong>Colors:</strong> Ensure high contrast between foreground and background colors for reliability.</p>
          <p><strong>Image Overlay:</strong> If using an image, keep it small and centered. Ensure `excavate` is true if the image covers critical QR data areas.</p>
          <p><strong>Testing:</strong> Always test your generated QR code with multiple scanner apps and devices.</p>
        </CardContent>
      </Card>
    </div>
  );
}
