
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReportDisplay } from "../components/report-display";
import type { AnalysisReport } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchReportFromDatabase } from "../../analyze/actions"; // Adjusted import path
import { CalvinismDeepDiveButton } from "./components/calvinism-deep-dive-button";
import { ReportActions } from "./components/report-actions";


// Metadata can be generated dynamically based on the report
export async function generateMetadata({ params }: { params: { id: string } }) {
  const report = await fetchReportFromDatabase(params.id);
  if (!report) {
    return {
      title: "Report Not Found - KJV Sentinel",
      description: "The requested analysis report could not be found.",
    };
  }
  return {
    title: `${report.title} - KJV Sentinel`,
    description: `Detailed theological analysis for: ${report.title}.`,
  };
}


export default async function ReportPage({ params }: { params: { id: string } }) {
  const report: AnalysisReport | null = await fetchReportFromDatabase(params.id);

  if (!report) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 print:py-0 print:px-0">
      <Card className="w-full shadow-lg print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{report.title}</CardTitle>
              <CardDescription>
                Generated on: {new Date(report.createdAt).toLocaleDateString()} | Type: <span className="capitalize">{report.analysisType.replace(/_/g, " ")}</span>
              </CardDescription>
            </div>
            <ReportActions />
          </div>
        </CardHeader>
        
        <div className="hidden print:block mb-4 p-4">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-sm text-gray-600">Generated on: {new Date(report.createdAt).toLocaleDateString()} | Type: <span className="capitalize">{report.analysisType.replace(/_/g, " ")}</span></p>
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

      {report.calvinismAnalysis && report.calvinismAnalysis.length > 0 && report.originalContent && (
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
            <CalvinismDeepDiveButton reportId={report.id} contentToAnalyze={report.originalContent} />
          </CardContent>
        </Card>
      )}
       <div className="mt-8 print:hidden flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/reports">Back to Reports List</Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/glossary">View Glossary</Link>
          </Button>
        </div>
    </div>
  );
}
