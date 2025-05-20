
"use client";

import type { AnalysisReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Bot, User } from "lucide-react"; // Import icons for chat display
import type { ClientChatMessage } from "./ai-chat-dialog"; // Assuming ClientChatMessage is exported or defined here

interface ReportDisplayProps {
  reportData: AnalysisReport;
}

// Define a type for section items to include the new chat type
type ReportSectionItem =
  | { title: string; id?: string; content: string; type: "paragraph"; isHtml?: boolean }
  | { title: string; id?: string; data: any[]; headers: string[]; columns: string[]; type: "table" }
  | { title: string; id: string; messages: ClientChatMessage[]; type: "chat" };


const tableHeaderStyle = "bg-secondary text-secondary-foreground text-base font-semibold";
const tableRowStyle = "text-sm even:bg-card odd:bg-muted hover:bg-accent/50";

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
  const baseSections: ReportSectionItem[] = [
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
      headers: ["Ism", "Description", "Evidence"],
      columns: ["ism", "description", "evidence"],
      type: "table" as const
    },
    {
      title: "Calvinism Analysis",
      data: reportData.calvinismAnalysis,
      headers: ["Detected Element", "Description", "Evidence", "Infiltration Tactic"],
      columns: ["element", "description", "evidence", "infiltrationTactic"],
      type: "table" as const
    },
    { title: "Biblical Remonstrance", content: reportData.biblicalRemonstrance, type: "paragraph" as const, isHtml: true },
  ];

  if (reportData.calvinismDeepDiveAnalysis) {
    baseSections.push({
      title: "In-Depth Calvinism Examination",
      content: reportData.calvinismDeepDiveAnalysis,
      type: "paragraph" as const,
    });
  }

  const sections: ReportSectionItem[] = [...baseSections];

  if (reportData.originalContent) {
    sections.unshift({
      title: "Original Content Submitted",
      content: reportData.originalContent,
      type: "paragraph" as const,
    });
  }
  
  // Add the AI Chat Discussion section if transcript exists
  if (reportData.aiChatTranscript && reportData.aiChatTranscript.length > 0) {
    const chatSection: ReportSectionItem = {
      title: "AI Chat Discussion",
      id: "ai-chat-discussion", // Stable ID for the section
      messages: reportData.aiChatTranscript,
      type: "chat" as const,
    };
    // Insert it after Summary or Original Content, or at the end
    const summaryIndex = sections.findIndex(s => s.title === "Summary");
    const originalContentIndex = sections.findIndex(s => s.title === "Original Content Submitted");
    let insertAtIndex = sections.length;
    if (summaryIndex !== -1) {
      insertAtIndex = summaryIndex + 1;
    } else if (originalContentIndex !== -1) {
      insertAtIndex = originalContentIndex + 1;
    }
    sections.splice(insertAtIndex, 0, chatSection);
  }


  const getDefaultOpenValues = () => {
    const openValues = sections
      .filter(section =>
        (section.type === "paragraph" && section.content) ||
        (section.type === "table" && section.data && section.data.length > 0) ||
        (section.type === "chat" && section.messages && section.messages.length > 0)
      )
      .map(section => section.id || slugify(section.title));

    if (reportData.summary && !openValues.includes(slugify("Summary"))) {
        if (reportData.originalContent) openValues.splice(1,0, slugify("Summary"));
        else openValues.unshift(slugify("Summary"));
    }
    if (reportData.originalContent && !openValues.includes(slugify("Original Content Submitted"))){
        openValues.unshift(slugify("Original Content Submitted"));
    }
    if (reportData.calvinismDeepDiveAnalysis && !openValues.includes(slugify("In-Depth Calvinism Examination"))) {
      openValues.push(slugify("In-Depth Calvinism Examination"));
    }
    // Ensure AI Chat Discussion is open by default if it exists and has content
    if (reportData.aiChatTranscript && reportData.aiChatTranscript.length > 0 && !openValues.includes("ai-chat-discussion")) {
      openValues.push("ai-chat-discussion");
    }
    return openValues;
  }

  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(getDefaultOpenValues());

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const targetSection = sections.find(s => (s.id || slugify(s.title)) === hash);
        if (targetSection) {
          const sectionId = targetSection.id || slugify(targetSection.title);
          setOpenAccordionItems(prev => Array.from(new Set([...prev, sectionId])));
          setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange, false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  // sections array itself is rebuilt on each render, so it's a valid dependency.
  // reportData.aiChatTranscript is added to ensure effect runs if transcript changes.
  }, [sections, reportData.summary, reportData.originalContent, reportData.calvinismDeepDiveAnalysis, reportData.aiChatTranscript]);


  return (
    <Accordion
      type="multiple"
      value={openAccordionItems}
      onValueChange={setOpenAccordionItems}
      className="w-full"
    >
      {sections.map((section) => {
        const sectionId = section.id || slugify(section.title);
        return (
        (section.type === "paragraph" && section.content) ||
        (section.type === "table" && section.data && section.data.length > 0) ||
        (section.type === "chat" && section.messages && section.messages.length > 0) ? (
          <AccordionItem value={sectionId} key={sectionId} id={sectionId} className="border-b border-border print:border-gray-300">
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
              {section.type === "table" && section.data && section.headers && section.columns && (
                <ReportTable title="" headers={section.headers} data={section.data} columns={section.columns} />
              )}
              {section.type === "chat" && section.messages && (
                <div className="space-y-3 py-2">
                  {section.messages.map((msg, msgIdx) => (
                    <div key={msgIdx} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'ai' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                      <div className={`p-2 rounded-md max-w-[80%] text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                         {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-muted-foreground/20 text-xs">
                            <p className="font-semibold">Sources:</p>
                            <ul className="list-disc list-inside">
                              {msg.sources.map((source, idx) => (
                                <li key={idx}><a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">{source}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {msg.sender === 'user' && <User className="h-5 w-5 text-accent-foreground flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ) : null
      )})}
    </Accordion>
  );
}
