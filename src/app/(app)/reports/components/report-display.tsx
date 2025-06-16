
"use client";

import type { AnalysisReport, ClientChatMessage, PrayerAnalysisOutput, SinglePrayerAnalysis, AlternatePrayerAnalysisOutput, InDepthCalvinismReportOutput } from "@/types"; 
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { useEffect, useState, useTransition } from "react";
import { Bot, User, ClipboardCopy, BrainCircuit, ShieldQuestion, Loader2, FileSearch, AlertTriangle } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AiChatDialog } from "./ai-chat-dialog"; 
import type { chatWithReportAction } from "../../analyze/actions"; 
import { runAlternatePrayerAnalysisAction } from "../../analyze/actions";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';


interface ReportDisplayProps {
  reportData: AnalysisReport;
  reportId: string; 
  chatAction: typeof chatWithReportAction; 
}

type ReportSectionItem =
  | { title: string; id?: string; content: string; type: "paragraph"; isHtml?: boolean }
  | { title: string; id?: string; data: any[]; headers: string[]; columns: string[]; type: "table" }
  | { title: string; id?: string; content: any; type: "nestedObject"; renderer: (data: any) => JSX.Element }
  | { title: string; id: string; messages: ClientChatMessage[]; type: "chat" }
  | { title: string; id: string; prayerAnalyses: PrayerAnalysisOutput; type: "prayerAnalysis" }
  | { title: string; id: string; alternatePrayerAnalyses: AnalysisReport['alternatePrayerAnalyses']; type: "alternatePrayerAnalysis" }
  | { title: string; id: string; idcrData: InDepthCalvinismReportOutput; type: "idcr" }; // Added IDCR type


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
        text += `${formattedKey}:\n${renderNestedObject(value, '')}`; 
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
    case "prayerAnalysis":
      if (!section.prayerAnalyses || section.prayerAnalyses.length === 0) return "No prayer analyses available.";
      let prayerText = `Prayer Analysis (Initial)\n\n`;
      section.prayerAnalyses.forEach((pa, index) => {
        prayerText += `Prayer ${index + 1} Text: "${pa.identifiedPrayerText}"\n`;
        prayerText += `  KJV Alignment: ${pa.kjvAlignmentAssessment}\n`;
        prayerText += `  Manipulative Language: ${pa.manipulativeLanguage.hasPotentiallyManipulativeElements ? 'Detected' : 'Not Detected'}\n`;
        if (pa.manipulativeLanguage.hasPotentiallyManipulativeElements) {
          prayerText += `    Evidence: ${pa.manipulativeLanguage.evidence?.join('; ') || 'N/A'}\n`;
          prayerText += `    Description: ${pa.manipulativeLanguage.description || 'N/A'}\n`;
        }
        prayerText += `  Overall Assessment: ${pa.overallAssessment}\n\n`;
      });
      return prayerText;
    case "alternatePrayerAnalysis":
      if (!section.alternatePrayerAnalyses || section.alternatePrayerAnalyses.length === 0) return "No alternate prayer analyses available.";
      let apaText = `Alternate Prayer Analysis Results\n\n`;
      section.alternatePrayerAnalyses.forEach((apaItem, index) => {
        const apa = apaItem.analysis;
        apaText += `APA for Prayer: "${apaItem.originalPrayerText}" (Analyzed: ${new Date(apaItem.analyzedAt).toLocaleString()})\n`;
        apaText += `  Overall Summary: ${apa.overallSummary}\n`;
        apaText += `  Virtue Signalling Assessment: ${apa.virtueSignalling.assessment}\n`;
        apa.virtueSignalling.items.forEach(item => {
          apaText += `    - Quote: "${item.quote}"\n      Analysis: ${item.analysis}\n`;
        });
        apaText += `  Manipulative Phrasing Assessment: ${apa.manipulativePhrasing.assessment}\n`;
        apa.manipulativePhrasing.items.forEach(item => {
          apaText += `    - Type: ${item.type}\n      Quote: "${item.quote}"\n      Analysis: ${item.analysis}\n`;
        });
        apaText += `  KJV Comparison:\n`;
        apaText += `    Alignment: ${apa.kjvComparison.alignmentWithScripturalPrinciples}\n`;
        apaText += `    Warnings Observed: ${apa.kjvComparison.specificWarningsObserved}\n`;
        apaText += `    Positive Aspects: ${apa.kjvComparison.positiveAspects}\n`;
        apaText += `    Areas of Concern: ${apa.kjvComparison.areasOfConcern}\n`;
        apaText += `  Overall Spiritual Integrity: ${apa.overallSpiritualIntegrityAssessment}\n\n`;
      });
      return apaText;
    case "idcr":
        let idcrText = `In-Depth Calvinistic Report (IDCR)\n\n`;
        const idcr = section.idcrData;
        idcrText += `1. Overt Calvinism Analysis:\n${idcr.overtCalvinismAnalysis}\n\n`;
        idcrText += `2. Subtle Communication Analysis:\n${idcr.subtleCommunicationAnalysis}\n\n`;
        idcrText += `3. Psychological Tactics Analysis:\n${idcr.psychologicalTacticsAnalysis}\n\n`;
        idcrText += `4. God's Character Representation:\n`;
        idcrText += `   God the Father: ${idcr.godsCharacterRepresentation.godTheFather}\n`;
        idcrText += `   Lord Jesus Christ: ${idcr.godsCharacterRepresentation.lordJesusChrist}\n`;
        idcrText += `   Holy Spirit: ${idcr.godsCharacterRepresentation.holySpirit}\n\n`;
        idcrText += `5. Cessationism Analysis:\n${idcr.cessationismAnalysis}\n\n`;
        idcrText += `6. Anti-Semitism Analysis:\n${idcr.antiSemitismAnalysis}\n\n`;
        idcrText += `7. Further Unearthing Notes:\n${idcr.furtherUnearthingNotes}\n\n`;
        return idcrText;
    default:
      return "Section content not available in text format.";
  }
}

