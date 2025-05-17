
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Info, Home } from "lucide-react";
import { AiChatDialog } from "@/app/(app)/reports/components/ai-chat-dialog";
import { IsmTopicListClient } from "./components/ism-topic-list-client";
import { getIsmExplanationChatAction } from "./actions"; // New server action

export const metadata = {
  title: "The 'ISMS' Exposed, Examined & Explained - KJV Sentinel",
  description: "In-depth examination of various 'isms', heresies, and anti-Christ philosophies through the lens of the KJV 1611 Bible.",
};

const ismTopics = [
  { id: "arianism", name: "Arianism", brief: "A 4th-century Christological heresy denying the full divinity of Jesus Christ." },
  { id: "gnosticism", name: "Gnosticism", brief: "A collection of ancient religious ideas and systems which taught that the material world was created by an evil demiurge." },
  { id: "marcionism", name: "Marcionism", brief: "An Early Christian dualist belief system that originated from the teachings of Marcion of Sinope in Rome around the year 144." },
  { id: "pelagianism", name: "Pelagianism", brief: "A theological theory named after Pelagius, it denied original sin and affirmed humanity's inherent ability to fulfill God's commands without divine grace." },
  { id: "calvinism-overview", name: "Calvinism (Overview)", brief: "A major branch of Protestantism that follows the theological tradition and forms of Christian practice set down by John Calvin and other Reformation-era theologians." },
];

export default function IsmsExplainedPage() {
  // The 'topicContext' for the AI chat action will be passed by AiChatDialog based on its 'initialContextOrPrompt' prop.
  // Here, 'initialContextOrPrompt' will define the general scope of the chat.
  const generalIsmContextForDialog = "General discussion about theological 'isms', heresies, and anti-Christ philosophies";

  const handleIsmChatSendMessage = async (userQuestion: string, topicContextFromDialog: string) => {
    // topicContextFromDialog will be generalIsmContextForDialog here.
    // The specific 'ism' context, if any (e.g., from IsmTopicViewer), would need to be part of the userQuestion or handled differently.
    // For this general chat, topicContext in the action's input can be the dialog's title or a generic "General Isms".
    return getIsmExplanationChatAction({ userQuestion, topicContext: "General Isms Discussion" });
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Info className="mr-3 h-8 w-8 text-primary" />
          The &apos;ISMS&apos; Exposed, Examined & Explained
        </h1>
         <Button asChild variant="outline">
            <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" /> Home
            </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Understanding Doctrines and Philosophies</CardTitle>
          <CardDescription>
            This section provides in-depth analysis of various theological systems, heresies, and philosophies, measured against the KJV 1611 Bible. Explore topics to understand their origins, core tenets, and scriptural alignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            Select a topic below to learn more. Each topic will eventually feature detailed explanations, multimedia resources, download options, and an AI assistant for deeper KJV-based insights.
          </p>
          
          <IsmTopicListClient topics={ismTopics} />
          
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-6 w-6 text-primary"/>
                AI-Powered KJV Insight
            </CardTitle>
            <CardDescription>
                Have general questions about &apos;isms&apos; or specific doctrines? Use our AI assistant for KJV 1611 based insights.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <AiChatDialog
                reportIdOrContextKey="general-isms-chat"
                dialogTitle="General Isms Discussion"
                initialContextOrPrompt={generalIsmContextForDialog}
                triggerButtonText="Ask AI About Isms (KJV Lens)"
                onSendMessageAction={handleIsmChatSendMessage}
            />
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Content for specific &apos;isms&apos; including multimedia, downloads, and topic-specific AI chat is under development.
        </p>
      </div>
    </div>
  );
}

    