import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import type { TeachingAnalysisReport } from "@/types";
import { fetchTeachingAnalysesListFromDatabase } from "../analyze-teaching/actions";
import { TeachingReportsListClient } from "./components/teaching-reports-list-client";

export const metadata = {
  title: "My Teaching Analyses - KJV Sentinel",
  description: "View and manage your KJV 1611 based teaching analysis reports.",
};

export default async function TeachingReportsListPage() {
  const reports: TeachingAnalysisReport[] = await fetchTeachingAnalysesListFromDatabase();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Teaching Analyses</h1>
        <Button asChild>
          <Link href="/analyze-teaching">
            <PlusCircle className="mr-2 h-4 w-4" /> New Teaching Analysis
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teaching Analysis History</CardTitle>
          <CardDescription>
            A list of all your submitted teachings and their analyses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeachingReportsListClient initialReports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}