function AlternatePrayerAnalysisButton({ reportId, prayerText, onComplete }: { reportId: string; prayerText: string; onComplete: () => void }) {
  const [isApaPending, startApaTransition] = useTransition();
  const { toast } = useToast();

  const handleRunApa = () => {
    startApaTransition(async () => {
      const result = await runAlternatePrayerAnalysisAction(reportId, prayerText);
      if (result.success) {
        toast({ title: "Alternate Prayer Analysis Complete", description: "The detailed analysis has been added to the report." });
      } else {
        toast({ title: "APA Failed", description: result.error || "An unexpected error occurred.", variant: "destructive" });
      }
      onComplete(); // Trigger refresh or update
    });
  };

  return (
    <Button onClick={handleRunApa} disabled={isApaPending} variant="outline" size="sm" className="mt-2">
      {isApaPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
      APA (Alternate Prayer Analysis)
    </Button>
  );
}


export function ReportDisplay({ reportData, reportId, chatAction }: ReportDisplayProps) {
  const { toast } = useToast();
  const router = useRouter();

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
  
  const renderPrayerAnalysis = (prayerAnalyses: PrayerAnalysisOutput) => (
    <div className="space-y-4">
      {prayerAnalyses.map((pa, index) => (
        <Card key={index} className="bg-muted/30 p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-md font-semibold text-primary/90">Prayer {index + 1} Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-sm space-y-2">
            <p><strong>Identified Prayer Text:</strong> <em className="block bg-background/50 p-2 rounded text-xs whitespace-pre-wrap">&quot;{pa.identifiedPrayerText}&quot;</em></p>
            <p><strong>KJV Alignment Assessment:</strong> {pa.kjvAlignmentAssessment}</p>
            <div>
              <p><strong>Manipulative Language:</strong> {pa.manipulativeLanguage.hasPotentiallyManipulativeElements ? 
                <span className="font-semibold text-destructive">Detected</span> : 
                <span className="font-semibold text-green-600">Not Detected</span>}
              </p>
              {pa.manipulativeLanguage.hasPotentiallyManipulativeElements && (
                <div className="pl-4 text-xs space-y-1 mt-1">
                  {pa.manipulativeLanguage.description && <p><em>Description:</em> {pa.manipulativeLanguage.description}</p>}
                  {pa.manipulativeLanguage.evidence && pa.manipulativeLanguage.evidence.length > 0 && (
                    <div><em>Evidence:</em>
                      <ul className="list-disc list-inside pl-2">
                        {pa.manipulativeLanguage.evidence.map((ev, i) => <li key={i}>&quot;{ev}&quot;</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p><strong>Overall Assessment:</strong> {pa.overallAssessment}</p>
            <AlternatePrayerAnalysisButton
              reportId={reportId}
              prayerText={pa.identifiedPrayerText}
              onComplete={() => router.refresh()}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAlternatePrayerAnalysisResults = (apaResults: AnalysisReport['alternatePrayerAnalyses']) => {
    if (!apaResults || apaResults.length === 0) {
      return <p className="text-sm text-muted-foreground">No alternate prayer analyses have been run for this report.</p>;
    }
    return (
      <div className="space-y-6">
        {apaResults.map((apaItem, index) => (
          <Card key={index} className="bg-card border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary/90">APA for: &quot;{apaItem.originalPrayerText.substring(0, 50)}...&quot;</CardTitle>
              <p className="text-xs text-muted-foreground">Analyzed on: {format(new Date(apaItem.analyzedAt), 'PPP p')}</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div><strong>Overall Summary:</strong> <p className="whitespace-pre-wrap">{apaItem.analysis.overallSummary}</p></div>
              
              <div>
                <h4 className="font-medium text-md">Virtue Signalling</h4>
                <p><strong>Assessment:</strong> {apaItem.analysis.virtueSignalling.assessment}</p>
                {apaItem.analysis.virtueSignalling.items.length > 0 && (
                  <ReportTable title="" headers={["Quote", "Analysis"]} data={apaItem.analysis.virtueSignalling.items} columns={["quote", "analysis"]} />
                )}
              </div>

              <div>
                <h4 className="font-medium text-md">Gaslighting or Manipulative Phrasing</h4>
                <p><strong>Assessment:</strong> {apaItem.analysis.manipulativePhrasing.assessment}</p>
                {apaItem.analysis.manipulativePhrasing.items.length > 0 && (
                  <ReportTable title="" headers={["Type", "Quote", "Analysis"]} data={apaItem.analysis.manipulativePhrasing.items} columns={["type", "quote", "analysis"]} />
                )}
              </div>

              <div>
                <h4 className="font-medium text-md">KJV Comparison</h4>
                <p><strong>Alignment with Scriptural Principles:</strong> {apaItem.analysis.kjvComparison.alignmentWithScripturalPrinciples}</p>
                <p><strong>Specific Warnings Observed (Matt 6:5-8):</strong> {apaItem.analysis.kjvComparison.specificWarningsObserved}</p>
                <p><strong>Positive Aspects:</strong> {apaItem.analysis.kjvComparison.positiveAspects}</p>
                <p><strong>Areas of Concern:</strong> {apaItem.analysis.kjvComparison.areasOfConcern}</p>
              </div>
              
              <div><strong>Overall Spiritual Integrity Assessment:</strong> <p className="whitespace-pre-wrap">{apaItem.analysis.overallSpiritualIntegrityAssessment}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderInDepthCalvinismReport = (idcrData: InDepthCalvinismReportOutput) => (
    <div className="space-y-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-xs">
        <p><strong>Overt Calvinism Analysis:</strong> {idcrData.overtCalvinismAnalysis}</p>
        <p><strong>Subtle Communication Analysis:</strong> {idcrData.subtleCommunicationAnalysis}</p>
        <p><strong>Psychological Tactics Analysis:</strong> {idcrData.psychologicalTacticsAnalysis}</p>
        <div>
            <h4 className="font-semibold mt-1">God&apos;s Character Representation:</h4>
            <ul className="list-disc list-inside pl-4">
                <li><strong>God the Father:</strong> {idcrData.godsCharacterRepresentation.godTheFather}</li>
                <li><strong>Lord Jesus Christ:</strong> {idcrData.godsCharacterRepresentation.lordJesusChrist}</li>
                <li><strong>Holy Spirit:</strong> {idcrData.godsCharacterRepresentation.holySpirit}</li>
            </ul>
        </div>
        <p><strong>Cessationism Analysis:</strong> {idcrData.cessationismAnalysis}</p>
        <p><strong>Anti-Semitism Analysis:</strong> {idcrData.antiSemitismAnalysis}</p>
        <p><strong>Further Unearthing Notes:</strong> {idcrData.furtherUnearthingNotes}</p>
    </div>
  );


  const baseSectionsData: Array<Omit<ReportSectionItem, 'id'>> = [
    { title: "Original Content Submitted", content: reportData.originalContent || "", type: "paragraph" },
    { title: "Prepared Content (Used for Analysis)", content: reportData.preparedContent || reportData.originalContent || "", type: "paragraph" },
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
  
  if (reportData.prayerAnalyses && reportData.prayerAnalyses.length > 0) {
    sections.push({
      title: "Prayer Analysis (Initial)",
      id: slugify("Prayer Analysis (Initial)"),
      prayerAnalyses: reportData.prayerAnalyses,
      type: "prayerAnalysis" as const,
    });
  }

  if (reportData.alternatePrayerAnalyses && reportData.alternatePrayerAnalyses.length > 0) {
    sections.push({
      title: "Alternate Prayer Analysis Results",
      id: slugify("Alternate Prayer Analysis Results"),
      alternatePrayerAnalyses: reportData.alternatePrayerAnalyses,
      type: "alternatePrayerAnalysis" as const,
    });
  }
  
  if (reportData.inDepthCalvinismReport) {
    sections.push({
      title: "In-Depth Calvinistic Report (IDCR)",
      id: slugify("In-Depth Calvinistic Report (IDCR)"),
      idcrData: reportData.inDepthCalvinismReport,
      type: "idcr" as const,
    });
  }


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
             else if (section.type === "prayerAnalysis" && section.prayerAnalyses && section.prayerAnalyses.length > 0) openValues.push(section.id);
             else if (section.type === "alternatePrayerAnalysis" && section.alternatePrayerAnalyses && section.alternatePrayerAnalyses.length > 0) openValues.push(section.id);
             else if (section.type === "idcr" && section.idcrData) openValues.push(section.id);
        }
    });
    if (reportData.alternatePrayerAnalyses && reportData.alternatePrayerAnalyses.length > 0) {
      const apaSectionId = slugify("Alternate Prayer Analysis Results");
      if (!openValues.includes(apaSectionId)) {
        openValues.push(apaSectionId);
      }
    }
    if (reportData.inDepthCalvinismReport) {
        const idcrSectionId = slugify("In-Depth Calvinistic Report (IDCR)");
        if(!openValues.includes(idcrSectionId)) {
            openValues.push(idcrSectionId);
        }
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportData]); 

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
        (section.type === "chat" && section.messages && section.messages.length > 0) ||
        (section.type === "prayerAnalysis" && section.prayerAnalyses && section.prayerAnalyses.length > 0) ||
        (section.type === "alternatePrayerAnalysis" && section.alternatePrayerAnalyses && section.alternatePrayerAnalyses.length > 0) ||
        (section.type === "idcr" && section.idcrData) ? ( // Condition for IDCR
          <AccordionItem value={section.id!} key={section.id!} id={section.id!} className="border-b border-border print:border-gray-300">
            <AccordionTrigger className="py-4 text-xl font-semibold hover:no-underline text-left text-primary print:text-lg print:py-2">
              <div className="flex items-center gap-2">
                 {(section.type === "prayerAnalysis" || section.type === "alternatePrayerAnalysis") && <ShieldQuestion className="h-5 w-5 text-primary/80" />}
                 {section.type === "idcr" && <AlertTriangle className="h-5 w-5 text-destructive" />}
                 {section.title}
              </div>
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
              {section.type === "idcr" && section.idcrData && (
                renderInDepthCalvinismReport(section.idcrData)
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
              {section.type === "prayerAnalysis" && section.prayerAnalyses && renderPrayerAnalysis(section.prayerAnalyses)}
              {section.type === "alternatePrayerAnalysis" && section.alternatePrayerAnalyses && renderAlternatePrayerAnalysisResults(section.alternatePrayerAnalyses)}

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
    
