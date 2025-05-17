// src/app/(app)/learning/report-fallacy-quiz/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ListChecks, ArrowLeft } from "lucide-react";
import type { AnalysisReport } from "@/types";
import { fetchReportsList } from "../../reports/actions"; // Server action
import { format } from 'date-fns';

export const metadata = {
  title: "Select Report for Fallacy Quiz - KJV Sentinel",
  description: "Choose an analysis report to generate a personalized fallacy quiz.",
};

export default async function SelectReportForFallacyQuizPage() {
  const reports: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[] = await fetchReportsList();

  const reportsWithFallacies = reports.filter(report => {
    // Temporarily, we can't access the full report.fallacies here as it's omitted.
    // For a real implementation, fetchReportsList would need to return reports that include 'fallacies'
    // or we'd need to fetch each report individually here (less efficient).
    // For now, we'll assume all reports *might* have fallacies and let the quiz page handle it.
    // This is a limitation of not having the full report data in the list.
    // A better approach: modify fetchReportsList or make another call.
    // For this step, we'll just list them. The actual check if fallacies exist happens on the quiz page.
    return true; 
  });


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ListChecks className="mr-3 h-8 w-8 text-primary"/>
            Personalized Fallacy Quiz: Select Report
        </h1>
        <p className="text-muted-foreground">
          Choose one of your previously analyzed reports. A quiz will be generated based on the logical fallacies identified in that specific report.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Analyzed Reports</CardTitle>
          <CardDescription>
            Select a report to start a personalized fallacy quiz. Reports without identified fallacies will not generate a quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsWithFallacies.length > 0 ? (
            <ul className="space-y-3">
              {reportsWithFallacies.map((report) => (
                <li key={report.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-muted rounded-md border">
                  <div>
                    <h3 className="font-semibold text-lg text-primary">{report.title}</h3>
                    {report.fileName && <p className="text-xs text-muted-foreground italic mt-1">{report.fileName}</p>}
                    <p className="text-sm text-muted-foreground">
                      Analyzed on: {format(new Date(report.createdAt), 'PPP')}
                    </p>
                     {/* Placeholder for fallacy count - needs full report data */}
                    {/* <p className="text-xs text-muted-foreground">Fallacies detected: {report.fallacies?.length || 0}</p> */}
                  </div>
                  <Button asChild className="mt-2 sm:mt-0">
                    <Link href={`/learning/report-fallacy-quiz/${report.id}`}>
                      Quiz on this Report
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Reports Available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You need to analyze some content first. Reports with identified fallacies will appear here.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/analyze">Analyze New Content</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/learning">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
