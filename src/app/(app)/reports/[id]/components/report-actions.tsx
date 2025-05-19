
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, Share2, Mail, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateContentReportTxtOutput } from "../../actions"; // Server action for TXT
import { useToast } from "@/hooks/use-toast";
import type { AnalysisReport } from "@/types";

interface ReportActionsProps {
  report: AnalysisReport;
}

export function ReportActions({ report }: ReportActionsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadTxt = async () => {
    if (!report || !report.id) {
      toast({ title: "Error", description: "Report ID is missing.", variant: "destructive"});
      return;
    }
    try {
      const txtContent = await generateContentReportTxtOutput(report.id);
      if (txtContent.startsWith("Error:")) {
        toast({ title: "Error Generating TXT", description: txtContent, variant: "destructive"});
        return;
      }
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = report.title ? report.title.substring(0,30).replace(/\s+/g, '_') + '_analysis.txt' : 'analysis_report.txt';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({title: "TXT Downloaded", description: "Report exported as .txt file."});
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate TXT file.", variant: "destructive"});
      console.error("Error generating TXT:", error);
    }
  };

  const handleShareViaEmail = () => {
    if (!report || !report.title) {
      toast({ title: "Error", description: "Report data is missing for sharing.", variant: "destructive" });
      return;
    }
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `View report: ${report.title}`;
    const subject = `KJV Sentinel Analysis: ${report.title}`;
    const summaryText = report.summary ? report.summary.substring(0, 100) + '...' : 'View the full analysis.';
    const body = `Check out this KJV Sentinel analysis report:\nTitle: ${report.title}\nLink: ${reportUrl}\n\nSummary: ${summaryText}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareViaWhatsApp = () => {
    if (!report || !report.title) {
      toast({ title: "Error", description: "Report data is missing for sharing.", variant: "destructive" });
      return;
    }
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `View report: ${report.title}`;
    const whatsappText = `Check out this KJV Sentinel analysis report: ${report.title}\n${reportUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    alert(`To share on WhatsApp, copy this link or message:\n${whatsappUrl}\n\nMessage prepared:\n${whatsappText}`);
    console.log("WhatsApp URL:", whatsappUrl);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Download className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
        <FileText className="mr-2 h-4 w-4" /> TXT
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShareViaEmail}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareViaWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
}
