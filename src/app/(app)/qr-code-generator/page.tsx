
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrGeneratorForm } from "./components/qr-generator-form";
import { QrCode, UserPlus } from "lucide-react"; // Added UserPlus

export const metadata = {
  title: "App Invite QR Code Generator - KJV Sentinel",
  description: "Generate custom QR codes to invite users to this application with defined roles and privileges (conceptual).",
};

export default function AppInviteQrCodeGeneratorPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <UserPlus className="mr-3 h-8 w-8 text-primary" />
          App Invite QR Code Generator
        </h1>
        <p className="text-muted-foreground">
          Create custom QR codes to conceptually invite users to KJV Sentinel, pre-defining their roles and privileges.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Generate Invite QR Code</CardTitle>
          <CardDescription>
            Fill in the details below to create an invite QR code. The generated QR code will encode a URL with invite parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrGeneratorForm />
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Invite QR Code Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Base Invite URL:</strong> This should be a URL on your application that can handle invite parameters (e.g., a special sign-up page). For this demo, it's conceptual.</p>
          <p><strong>Roles & Privileges:</strong> These are conceptual and for demonstration. A real app would need a backend to securely process these.</p>
          <p><strong>Density:</strong> Adding more data (long emails, many privileges) will make the QR code denser and potentially harder to scan.</p>
          <p><strong>Testing:</strong> Always test your generated QR code. The app currently does not process these invite links; this tool is for generating the QR code itself.</p>
        </CardContent>
      </Card>
    </div>
  );
}
