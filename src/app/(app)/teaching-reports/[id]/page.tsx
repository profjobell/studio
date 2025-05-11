import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TeachingAnalysisReport } from "@/types";
import { fetchTeachingAnalysisFromDatabase } from "../../analyze-teaching/actions";
import { TeachingReportDisplay } from "./components/teaching-report-display";
import { TeachingReportActions } from "./components/teaching-report-actions";
import { PodcastGenerator } from "./components/podcast-generator"; // Import PodcastGenerator

export async function generateMetadata({ params }: { params: { id: string } }) {
  const report = await fetchTeachingAnalysisFromDatabase(params.id);
  if (!report) {
    return {
      title: "Teaching Analysis Not Found - KJV Sentinel",
      description: "The requested teaching analysis report could not be found.",
    };
  }
  return {
    title: `Analysis: ${report.teaching.substring(0,50)}... - KJV Sentinel`,
    description: `Detailed KJV 1611 based analysis for teaching: ${report.teaching.substring(0,100)}...`,
  };
}

export default async function TeachingReportPage({ params }: { params: { id: string } }) {
  const report: TeachingAnalysisReport | null = await fetchTeachingAnalysisFromDatabase(params.id);

  if (!report) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 print:py-0 print:px-0">
      <Card className="w-full shadow-lg print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">Teaching Analysis Report</CardTitle>
              <CardDescription>
                Analysis for: &quot;{report.teaching.length > 100 ? `${report.teaching.substring(0, 97)}...` : report.teaching}&quot;
                <br />
                Recipient: {report.recipientNameTitle} | Generated: {new Date(report.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <TeachingReportActions report={report} />
          </div>
        </CardHeader>
        
        <div className="hidden print:block mb-4 p-4">
            <h1 className="text-2xl font-bold">Teaching Analysis Report</h1>
            <p className="text-sm text-gray-600">Teaching: &quot;{report.teaching}&quot;</p>
            <p className="text-sm text-gray-600">Recipient: {report.recipientNameTitle} | Generated: {new Date(report.createdAt).toLocaleDateString()}</p>
            <Separator className="my-2"/>
        </div>

        <CardContent className="print:p-0">
          <TeachingReportDisplay report={report} />
        </CardContent>
        <CardFooter className="print:hidden">
          <div className="text-xs text-muted-foreground">
            Report ID: {report.id}
            <br />
            This analysis is a tool to aid discernment. Prayerfully consider it alongside personal study of the KJV 1611 Bible.
          </div>
        </CardFooter>
      </Card>

      {/* Conditionally render PodcastGenerator if analysisResult exists */}
      {report.analysisResult && (
        <PodcastGenerator analysisId={report.id} initialReport={report} />
      )}

       <div className="mt-8 print:hidden flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/teaching-reports">Back to Teaching Analyses List</Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/glossary">View Glossary</Link>
          </Button>
        </div>
    </div>
  );
}
