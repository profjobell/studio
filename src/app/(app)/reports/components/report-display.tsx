"use client";

import type { AnalyzeContentOutput } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

interface ReportDisplayProps {
  reportData: AnalyzeContentOutput; // This is the 'result' part of the full AnalysisReport
}

// Table styles from prompt
const tableHeaderStyle = "bg-secondary text-secondary-foreground text-base font-semibold"; // Adjusted text-lg to text-base for better fit
const tableRowStyle = "text-sm even:bg-card odd:bg-muted hover:bg-accent/50"; // Using theme colors

function ReportTable({ title, headers, data, columns }: { title: string, headers: string[], data: any[], columns: string[] }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-semibold mt-6 mb-2 text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">No data available for this section.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <h3 className="text-xl font-semibold mt-6 mb-3 text-primary print:text-lg print:mt-4 print:mb-2">{title}</h3>
      <Table className="border border-border print:border-gray-300">
        <TableHeader>
          <TableRow className="print:bg-gray-100">
            {headers.map((header, index) => (
              <TableHead key={index} className={`${tableHeaderStyle} print:text-gray-700 print:text-sm`}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} className={`${tableRowStyle} print:even:bg-white print:odd:bg-gray-50 print:text-xs`}>
              {columns.map((colKey, colIndex) => (
                <TableCell key={colIndex} className="align-top print:py-1 print:px-2">
                  {typeof row[colKey] === 'string' && row[colKey].startsWith('https://') ? (
                     <Link href={row[colKey]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                       {row[colKey]}
                     </Link>
                   ) : (
                     <span className="whitespace-pre-wrap">{row[colKey] !== undefined && row[colKey] !== null ? String(row[colKey]) : 'N/A'}</span>
                   )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


export function ReportDisplay({ reportData }: ReportDisplayProps) {
  const sections = [
    { title: "Summary", content: reportData.summary, type: "paragraph" as const },
    { 
      title: "Scriptural Analysis", 
      data: reportData.scripturalAnalysis, 
      headers: ["Verse", "Analysis"], 
      columns: ["verse", "analysis"],
      type: "table" as const 
    },
    { title: "Historical Context", content: reportData.historicalContext, type: "paragraph" as const },
    { title: "Etymology", content: reportData.etymology, type: "paragraph" as const, 
      // For future structured data:
      // data: parseEtymology(reportData.etymology), headers: ["Term", "Root", "KJV Definition", "Contextual Use"], columns: ["term", "root", "definition", "use"] 
    },
    { title: "Exposure", content: reportData.exposure, type: "paragraph" as const },
    { 
      title: "Logical Fallacies", 
      data: reportData.fallacies, 
      headers: ["Type", "Description"], 
      columns: ["type", "description"],
      type: "table" as const 
    },
    { 
      title: "Manipulative Tactics", 
      data: reportData.manipulativeTactics, 
      headers: ["Technique", "Description"], 
      columns: ["technique", "description"],
      type: "table" as const 
    },
    { 
      title: "Identified Isms", 
      data: reportData.identifiedIsms, 
      headers: ["Ism", "Description", "Evidence"/*, "KJV Alignment" (add when data available) */], 
      columns: ["ism", "description", "evidence"/*, "kjvAlignment"*/],
      type: "table" as const 
    },
    { 
      title: "Calvinism Analysis", 
      data: reportData.calvinismAnalysis, 
      headers: ["Detected Element", "Description", "Evidence", "Infiltration Tactic"/*, "KJV Alignment"*/], 
      columns: ["element", "description", "evidence", "infiltrationTactic"/*, "kjvAlignment"*/],
      type: "table" as const 
    },
    { title: "Biblical Remonstrance", content: reportData.biblicalRemonstrance, type: "paragraph" as const, isHtml: true },
  ];

  return (
    <Accordion type="multiple" defaultValue={sections.map(s => s.title)} className="w-full">
      {sections.map((section, index) => (
        (section.type === "paragraph" && section.content) || (section.type === "table" && section.data && section.data.length > 0) ? (
          <AccordionItem value={section.title} key={index} className="border-b border-border print:border-gray-300">
            <AccordionTrigger className="py-4 text-xl font-semibold hover:no-underline text-left text-primary print:text-lg print:py-2">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-4 px-1 print:px-0">
              {section.type === "paragraph" && section.content && (
                section.isHtml ? (
                   <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs" dangerouslySetInnerHTML={{ __html: section.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>') }} />
                ) : (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{section.content}</p>
                )
              )}
              {section.type === "table" && section.data && (
                <ReportTable title="" headers={section.headers} data={section.data} columns={section.columns} />
              )}
            </AccordionContent>
          </AccordionItem>
        ) : null
      ))}
    </Accordion>
  );
}

// Placeholder for etymology parsing if it becomes structured
// function parseEtymology(etymologyString: string): any[] {
//   // Implement parsing logic if etymology becomes structured
//   // For now, it's displayed as a paragraph.
//   return [];
// }
