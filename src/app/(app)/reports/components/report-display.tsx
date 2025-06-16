
"use client";

import type { AnalysisReport, ClientChatMessage } from "@/types"; // Ensured ClientChatMessage is imported
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Bot, User, ClipboardCopy, BrainCircuit } from "lucide-react"; // Import icons for chat display and actions
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AiChatDialog } from "./ai-chat-dialog"; // Import AiChatDialog
import type { chatWithReportAction } from "../../analyze/actions"; // Type import for the action

interface ReportDisplayProps {
  reportData: AnalysisReport;
  reportId: string; 
  chatAction: typeof chatWithReportAction; 
}

type ReportSectionItem =
  | { title: string; id?: string; content: string; type: "paragraph"; isHtml?: boolean }
  | { title: string; id?: string; data: any[]; headers: string[]; columns: string[]; type: "table" }
  | { title: string; id?: string; content: any; type: "nestedObject"; renderer: (data: any) => JSX.Element }
  | { title: string; id: string; messages: ClientChatMessage[]; type: "chat" };


const tableHeaderStyle = "bg-secondary text-secondary-foreground text-base font-semibold";
const tableRowStyle = "text-sm even:bg-card odd:bg-muted hover:bg-accent/50";

function ReportTable({ title, headers, data, columns }: { title: string, headers: string[], data: any[], columns: string[] }) {
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

function renderNestedObject(data: any, title?: string): string {
  let text = title ? `${title}\n` : '';
  if (typeof data === 'string') return text + data;
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          text += `  - ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}\n`;
        });
      } else {
        text += `  - ${item}\n`;
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (typeof value === 'object' && value !== null) {
        text += `${formattedKey}:\n${renderNestedObject(value, '')}`; // Recursive call for deeper objects
      } else {
        text += `${formattedKey}: ${value}\n`;
      }
    });
  }
  return text.trim() + '\n\n';
}


