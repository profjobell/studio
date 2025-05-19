
'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, Mail } from 'lucide-react';
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
    try {
      const txtContent = await generateTxtOutput(report);
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${report.teaching.substring(0,30).replace(/\s+/g, '_')}_analysis.txt`;
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
  
  const handleEmailShare = () => {
    if(report.userEmail){
        const subject = `KJV Sentinel Teaching Analysis: ${report.teaching.substring(0,30)}...`;
        const body = `Please find the KJV Sentinel teaching analysis for: "${report.teaching}"\n\nThis report includes:\n- Church History Context\n- Promoters/Demonstrators\n- Church Council Summary\n- Letter of Clarification\n- Biblical Warnings\n\n(Report content would be here or as an attachment - This is a simulation of email body content)\n\nConsider accessing the full interactive report if a link was shared with you.`;
        window.location.href = `mailto:${report.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
        toast({ title: "Email Not Available", description: "User email not provided for this report.", variant: "default" });
    }
  };

  const handleGenericShare = () => {
    const reportUrl = typeof window !== 'undefined' ? window.location.href : `(Link to report: ${report.id})`;
    const shareText = `Check out this KJV Sentinel Teaching Analysis: "${report.teaching.substring(0, 50)}..."\nLink: ${reportUrl}`;
    
    // Option 1: Copy to clipboard (if navigator.clipboard is available)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => toast({ title: "Copied to Clipboard", description: "Report title and link copied." }))
        .catch(err => toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" }));
    }
    
    // Option 2: Alert with WhatsApp guidance
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    alert(`Share this teaching analysis:\n\nTitle: ${report.teaching.substring(0,50)}...\nLink: ${reportUrl}\n\nTo share on WhatsApp, you can use this link (will open WhatsApp if installed):\n${whatsappUrl}\n\n(You might need to copy the text above manually if direct sharing isn't configured on your device)`);
    console.log("WhatsApp URL:", whatsappUrl);
  };


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
      {report.outputFormats.includes('Email') && (
        <Button variant="outline" size="sm" onClick={handleEmailShare} disabled={!report.userEmail}>
          <Mail className="mr-2 h-4 w-4" /> Email to Self
        </Button>
      )}
      {report.outputFormats.includes('Share') && (
         <Button variant="outline" size="sm" onClick={handleGenericShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      )}
      {report.outputFormats.includes('Print') && (
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      )}
    </div>
  );
}
