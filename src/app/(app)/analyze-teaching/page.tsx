import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyzeTeachingForm } from "./components/analyze-teaching-form";

export const metadata = {
  title: "Analyze Teaching - KJV Sentinel",
  description: "Submit a teaching, philosophy, or saying for analysis against the KJV 1611 Bible.",
};

export default function AnalyzeTeachingPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analyze Teaching</h1>
        <p className="text-muted-foreground">
          Submit a teaching for analysis including historical context, promoter details, council summaries, a KJV 1611-based letter of caution, and biblical warnings.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New Teaching Analysis</CardTitle>
          <CardDescription>
            Fill out the form below to submit a teaching for detailed analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyzeTeachingForm />
        </CardContent>
      </Card>
      
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Process:</strong> Your submitted teaching will be analyzed by our AI, focusing on KJV 1611 alignment.</p>
          <p><strong>Output Sections:</strong> The report will include:
            <ul className="list-disc list-inside pl-4">
                <li>Church History Context</li>
                <li>Promoters and Demonstrators</li>
                <li>Church Council Summary (if applicable)</li>
                <li>A Letter of Clarification/Caution (tailored to your specified recipient and tone)</li>
                <li>Biblical Warnings Regarding False Teachers</li>
            </ul>
          </p>
          <p><strong>Output Formats:</strong> You can select various output formats like PDF, TXT, etc. Email and Share options require your email address.</p>
          <p><strong>Note:</strong> Complex analyses may take some time. You will be redirected to the report upon completion.</p>
        </CardContent>
      </Card>
    </div>
  );
}