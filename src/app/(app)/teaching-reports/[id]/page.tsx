
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TeachingAnalysisReport } from "@/types";
import { fetchTeachingAnalysisFromDatabase, chatWithReportAction } from "../../analyze-teaching/actions"; // Updated import
import { TeachingReportDisplay } from "./components/teaching-report-display";
import { TeachingReportActions } from "./components/teaching-report-actions";
import { AiChatDialog } from "../../reports/components/ai-chat-dialog"; // Re-use component
import { PodcastGenerator } from "./components/podcast-generator"; 
import { format } from 'date-fns';
import type { ChatMessageHistory as GenkitChatMessage } from "@/ai/flows/chat-with-report-flow";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const report = await fetchTeachingAnalysisFromDatabase(params.id);
  if (!report) {
    return {
      title: "Teaching Analysis Not Found - KJV Sentinel",
      description: "The requested teaching analysis report could not be found.",
    };
  }
  return {
    title: `Analysis: ${report.teaching.substring(0,50)}... - KJV Sentinel`,
    description: `Detailed KJV 1611 based analysis for teaching: ${report.teaching.substring(0,100)}...`,
  };
}

export default async function TeachingReportPage({ params }: { params: { id: string } }) {
  const report: TeachingAnalysisReport | null = await fetchTeachingAnalysisFromDatabase(params.id);

  if (!report) {
    notFound();
  }
  
  const aiChatContext = `
Teaching Submitted:
${report.teaching}

Recipient for Letter: ${report.recipientNameTitle}
Desired Tone: ${report.tonePreference}
${report.additionalNotes ? `Additional User Notes: ${report.additionalNotes}\n` : ''}
--- Analysis Result ---
Church History Context: ${report.analysisResult.churchHistoryContext}
Promoters/Demonstrators: ${report.analysisResult.promotersDemonstrators.map(p => `${p.name}: ${p.description}`).join('; ')}
Church Council Summary: ${report.analysisResult.churchCouncilSummary}
Letter of Clarification: ${report.analysisResult.letterOfClarification}
Biblical Warnings: ${report.analysisResult.biblicalWarnings}`.trim();

  // Wrapper for AiChatDialog, ensures chatWithReportAction (now from analyze-teaching/actions) is used
  const handleTeachingReportChatSendMessage = async (userQuestion: string, context: string, chatHistory?: GenkitChatMessage[]) => {
    // The 'context' here is aiChatContext which is derived from the teaching report
    return chatWithReportAction({ reportContext: context, userQuestion, chatHistory });
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 print:py-0 print:px-0">
      <Card className="w-full shadow-lg print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">Teaching Analysis Report</CardTitle>
              <CardDescription>
                Analysis for: &quot;{report.teaching.length > 100 ? `${report.teaching.substring(0, 97)}...` : report.teaching}&quot;
                <br />
                Recipient: {report.recipientNameTitle} | Generated: {format(new Date(report.createdAt), 'MM/dd/yyyy')}
              </CardDescription>
            </div>
            <TeachingReportActions report={report} />
          </div>
        </CardHeader>
        
        <div className="hidden print:block mb-4 p-4">
            <h1 className="text-2xl font-bold">Teaching Analysis Report</h1>
            <p className="text-sm text-gray-600">Teaching: &quot;{report.teaching}&quot;</p>
            <p className="text-sm text-gray-600">Recipient: {report.recipientNameTitle} | Generated: {format(new Date(report.createdAt), 'MM/dd/yyyy')}</p>
            <Separator className="my-2"/>
        </div>

        <CardContent className="print:p-0">
          <TeachingReportDisplay report={report} />
        </CardContent>
        <CardFooter className="print:hidden">
          <div className="text-xs text-muted-foreground">
            Report ID: {report.id}
            <br />
            This analysis is a tool to aid discernment. Prayerfully consider it alongside personal study of the KJV 1611 Bible.
          </div>
        </CardFooter>
      </Card>

      {report.analysisResult && (
        <PodcastGenerator analysisId={report.id} initialReport={report} />
      )}

      <Card className="mt-8 w-full shadow-lg print:hidden">
        <CardHeader>
          <CardTitle>Deeper Examination with AI</CardTitle>
          <CardDescription>
            Ask questions about this teaching analysis report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiChatDialog
            reportIdOrContextKey={report.id} // Using report.id as context key
            dialogTitle={`Chat about: ${report.teaching.substring(0, 30)}...`}
            initialContextOrPrompt={aiChatContext} // Pass the constructed context
            triggerButtonText="Chat About This Teaching Analysis"
            onSendMessageAction={handleTeachingReportChatSendMessage} // Pass the specific handler
          />
        </CardContent>
      </Card>

       <div className="mt-8 print:hidden flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/teaching-reports">Back to Teaching Analyses List</Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/glossary">View Glossary</Link>
          </Button>
        </div>
    </div>
  );
}

