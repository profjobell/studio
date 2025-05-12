
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Home } from "lucide-react"; // Added Home icon
import type { AnalysisReport } from "@/types";
import { fetchReportsList } from "./actions"; // Server action
import { ReportsListClient } from "./components/reports-list-client";

export const metadata = {
  title: "My Reports Generated to date - KJV Sentinel", // Changed title
  description: "View and manage your theological analysis reports.",
};

// Server actions (deleteReportAction, generateInDepthCalvinismReportAction) are now in ./actions.ts

export default async function ReportsPage() {
  // Fetch reports list server-side
  const reports: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[] = await fetchReportsList();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Reports Generated to date</h1> {/* Changed title */}
        <div className="flex items-center space-x-2"> {/* Group buttons */}
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/analyze">
              <PlusCircle className="mr-2 h-4 w-4" /> New Analysis
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>
            A list of all your submitted content analyses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsListClient initialReports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}

