// src/app/(app)/learning/report-fallacy-quiz/[reportId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchReportFromDatabase } from "../../../analyze/actions"; // Fetch full report
import type { AnalysisReport } from "@/types";
import { ReportFallacyQuizClient } from "./components/report-fallacy-quiz-client";
import { ArrowLeft, ListChecks } from "lucide-react";

export async function generateMetadata({ params }: { params: { reportId: string } }) {
  const report = await fetchReportFromDatabase(params.reportId);
  if (!report) {
    return {
      title: "Report Not Found - KJV Sentinel",
    };
  }
  return {
    title: `Fallacy Quiz: ${report.title} - KJV Sentinel`,
    description: `Personalized fallacy quiz based on the report: ${report.title}.`,
  };
}

export default async function PersonalizedFallacyQuizPage({ params }: { params: { reportId: string } }) {
  const report: AnalysisReport | null = await fetchReportFromDatabase(params.reportId);

  if (!report) {
    notFound();
  }

  const uniqueFallacyTypes = report.fallacies && report.fallacies.length > 0 
    ? Array.from(new Set(report.fallacies.map(f => f.type))) 
    : [];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl md:text-3xl">Personalized Fallacy Quiz</CardTitle>
          </div>
          <CardDescription>
            This quiz is based on logical fallacies identified in your report: <span className="font-semibold text-foreground">{report.title}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueFallacyTypes.length > 0 ? (
            <ReportFallacyQuizClient reportId={report.id} uniqueFallacyTypes={uniqueFallacyTypes} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No specific fallacies were identified in this report to generate a personalized quiz.</p>
              <Button variant="outline" asChild>
                <Link href="/learning/report-fallacy-quiz">Choose Another Report</Link>
              </Button>
              <span className="mx-2">or</span>
              <Button asChild>
                <Link href="/learning/fallacy-quiz">Try General Fallacy Quiz</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/learning/report-fallacy-quiz">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Report Selection
          </Link>
        </Button>
      </div>
    </div>
  );
}
