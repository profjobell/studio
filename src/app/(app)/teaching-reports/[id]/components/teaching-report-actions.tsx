
"use client";

import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, Mail, MessageCircle } from 'lucide-react'; // Added MessageCircle
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeachingAnalysisReport } from '@/types';
import { generateTxtOutput } from '../../../analyze-teaching/actions'; 
import { useToast } from "@/hooks/use-toast";

interface TeachingReportActionsProps {
  report: TeachingAnalysisReport;
}

export function TeachingReportActions({ report }: TeachingReportActionsProps) {
  const { toast } = useToast();
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadTxt = async () => {
    if (!report || !report.teaching) {
      toast({ title: "Error", description: "Report data is missing for TXT generation.", variant: "destructive"});
      return;
    }
    try {
      const txtContent = await generateTxtOutput(report);
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = report.teaching ? report.teaching.substring(0,30).replace(/\s+/g, '_') + '_analysis.txt' : 'teaching_analysis.txt';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({title: "TXT Downloaded", description: "Teaching analysis exported as .txt file."});
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate TXT file for teaching analysis.", variant: "destructive"});
      console.error("Error generating TXT for teaching analysis:", error);
    }
  };
  
  const handleShareViaEmailSpecific = () => { // Renamed for clarity
    if (!report || !report.teaching) {
      toast({ title: "Error", description: "Report data is missing for sharing.", variant: "destructive" });
      return;
    }
    if(report.userEmail){
        const subject = `KJV Sentinel Teaching Analysis: ${report.teaching.substring(0,30)}...`;
        const body = `Please find the KJV Sentinel teaching analysis for: "${report.teaching}"\n\nThis report includes:\n- Church History Context\n- Promoters/Demonstrators\n- Church Council Summary\n- Letter of Clarification\n- Biblical Warnings\n\n(Report content would be here or as an attachment - This is a simulation of email body content)\n\nConsider accessing the full interactive report if a link was shared with you.`;
        window.location.href = `mailto:${report.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
        toast({ title: "Email Not Available", description: "User email not provided for this report. Cannot use 'Email to Self' option.", variant: "default" });
    }
  };

  const handleGenericEmailShare = () => {
    if (!report || !report.teaching) {
      toast({ title: "Error", description: "Report data is missing for sharing.", variant: "destructive" });
      return;
    }
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `(Link to report: ${report.id})`;
    const subject = `KJV Sentinel Teaching Analysis: ${report.teaching.substring(0,30)}...`;
    const body = `Check out this KJV Sentinel Teaching Analysis: "${report.teaching.substring(0, 50)}..."\nLink: ${reportUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const handleShareViaWhatsApp = () => {
    if (!report || !report.teaching) {
      toast({ title: "Error", description: "Report data is missing for sharing.", variant: "destructive" });
      return;
    }
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `(Link to report: ${report.id})`;
    const shareText = `Check out this KJV Sentinel Teaching Analysis: "${report.teaching.substring(0, 50)}..."\nLink: ${reportUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    alert(`To share on WhatsApp, copy this link or message:\n${whatsappUrl}\n\nMessage prepared:\n${shareText}`);
    console.log("WhatsApp URL:", whatsappUrl);
  };

  const canShareOrEmail = report.outputFormats.includes('Share') || (report.outputFormats.includes('Email') && !!report.userEmail);

  return (
    <div className="flex flex-wrap gap-2">
      {report.outputFormats.includes('PDF') && (
        <Button variant="outline" size="sm" onClick={() => alert("PDF generation is a placeholder. Consider using the Print to PDF browser feature.")}>
          <Download className="mr-2 h-4 w-4" /> PDF
        </Button>
      )}
      {report.outputFormats.includes('TXT') && (
        <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
          <FileText className="mr-2 h-4 w-4" /> TXT
        </Button>
      )}
       {report.outputFormats.includes('RTF') && (
        <Button variant="outline" size="sm" onClick={() => alert("RTF generation is a placeholder. TXT format is available.")}>
          <Download className="mr-2 h-4 w-4" /> RTF
        </Button>
      )}
      
      {canShareOrEmail && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Share Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {report.outputFormats.includes('Email') && report.userEmail && (
              <DropdownMenuItem onClick={handleShareViaEmailSpecific}>
                <Mail className="mr-2 h-4 w-4" /> Email to Self ({report.userEmail})
              </DropdownMenuItem>
            )}
            {report.outputFormats.includes('Share') && (
              <>
                <DropdownMenuItem onClick={handleGenericEmailShare}>
                  <Mail className="mr-2 h-4 w-4" /> Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Share via WhatsApp
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {report.outputFormats.includes('Print') && (
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      )}
    </div>
  );
}
