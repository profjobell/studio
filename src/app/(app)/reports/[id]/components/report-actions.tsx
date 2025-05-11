
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, Share2 } from "lucide-react";

export function ReportActions() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={() => alert("Download PDF (placeholder)")}>
        <Download className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => alert("Download TXT (placeholder)")}>
        <FileText className="mr-2 h-4 w-4" /> TXT
      </Button>
      <Button variant="outline" size="sm" onClick={() => alert("Share report (placeholder)")}>
        <Share2 className="mr-2 h-4 w-4" /> Share
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
}
