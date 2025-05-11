import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, FileText, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AnalysisReport } from "@/types"; // Assuming this type is defined

export const metadata = {
  title: "My Reports - KJV Sentinel",
  description: "View and manage your theological analysis reports.",
};

// Placeholder data - replace with actual data fetching from Firestore
const sampleReports: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[] = [
  {
    id: "report-001",
    userId: "user-123",
    title: "Analysis of Sermon on John 3:16, May 2025",
    analysisType: "text",
    status: "completed",
    createdAt: new Date("2025-05-20T10:00:00Z"),
    updatedAt: new Date("2025-05-20T11:30:00Z"),
  },
  {
    id: "report-002",
    userId: "user-123",
    title: "Review of 'The Pilgrim's Progress' Chapter 1 (Audio)",
    fileName: "pilgrims_progress_ch1.mp3",
    analysisType: "file_audio",
    status: "processing",
    createdAt: new Date("2025-05-21T14:00:00Z"),
    updatedAt: new Date("2025-05-21T14:05:00Z"),
  },
  {
    id: "report-003",
    userId: "user-123",
    title: "Doctrinal Statement Evaluation (PDF)",
    fileName: "church_doctrine.pdf",
    analysisType: "file_document",
    status: "failed",
    createdAt: new Date("2025-05-19T09:30:00Z"),
    updatedAt: new Date("2025-05-19T09:35:00Z"),
  },
];

// Placeholder server actions
async function deleteReportAction(reportId: string) {
  "use server";
  console.log(`Attempting to delete report: ${reportId}`);
  // Actual deletion logic here
  // Revalidate path or redirect as needed
}

async function generateInDepthCalvinismReportAction(reportId: string) {
  "use server";
  console.log(`Generating in-depth Calvinism report for: ${reportId}`);
  // Actual generation logic here, potentially calling calvinismDeepDive AI flow
  // Then navigate to the new report or update existing one
}


export default async function ReportsPage() {
  // In a real app, fetch reports for the current user
  const reports = sampleReports; // Using sample data for now

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
        <Button asChild>
          <Link href="/analyze">
            <PlusCircle className="mr-2 h-4 w-4" /> New Analysis
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>
            A list of all your submitted content analyses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <Link href={`/reports/${report.id}`} className="hover:underline text-primary">
                        {report.title}
                      </Link>
                      {report.fileName && (
                        <p className="text-xs text-muted-foreground">{report.fileName}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {report.analysisType.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          report.status === "completed" ? "default" : 
                          report.status === "processing" ? "secondary" : "destructive"
                        }
                        className={
                          report.status === "completed" ? "bg-green-500/80 hover:bg-green-600/80 text-white" :
                          report.status === "processing" ? "bg-yellow-500/80 hover:bg-yellow-600/80 text-black" : ""
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/reports/${report.id}`}>
                              <FileText className="mr-2 h-4 w-4" /> View Report
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onSelect={async () => {
                              // This would ideally call a server action
                              await generateInDepthCalvinismReportAction(report.id);
                              // Potentially show a toast or navigate
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4 text-blue-500" /> In-Depth Calvinism Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <form action={async () => {
                              "use server";
                              await deleteReportAction(report.id);
                            }}
                            className="w-full"
                           >
                            <Button
                              type="submit"
                              variant="ghost"
                              className="w-full justify-start px-2 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="Delete report"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Reports Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven&apos;t submitted any content for analysis.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/analyze">Start New Analysis</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
