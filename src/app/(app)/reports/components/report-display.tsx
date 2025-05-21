
"use client";

import type { AnalysisReport, ClientChatMessage } from "@/types"; // Ensured ClientChatMessage is imported
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Bot, User } from "lucide-react"; // Import icons for chat display

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
  const baseSectionsData: Array<Omit<ReportSectionItem, 'id' | 'type'> & { type?: ReportSectionItem['type'] }> = [
    { title: "Original Content Submitted", content: reportData.originalContent },
    { title: "Summary", content: reportData.summary },
    {
      title: "Scriptural Analysis",
      data: reportData.scripturalAnalysis,
      headers: ["Verse", "Analysis"],
      columns: ["verse", "analysis"],
    },
    { title: "Historical Context", content: reportData.historicalContext },
    { title: "Etymology", content: reportData.etymology },
    { title: "Exposure", content: reportData.exposure },
    {
      title: "Logical Fallacies",
      data: reportData.fallacies,
      headers: ["Type", "Description"],
      columns: ["type", "description"],
    },
    {
      title: "Manipulative Tactics",
      data: reportData.manipulativeTactics,
      headers: ["Technique", "Description"],
      columns: ["technique", "description"],
    },
    {
      title: "Identified Isms",
      data: reportData.identifiedIsms,
      headers: ["Ism", "Description", "Evidence"],
      columns: ["ism", "description", "evidence"],
    },
    {
      title: "Calvinism Analysis",
      data: reportData.calvinismAnalysis,
      headers: ["Detected Element", "Description", "Evidence", "Infiltration Tactic"],
      columns: ["element", "description", "evidence", "infiltrationTactic"],
    },
    { title: "Biblical Remonstrance", content: reportData.biblicalRemonstrance, isHtml: true },
  ];

  let sections: ReportSectionItem[] = baseSectionsData.map(s => {
    if ('data' in s) {
      return { ...s, id: slugify(s.title), type: "table" as const };
    }
    return { ...s, id: slugify(s.title), type: "paragraph" as const, content: s.content || "" };
  }).filter(s => (s.type === 'paragraph' && s.content) || (s.type === 'table' && s.data && s.data.length > 0));


  // Insert AI Chat Discussion after "Biblical Remonstrance"
  if (reportData.aiChatTranscript && reportData.aiChatTranscript.length > 0) {
    const chatSection: ReportSectionItem = {
      title: "AI Chat Discussion",
      id: "ai-chat-discussion",
      messages: reportData.aiChatTranscript,
      type: "chat" as const,
    };
    const remonstranceIndex = sections.findIndex(s => s.title === "Biblical Remonstrance");
    if (remonstranceIndex !== -1) {
      sections.splice(remonstranceIndex + 1, 0, chatSection);
    } else {
      // Fallback: add before Calvinism Deep Dive or at the end
      const deepDiveIndex = sections.findIndex(s => s.title === "In-Depth Calvinism Examination");
      if (deepDiveIndex !== -1) {
        sections.splice(deepDiveIndex, 0, chatSection);
      } else {
        sections.push(chatSection);
      }
    }
  }
  
  // Add In-Depth Calvinism Examination at the very end if it exists
  if (reportData.calvinismDeepDiveAnalysis) {
    sections.push({
      title: "In-Depth Calvinism Examination",
      id: slugify("In-Depth Calvinism Examination"),
      content: reportData.calvinismDeepDiveAnalysis,
      type: "paragraph" as const,
    });
  }


  const getDefaultOpenValues = () => {
    const openValues: string[] = [];
    if (reportData.originalContent) openValues.push(slugify("Original Content Submitted"));
    if (reportData.summary) openValues.push(slugify("Summary"));
    
    // Add other sections if they have content
    sections.forEach(section => {
        if (section.id && !openValues.includes(section.id)) {
             if (section.type === "paragraph" && section.content) openValues.push(section.id);
             else if (section.type === "table" && section.data && section.data.length > 0) openValues.push(section.id);
             else if (section.type === "chat" && section.messages && section.messages.length > 0) openValues.push(section.id);
        }
    });
    
    return openValues;
  }

  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(getDefaultOpenValues());

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const targetSection = sections.find(s => s.id === hash);
        if (targetSection) {
          setOpenAccordionItems(prev => Array.from(new Set([...prev, targetSection.id!])));
          setTimeout(() => {
            const element = document.getElementById(targetSection.id!);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }
    };

    handleHashChange(); // Call on initial mount
    setOpenAccordionItems(getDefaultOpenValues()); // Ensure default open state is set on mount / data change

    window.addEventListener('hashchange', handleHashChange, false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  // sections array itself is rebuilt on each render, so it's a valid dependency.
  // reportData changes will trigger re-evaluation
  }, [reportData]);


  return (
    <Accordion
      type="multiple"
      value={openAccordionItems}
      onValueChange={setOpenAccordionItems}
      className="w-full"
    >
      {sections.map((section) => {
        return (
        (section.type === "paragraph" && section.content) ||
        (section.type === "table" && section.data && section.data.length > 0) ||
        (section.type === "chat" && section.messages && section.messages.length > 0) ? (
          <AccordionItem value={section.id!} key={section.id!} id={section.id!} className="border-b border-border print:border-gray-300">
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

