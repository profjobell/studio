
'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, Mail } from 'lucide-react';
import type { TeachingAnalysisReport } from '@/types';
import { generateTxtOutput } from '../../../analyze-teaching/actions'; // Action to generate TXT content

interface TeachingReportActionsProps {
  report: TeachingAnalysisReport;
}

export function TeachingReportActions({ report }: TeachingReportActionsProps) {
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadTxt = async () => {
    const txtContent = await generateTxtOutput(report);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.teaching.substring(0,20).replace(/\s+/g, '_')}_analysis.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const shareViaEmail = () => {
    if(report.userEmail){
        const subject = `Teaching Analysis: ${report.teaching.substring(0,30)}...`;
        const body = `Please find the KJV Sentinel teaching analysis attached/below for: "${report.teaching}"\n\nThis report includes:\n- Church History Context\n- Promoters/Demonstrators\n- Church Council Summary\n- Letter of Clarification\n- Biblical Warnings\n\n(Report content would be here or as an attachment - This is a simulation)\n\nAccess the full report (simulated link): /teaching-reports/${report.id}`;
        window.location.href = `mailto:${report.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
        alert("User email not provided for this report. Cannot use Email option.");
    }
  };


  return (
    <div className="flex flex-wrap gap-2">
      {report.outputFormats.includes('PDF') && (
        <Button variant="outline" size="sm" onClick={() => alert("Download PDF generation is a placeholder.")}>
          <Download className="mr-2 h-4 w-4" /> PDF
        </Button>
      )}
      {report.outputFormats.includes('TXT') && (
        <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
          <FileText className="mr-2 h-4 w-4" /> TXT
        </Button>
      )}
       {report.outputFormats.includes('RTF') && (
        <Button variant="outline" size="sm" onClick={() => alert("Download RTF generation is a placeholder.")}>
          <Download className="mr-2 h-4 w-4" /> RTF
        </Button>
      )}
      {report.outputFormats.includes('Email') && (
        <Button variant="outline" size="sm" onClick={shareViaEmail} disabled={!report.userEmail}>
          <Mail className="mr-2 h-4 w-4" /> Email
        </Button>
      )}
      {report.outputFormats.includes('Share') && (
         <Button variant="outline" size="sm" onClick={() => alert(`Share link (simulated): /teaching-reports/${report.id} - requires user authentication for access. Email: ${report.userEmail || 'N/A'}`)} disabled={!report.userEmail}>
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
