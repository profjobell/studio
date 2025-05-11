'use client';

import type { TeachingAnalysisReport } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from "next/link";

interface TeachingReportDisplayProps {
  report: TeachingAnalysisReport;
}

export function TeachingReportDisplay({ report }: TeachingReportDisplayProps) {
  const { teaching, recipientNameTitle, tonePreference, additionalNotes, analysisResult } = report;

  const sections = [
    { title: "Original Teaching Submitted", content: teaching, type: "paragraph" as const },
    { title: `Letter of Clarification (Tone: ${tonePreference})`, content: analysisResult.letterOfClarification, type: "paragraph" as const, isHtml: true },
    { title: "Church History Context", content: analysisResult.churchHistoryContext, type: "paragraph" as const },
    { 
      title: "Promoters & Demonstrators", 
      data: analysisResult.promotersDemonstrators, 
      headers: ["Name", "Description"], 
      columns: ["name", "description"],
      type: "table" as const 
    },
    { title: "Church Council Summary", content: analysisResult.churchCouncilSummary, type: "paragraph" as const },
    { title: "Biblical Warnings on False Teachers (KJV 1611)", content: analysisResult.biblicalWarnings, type: "paragraph" as const, isHtml: true },
  ];

  if (additionalNotes) {
    sections.push({ title: "Additional User Notes", content: additionalNotes, type: "paragraph" as const });
  }
  
  const defaultOpenValues = sections
    .filter(section => (section.type === "paragraph" && section.content) || (section.type === "table" && section.data && section.data.length > 0))
    .map(section => section.title);
  
  // Ensure Original Teaching and Letter are open by default.
  if (!defaultOpenValues.includes("Original Teaching Submitted")) {
      defaultOpenValues.unshift("Original Teaching Submitted");
  }
  if (!defaultOpenValues.includes(`Letter of Clarification (Tone: ${tonePreference})`)) {
      defaultOpenValues.splice(1,0, `Letter of Clarification (Tone: ${tonePreference})`);
  }


  return (
    <Accordion type="multiple" defaultValue={defaultOpenValues} className="w-full">
      {sections.map((section, index) => (
        (section.type === "paragraph" && section.content) || (section.type === "table" && section.data && section.data.length > 0) ? (
          <AccordionItem value={section.title} key={index} className="border-b border-border print:border-gray-300">
            <AccordionTrigger className="py-4 text-xl font-semibold hover:no-underline text-left text-primary print:text-lg print:py-2">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-4 px-1 print:px-0">
              {section.type === "paragraph" && section.content && (
                section.isHtml ? (
                   <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs" dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>') }} />
                ) : (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{section.content}</p>
                )
              )}
              {section.type === "table" && section.data && section.headers && section.columns && (
                <ReportTable title="" headers={section.headers} data={section.data} columns={section.columns} />
              )}
            </AccordionContent>
          </AccordionItem>
        ) : null
      ))}
    </Accordion>
  );
}


// Re-usable Table Component (similar to the one in ReportDisplay for regular reports)
function ReportTable({ title, headers, data, columns }: { title: string, headers: string[], data: any[], columns: string[] }) {
  const tableHeaderStyle = "bg-secondary text-secondary-foreground text-base font-semibold";
  const tableRowStyle = "text-sm even:bg-card odd:bg-muted hover:bg-accent/50";

  if (!data || data.length === 0) {
    return (
      <div>
        {title && <h3 className="text-xl font-semibold mt-6 mb-2 text-primary">{title}</h3>}
        <p className="text-sm text-muted-foreground">No data available for this section.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {title && <h3 className="text-xl font-semibold mt-6 mb-3 text-primary print:text-lg print:mt-4 print:mb-2">{title}</h3>}
      <table className="w-full border border-border print:border-gray-300">
        <thead>
          <tr className="print:bg-gray-100">
            {headers.map((header, index) => (
              <th key={index} className={`p-2 text-left ${tableHeaderStyle} print:text-gray-700 print:text-sm`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={`${tableRowStyle} print:even:bg-white print:odd:bg-gray-50 print:text-xs`}>
              {columns.map((colKey, colIndex) => (
                <td key={colIndex} className="p-2 align-top print:py-1 print:px-2">
                  {typeof row[colKey] === 'string' && row[colKey].startsWith('https://') ? (
                     <Link href={row[colKey]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                       {row[colKey]}
                     </Link>
                   ) : (
                     <span className="whitespace-pre-wrap">{row[colKey] !== undefined && row[colKey] !== null ? String(row[colKey]) : 'N/A'}</span>
                   )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}