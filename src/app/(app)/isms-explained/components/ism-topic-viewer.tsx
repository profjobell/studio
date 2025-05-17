
// Placeholder component for displaying detailed "ism" content and specific AI interaction
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiChatDialog } from "../../../reports/components/ai-chat-dialog"; // Re-using for AI chat
import { Download, Printer, Share2, BrainCircuit } from "lucide-react";

interface IsmTopicViewerProps {
  selectedTopicId: string | null; // In future, this would trigger loading specific content
}

// Placeholder data - this would be fetched based on selectedTopicId
const sampleTopicData = {
  id: "sample-ism",
  name: "Sample Ism Topic",
  detailedDescription: "This is a detailed explanation of a sample 'ism'. It would cover its history, core beliefs, key figures, and scriptural counterpoints from the KJV 1611 Bible. Multimedia content like embedded videos or images could also be included here.",
  scripturalReferences: ["John 1:1", "Romans 3:23", "Ephesians 2:8-9"],
  // Placeholder for potential download links
  downloads: [
    { name: "Summary PDF", url: "#" },
    { name: "Full Article TXT", url: "#" },
  ]
};

export function IsmTopicViewer({ selectedTopicId }: IsmTopicViewerProps) {
  if (!selectedTopicId) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>Select a Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select an &apos;ism&apos; or topic from the list above to view its detailed examination.</p>
        </CardContent>
      </Card>
    );
  }

  // In a real implementation, fetch topicData based on selectedTopicId
  const topicData = sampleTopicData; // Using sample data for now

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // More sophisticated print might involve generating a print-specific view
      window.print(); 
    }
  };

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-2xl">{topicData.name}</CardTitle>
            <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => alert(`Download ${topicData.downloads[0].name} (placeholder)`)} disabled={!topicData.downloads.length}>
                    <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert("Share (placeholder)")}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>
        </div>
        <CardDescription>
          In-depth examination of {topicData.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <h3 className="font-semibold">Description:</h3>
          <p className="whitespace-pre-wrap">{topicData.detailedDescription}</p>
          
          <h3 className="font-semibold mt-4">Key KJV Scriptural References:</h3>
          <ul className="list-disc list-inside">
            {topicData.scripturalReferences.map(ref => <li key={ref}>{ref}</li>)}
          </ul>
          
          {/* Placeholder for multimedia content */}
          <div className="my-4 p-4 bg-muted rounded-md text-center text-muted-foreground">
            (Multimedia content such as images or embedded videos would appear here)
          </div>

          {topicData.downloads.length > 0 && (
            <>
            <h3 className="font-semibold mt-4">Downloads:</h3>
            <ul className="list-disc list-inside">
                {topicData.downloads.map(dl => (
                    <li key={dl.name}><a href={dl.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{dl.name}</a> (placeholder)</li>
                ))}
            </ul>
            </>
          )}
        </article>

        <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5 text-primary"/>
                AI Insight on {topicData.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
                Ask specific questions about &quot;{topicData.name}&quot; and get KJV 1611 based insights.
            </p>
            <AiChatDialog
                reportId={`ism-${topicData.id}`}
                reportTitle={`Insight on: ${topicData.name}`}
                initialContext={`Topic: ${topicData.name}\n\nDetails:\n${topicData.detailedDescription}\n\nKey KJV Verses mentioned: ${topicData.scripturalReferences.join(', ')}\n\nPlease provide KJV 1611 based insights related to user questions about ${topicData.name}.`}
                triggerButtonText={`Chat About ${topicData.name}`}
            />
        </div>
      </CardContent>
    </Card>
  );
}
