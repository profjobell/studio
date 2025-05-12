"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, FileText, Loader2, Brain, ScrollText, MessageSquareWarning, Users, ClipboardList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AnalysisReport } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteReportAction, generateInDepthCalvinismReportAction } from "../actions"; // Server Actions
import { slugify } from "@/lib/utils";

interface ReportsListClientProps {
  initialReports: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[];
}

const reportSectionLinks = [
  { label: "Identified Isms", slug: "identified-isms", icon: ClipboardList },
  { label: "Logical Fallacies", slug: "logical-fallacies", icon: MessageSquareWarning },
  { label: "Manipulative Tactics", slug: "manipulative-tactics", icon: Users },
  { label: "Scriptural Analysis", slug: "scriptural-analysis", icon: ScrollText },
];

export function ReportsListClient({ initialReports }: ReportsListClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingDeepDive, startDeepDiveTransition] = useTransition();
  const { toast } = useToast();
  
  const [showDeepDiveDialog, setShowDeepDiveDialog] = useState(false);
  const [deepDiveContent, setDeepDiveContent] = useState<string | null>(null);
  const [currentReportTitleForDialog, setCurrentReportTitleForDialog] = useState("");


  const handleDeleteReport = (reportId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteReportAction(reportId);
      if (result.success) {
        toast({ title: "Report Deleted", description: result.message });
        setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      } else {
        toast({ title: "Delete Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleGenerateDeepDive = (reportId: string, reportTitle: string) => {
    setCurrentReportTitleForDialog(reportTitle);
    setDeepDiveContent(null); // Reset previous content
    setShowDeepDiveDialog(true); // Show dialog immediately with loading state

    startDeepDiveTransition(async () => {
      const result = await generateInDepthCalvinismReportAction(reportId);
      if (result.success && result.analysis) {
        setDeepDiveContent(result.analysis);
        toast({ title: "Deep Dive Generated", description: result.message });
      } else {
        setDeepDiveContent(`Failed to generate report: ${result.message}`);
        toast({ title: "Deep Dive Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  if (reports.length === 0) {
    return (
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
    );
  }

  return (
    <>
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
                {report.analysisType.replace(/_/g, " ")}
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
                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPendingDelete || isPendingDeepDive}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/reports/${report.id}`}>
                        <FileText className="mr-2 h-4 w-4" /> View Full Report
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Go to Section</DropdownMenuLabel>
                    {reportSectionLinks.map(section => (
                      <DropdownMenuItem key={section.slug} asChild>
                        <Link href={`/reports/${report.id}#${section.slug}`}>
                          <section.icon className="mr-2 h-4 w-4" /> {section.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                     <DropdownMenuSeparator />
                    {report.originalContent && ( 
                       <DropdownMenuItem
                        onSelect={() => handleGenerateDeepDive(report.id, report.title)}
                        disabled={isPendingDeepDive}
                      >
                        {isPendingDeepDive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4 text-primary" />}
                         In-Depth Calvinism
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                      disabled={isPendingDelete}
                    >
                      {isPendingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                       Delete Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showDeepDiveDialog} onOpenChange={setShowDeepDiveDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>In-Depth Calvinism Analysis: {currentReportTitleForDialog}</AlertDialogTitle>
            <AlertDialogDescription>
              Below is the detailed analysis of Calvinistic elements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4 px-1">
            {isPendingDeepDive && !deepDiveContent && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating report...</p>
                </div>
            )}
            {deepDiveContent && (
              <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {deepDiveContent}
              </article>
            )}
            {!isPendingDeepDive && !deepDiveContent && (
                 <p className="text-muted-foreground text-center py-10">Report content will appear here.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeepDiveContent(null)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
