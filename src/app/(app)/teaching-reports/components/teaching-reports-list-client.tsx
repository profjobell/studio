'use client';

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, FileText, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeachingAnalysisReport } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteTeachingAnalysisAction } from "../../analyze-teaching/actions"; // Server Actions

interface TeachingReportsListClientProps {
  initialReports: TeachingAnalysisReport[];
}

export function TeachingReportsListClient({ initialReports }: TeachingReportsListClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  
  const handleDeleteReport = (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this teaching analysis? This action cannot be undone.")) return;

    startDeleteTransition(async () => {
      const result = await deleteTeachingAnalysisAction(reportId);
      if (result.success) {
        toast({ title: "Analysis Deleted", description: result.message });
        setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      } else {
        toast({ title: "Delete Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-xl font-semibold">No Teaching Analyses Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You haven&apos;t submitted any teachings for analysis.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/analyze-teaching">Start New Teaching Analysis</Link>
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
            <TableHead>Teaching (Excerpt)</TableHead>
            <TableHead className="hidden md:table-cell">Recipient</TableHead>
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
                <Link href={`/teaching-reports/${report.id}`} className="hover:underline text-primary">
                  {report.teaching.substring(0, 70)}{report.teaching.length > 70 ? '...' : ''}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {report.recipientNameTitle}
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
                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPendingDelete}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/teaching-reports/${report.id}`}>
                        <FileText className="mr-2 h-4 w-4" /> View Report
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                      disabled={isPendingDelete}
                    >
                      {isPendingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                       Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}