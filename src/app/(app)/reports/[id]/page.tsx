import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Share2, Printer, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { ReportDisplay } from "../components/report-display";
import type { AnalysisReport, AnalyzeContentOutput } from "@/types"; // Assuming types are defined
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Analysis Report - KJV Sentinel", // Will be dynamic later
  description: "Detailed theological analysis report.",
};

// Placeholder function to fetch report data by ID
// In a real app, this would fetch from Firestore using the report ID
async function getReportData(id: string): Promise<AnalysisReport | null> {
  console.log(`Fetching report data for ID: ${id}`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Sample report data (merge of AnalysisReport and AnalyzeContentOutput structure)
  const sampleReportData: AnalyzeContentOutput = {
    summary: "This is a brief summary of the analyzed content. It highlights key findings and overall theological alignment with KJV 1611. The content shows tendencies towards [Ism Example] and some elements of Calvinistic thought, particularly regarding [Calvinism Example].",
    scripturalAnalysis: [
      { verse: "John 3:16", analysis: "The submitted text interprets this verse in a way that aligns with universal atonement, consistent with KJV 1611." },
      { verse: "Ephesians 1:4-5", analysis: "The content's explanation of predestination here shows some Calvinistic leanings, potentially misinterpreting the scope of 'adoption'." },
    ],
    historicalContext: "The ideas presented in the content echo debates from the Reformation period, particularly those between Calvinists and Arminians regarding free will and divine sovereignty.",
    etymology: "Key term 'agape' (love): Greek root, signifies unconditional, self-sacrificial love. KJV often translates as 'charity'. Contextual use in submitted text is consistent.",
    exposure: "The content seems to draw from modern evangelical writings, some of which have been influenced by Neo-Calvinism. There's no direct exposure to harmful extremist ideologies detected.",
    fallacies: [
      { type: "Straw Man", description: "Misrepresents an opposing view on salvation to make it easier to critique." },
      { type: "Appeal to Emotion", description: "Uses emotionally charged language to persuade rather than scriptural evidence." },
    ],
    manipulativeTactics: [
      { technique: "Proof-texting", description: "Uses isolated Bible verses out of context to support a preconceived idea." },
      { technique: "Loaded Language", description: "Employs terms with strong emotional connotations to sway the audience." },
    ],
    biblicalRemonstrance: "The KJV 1611 emphasizes God's desire for all to be saved (2 Peter 3:9, 1 Timothy 2:4), which should be considered alongside verses on election. For further study, see Blue Letter Bible (https://www.blueletterbible.org).",
    identifiedIsms: [
      { ism: "Arminianism (Partial)", description: "Emphasizes free will in salvation, conditional election.", evidence: "Statements like 'humans must choose to accept God's offer'.", /* KJV Alignment missing */ },
      { ism: "Dispensationalism (Minor)", description: "Hints at a pre-tribulation rapture view.", evidence: "Reference to 'the Church being taken out before the great suffering'.", /* KJV Alignment missing */ },
    ],
    calvinismAnalysis: [
      { element: "Unconditional Election (Hinted)", description: "Suggests God chose specific individuals for salvation irrespective of their actions.", evidence: "Interpretation of Ephesians 1:4-5.", infiltrationTactic: "Subtle rephrasing of 'foreknowledge' as 'predetermination'.", /* KJV Alignment missing */ },
      { element: "Sovereignty (Emphasized)", description: "Strong focus on God's absolute control over all events, including salvation.", evidence: "Repeated phrases like 'God's sovereign decree'.", /* KJV Alignment missing */ },
    ],
  };
  
  const fullSampleReport: AnalysisReport = {
    id: "report-001",
    userId: "user-123",
    title: "Sample Analysis: Sermon on Divine Sovereignty",
    analysisType: "text",
    status: "completed",
    createdAt: new Date("2025-05-22T10:00:00Z"),
    updatedAt: new Date("2025-05-22T11:30:00Z"),
    ...sampleReportData,
  };

  if (id === "report-001") { // Only return data for a specific sample ID
    return fullSampleReport;
  }
  return null; // Report not found
}


export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await getReportData(params.id);

  if (!report) {
    notFound();
  }

  // TODO: Add state for simple/scholarly toggle

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 print:py-0 print:px-0">
      <Card className="w-full shadow-lg print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{report.title}</CardTitle>
              <CardDescription>
                Generated on: {new Date(report.createdAt).toLocaleDateString()} | Type: <span className="capitalize">{report.analysisType.replace("_", " ")}</span>
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => alert("Download PDF (placeholder)")}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Download TXT (placeholder)")}>
                <FileText className="mr-2 h-4 w-4" /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Share report (placeholder)")}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* For printing purposes, show a simple title */}
        <div className="hidden print:block mb-4 p-4">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-sm text-gray-600">Generated on: {new Date(report.createdAt).toLocaleDateString()} | Type: <span className="capitalize">{report.analysisType.replace("_", " ")}</span></p>
            <Separator className="my-2"/>
        </div>

        <CardContent className="print:p-0">
          <ReportDisplay reportData={report} />
        </CardContent>
        <CardFooter className="print:hidden">
          <div className="text-xs text-muted-foreground">
            Report ID: {report.id}
            <br />
            Please note: This analysis is a tool to aid understanding and should be prayerfully considered alongside personal study of the KJV 1611 Bible.
          </div>
        </CardFooter>
      </Card>

      {report.calvinismAnalysis && report.calvinismAnalysis.length > 0 && (
        <Card className="mt-8 w-full shadow-lg print:hidden">
          <CardHeader>
            <CardTitle>In-Depth Calvinism Analysis</CardTitle>
            <CardDescription>
              Option to generate a more detailed report specifically on Calvinistic influences detected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The initial analysis found elements related to Calvinism. If you would like a more comprehensive breakdown of these elements, their historical context, subtle infiltration tactics, and detailed KJV 1611 alignment, you can request an in-depth report.
            </p>
            <Button onClick={() => alert(`Generate In-Depth Calvinism Report for ${report.id} (placeholder)`)}>
              Request In-Depth Calvinism Report
            </Button>
          </CardContent>
        </Card>
      )}
       <div className="mt-8 print:hidden">
          <Button variant="outline" asChild>
            <Link href="/reports">Back to Reports List</Link>
          </Button>
        </div>
    </div>
  );
}
