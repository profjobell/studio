
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, Share2, Mail, MessageCircle } from "lucide-react"; // Added Mail, MessageCircle
import { generateContentReportTxtOutput } from "../../actions"; // Server action for TXT
import { useToast } from "@/hooks/use-toast";
import type { AnalysisReport } from "@/types";

interface ReportActionsProps {
  report: AnalysisReport; // Pass the full report for context
}

export function ReportActions({ report }: ReportActionsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadTxt = async () => {
    try {
      const txtContent = await generateContentReportTxtOutput(report.id);
      if (txtContent.startsWith("Error:")) {
        toast({ title: "Error Generating TXT", description: txtContent, variant: "destructive"});
        return;
      }
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${report.title.substring(0,30).replace(/\s+/g, '_')}_analysis.txt`;
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

  const handleShare = () => {
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `View report: ${report.title}`;
    const subject = `KJV Sentinel Analysis: ${report.title}`;
    const body = `Check out this KJV Sentinel analysis report:\nTitle: ${report.title}\nLink: ${reportUrl}\n\nSummary: ${report.summary.substring(0, 100)}...`;
    
    // Simple options, could be expanded with a Popover or small Dialog for more choices
    if (confirm("Share via Email? (Opens your default email client)")) {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (confirm("Share via WhatsApp? (Prepares a message for you to send)")) {
      const whatsappText = `Check out this KJV Sentinel analysis report: ${report.title}\n${reportUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      // For actual app, might open in new tab: window.open(whatsappUrl, '_blank');
      // For now, alert and log
      alert(`To share on WhatsApp, copy this link or message:\n${whatsappUrl}\n\nMessage prepared:\n${whatsappText}`);
      console.log("WhatsApp URL:", whatsappUrl);
    }
  };


  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => alert("PDF generation for this report type is a placeholder. For Teaching Reports, a server-side PDF might be an option.")}>
        <Download className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
        <FileText className="mr-2 h-4 w-4" /> TXT
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" /> Share
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
}