function getSectionTextContent(section: ReportSectionItem): string {
  switch (section.type) {
    case "paragraph":
      return section.content;
    case "table":
      if (!section.data || section.data.length === 0) return "No data available for this section.";
      let tableText = `${section.title}\n\n`;
      tableText += section.headers.join("\t") + "\n";
      section.data.forEach(row => {
        tableText += section.columns.map(colKey => row[colKey] !== undefined && row[colKey] !== null ? String(row[colKey]) : 'N/A').join("\t") + "\n";
      });
      return tableText;
    case "nestedObject":
      return renderNestedObject(section.content, section.title);
    case "chat":
      if (!section.messages || section.messages.length === 0) return "No chat messages in this section.";
      let chatText = `Chat Discussion: ${section.title}\n\n`;
      section.messages.forEach(msg => {
        chatText += `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
        if (msg.sources && msg.sources.length > 0) {
          chatText += `  Sources: ${msg.sources.join(', ')}\n`;
        }
      });
      return chatText;
    default:
      return "Section content not available in text format.";
  }
}


export function ReportDisplay({ reportData, reportId, chatAction }: ReportDisplayProps) {
  const { toast } = useToast();

  const renderMoralisticFraming = (data: AnalysisReport['moralisticFramingAnalysis']) => (
    <div className="space-y-3">
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{data.description}</p>
      <h4 className="font-semibold text-md mt-2">Advantages for Speaker Obedience:</h4>
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{data.advantagesForSpeakerObedience}</p>
      {data.linkedLogicalFallacies && data.linkedLogicalFallacies.length > 0 && (
        <ReportTable title="Linked Logical Fallacies" headers={["Fallacy", "Evidence"]} data={data.linkedLogicalFallacies} columns={["fallacy", "evidence"]} />
      )}
      {data.historicalParallels && data.historicalParallels.length > 0 && (
        <ReportTable title="Historical Parallels" headers={["Example", "Description"]} data={data.historicalParallels} columns={["example", "description"]} />
      )}
    </div>
  );

  const renderVirtueSignalling = (data: AnalysisReport['virtueSignallingAnalysis']) => (
     <div className="space-y-3">
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{data.description}</p>
      <h4 className="font-semibold text-md mt-2">Advantages for Speaker Obedience/Admiration:</h4>
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">{data.advantagesForSpeakerObedience}</p>
      {data.linkedLogicalFallacies && data.linkedLogicalFallacies.length > 0 && (
        <ReportTable title="Linked Logical Fallacies" headers={["Fallacy", "Evidence"]} data={data.linkedLogicalFallacies} columns={["fallacy", "evidence"]} />
      )}
      {data.historicalParallels && data.historicalParallels.length > 0 && (
        <ReportTable title="Historical Parallels" headers={["Example", "Description"]} data={data.historicalParallels} columns={["example", "description"]} />
      )}
    </div>
  );

  const renderBiblicalRemonstrance = (data: AnalysisReport['biblicalRemonstrance']) => (
    <div className="space-y-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">
      <p><strong>Scriptural Foundation Assessment:</strong> {data.scripturalFoundationAssessment}</p>
      <p><strong>Historical-Theological Contextualization:</strong> {data.historicalTheologicalContextualization}</p>
      <p><strong>Rhetorical and Homiletical Observations:</strong> {data.rhetoricalAndHomileticalObservations}</p>
      <p><strong>Theological Framework Remarks:</strong> {data.theologicalFrameworkRemarks}</p>
      <p><strong>KJV Scriptural Counterpoints:</strong> {data.kjvScripturalCounterpoints}</p>
      <p><strong>Suggestions For Further Study:</strong> {data.suggestionsForFurtherStudy}</p>
    </div>
  );


  const baseSectionsData: Array<Omit<ReportSectionItem, 'id'>> = [
    { title: "Original Content Submitted", content: reportData.originalContent || "", type: "paragraph" },
    { title: "Summary", content: reportData.summary, type: "paragraph" },
    {
      title: "Scriptural Analysis (KJV 1611)",
      data: reportData.scripturalAnalysis,
      headers: ["Verse", "Analysis"],
      columns: ["verse", "analysis"],
      type: "table"
    },
    { title: "Historical Context", content: reportData.historicalContext, type: "paragraph" },
    { title: "Etymology of Key Terms", content: reportData.etymology, type: "paragraph" },
    { title: "Exposure to Harmful Ideologies", content: reportData.exposure, type: "paragraph" },
    {
      title: "Identified Logical Fallacies (Overall)",
      data: reportData.fallacies,
      headers: ["Type", "Description"],
      columns: ["type", "description"],
      type: "table"
    },
    {
      title: "Identified Manipulative Tactics (Overall)",
      data: reportData.manipulativeTactics,
      headers: ["Technique", "Description"],
      columns: ["technique", "description"],
      type: "table"
    },
    { 
      title: "Moralistic Framing Analysis", 
      content: reportData.moralisticFramingAnalysis, 
      type: "nestedObject", 
      renderer: renderMoralisticFraming 
    },
    { 
      title: "Virtue Signalling Analysis", 
      content: reportData.virtueSignallingAnalysis, 
      type: "nestedObject", 
      renderer: renderVirtueSignalling
    },
    {
      title: "Identified Theological 'Isms'",
      data: reportData.identifiedIsms,
      headers: ["Ism", "Description", "Evidence"],
      columns: ["ism", "description", "evidence"],
      type: "table"
    },
    {
      title: "Calvinism Analysis (KJV 1611)",
      data: reportData.calvinismAnalysis,
      headers: ["Detected Element", "Description", "Evidence", "Infiltration Tactic"],
      columns: ["element", "description", "evidence", "infiltrationTactic"],
      type: "table"
    },
    { 
      title: "Biblical Remonstrance (Detailed Assessment)", 
      content: reportData.biblicalRemonstrance, 
      type: "nestedObject",
      renderer: renderBiblicalRemonstrance
    },
    { title: "Potential Manipulative Speaker Profile", content: reportData.potentialManipulativeSpeakerProfile, type: "paragraph" },
    { title: "Guidance on Wise Confrontation", content: reportData.guidanceOnWiseConfrontation, type: "paragraph" },
  ];

  let sections: ReportSectionItem[] = baseSectionsData.map(s => ({
    ...s,
    id: slugify(s.title),
  })).filter(s => {
    if (s.type === 'paragraph') return !!s.content;
    if (s.type === 'table') return s.data && s.data.length > 0;
    if (s.type === 'nestedObject') return !!s.content;
    return false;
  });


  if (reportData.aiChatTranscript && reportData.aiChatTranscript.length > 0) {
    const chatSection: ReportSectionItem = {
      title: "AI Chat Discussion",
      id: "ai-chat-discussion",
      messages: reportData.aiChatTranscript,
      type: "chat" as const,
    };
    const remonstranceIndex = sections.findIndex(s => s.title === "Biblical Remonstrance (Detailed Assessment)");
    if (remonstranceIndex !== -1 && remonstranceIndex < sections.length -1 ) {
      sections.splice(remonstranceIndex + 1, 0, chatSection);
    } else {
       const deepDiveIndex = sections.findIndex(s => s.title === "In-Depth Calvinism Examination");
       if (deepDiveIndex !== -1) {
         sections.splice(deepDiveIndex, 0, chatSection);
       } else {
         sections.push(chatSection);
       }
    }
  }
  
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
    
    sections.forEach(section => {
        if (section.id && !openValues.includes(section.id)) {
             if (section.type === "paragraph" && section.content) openValues.push(section.id);
             else if (section.type === "table" && section.data && section.data.length > 0) openValues.push(section.id);
             else if (section.type === "nestedObject" && section.content) openValues.push(section.id);
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

    handleHashChange(); 
    setOpenAccordionItems(getDefaultOpenValues()); 

    window.addEventListener('hashchange', handleHashChange, false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  }, [reportData]); // dependencies updated

  const handleCopySection = async (section: ReportSectionItem) => {
    const textToCopy = getSectionTextContent(section);
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Section Copied",
        description: `Content of "${section.title}" copied to clipboard.`,
      });
    } catch (err) {
      console.error("Failed to copy section: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy section content to clipboard.",
        variant: "destructive",
      });
    }
  };


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
        (section.type === "nestedObject" && section.content) ||
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
              {section.type === "nestedObject" && section.content && section.renderer && (
                section.renderer(section.content)
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
              <div className="mt-4 pt-4 border-t border-dashed flex flex-wrap items-center gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => handleCopySection(section)}>
                  <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Section
                </Button>
                <AiChatDialog
                  reportIdOrContextKey={`${reportId}-${section.id}`}
                  dialogTitle={`Chat about: ${section.title}`}
                  initialContextOrPrompt={getSectionTextContent(section)}
                  triggerButtonText="Discuss Section with AI"
                  onSendMessageAction={chatAction}
                  isReportContext={true}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null
      )})}
    </Accordion>
  );
}
