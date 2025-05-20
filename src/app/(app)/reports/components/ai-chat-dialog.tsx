
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2, Send, User, Bot, MessageCircleMore, Save } from "lucide-react";
import type { ChatMessageHistory as GenkitChatMessage } from "@/ai/flows/chat-with-internet-kjv-flow";
import { saveChatToReportAction } from "../actions";

interface ClientChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: string[];
}

interface AiChatDialogProps {
  reportIdOrContextKey: string;
  dialogTitle: string;
  initialContextOrPrompt: string;
  triggerButtonText?: string;
  onSendMessageAction: (
    userInput: string,
    context: string,
    chatHistory?: GenkitChatMessage[]
  ) => Promise<{ aiResponse: string; sourcesCited?: string[] } | { error: string }>;
  isReportContext?: boolean; // New prop
}


export function AiChatDialog({
  reportIdOrContextKey,
  dialogTitle,
  initialContextOrPrompt,
  triggerButtonText = "Examine with AI",
  onSendMessageAction,
  isReportContext = false, // Default to false
}: AiChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ClientChatMessage[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [isSavingChat, startSavingChatTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableView) {
        scrollableView.scrollTop = scrollableView.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = async (messageText: string, currentMessages: ClientChatMessage[]) => {
    const historyForGenkit: GenkitChatMessage[] = currentMessages
      .filter(msg => msg.id !== 'initial-greeting') // Don't send initial greeting as history
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    startTransition(async () => {
      try {
        const result = await onSendMessageAction(messageText, initialContextOrPrompt, historyForGenkit);

        if (result && "error" in result) {
          toast({
            title: "AI Chat Error",
            description: result.error,
            variant: "destructive",
          });
          const errorMessage: ClientChatMessage = { id: `${Date.now()}-error`, sender: 'ai', text: `Error: ${result.error}`};
          setChatMessages(prev => [...prev, errorMessage]);
        } else if (result && result.aiResponse) {
          const aiMessage: ClientChatMessage = {
            id: `${Date.now()}-ai`,
            sender: "ai",
            text: result.aiResponse,
            sources: result.sourcesCited
          };
          setChatMessages((prev) => [...prev, aiMessage]);
        } else {
          toast({
            title: "AI Chat Error",
            description: "Received no response from AI.",
            variant: "destructive",
          });
           const errorMessage: ClientChatMessage = { id: `${Date.now()}-no-response`, sender: 'ai', text: 'Sorry, I could not generate a response.'};
           setChatMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
          title: "AI Chat Failed",
          description: errorMsg,
          variant: "destructive",
        });
        const errorMessage: ClientChatMessage = { id: `${Date.now()}-catch`, sender: 'ai', text: `Failed to get response: ${errorMsg}`};
        setChatMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ClientChatMessage = { id: `${Date.now()}-user`, sender: "user", text: inputValue };
    const newChatMessages = [...chatMessages, userMessage];
    setChatMessages(newChatMessages);
    const currentQuestion = inputValue;
    setInputValue("");

    await sendMessage(currentQuestion, newChatMessages);
  };

  const handleDigDeeper = (aiMessageText: string) => {
    const deeperUserMessageText = `Regarding your statement: "${aiMessageText.substring(0, 70)}...", could you please elaborate further or provide more details?`;
    const deeperUserMessage: ClientChatMessage = {
      id: `${Date.now()}-user-deeper`,
      sender: "user",
      text: deeperUserMessageText
    };
    const newChatMessages = [...chatMessages, deeperUserMessage];
    setChatMessages(newChatMessages);

    sendMessage(deeperUserMessage.text, newChatMessages);
  };

  const handleSaveChat = async () => {
    if (!reportIdOrContextKey || chatMessages.length <= 1) {
      toast({ title: "Cannot Save Chat", description: "Not enough messages or report context missing.", variant: "destructive" });
      return;
    }
    startSavingChatTransition(async () => {
      const result = await saveChatToReportAction(reportIdOrContextKey, chatMessages.filter(m => m.id !== 'initial-greeting'));
      if (result.success) {
        toast({ title: "Chat Saved", description: "The chat transcript has been added to the report. Refresh the main report page if it doesn't update automatically." });
      } else {
        toast({ title: "Failed to Save Chat", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
        if (chatMessages.length === 0 || (chatMessages.length === 1 && chatMessages[0].id === 'initial-greeting')) {
            setChatMessages([{
                id: 'initial-greeting',
                sender: 'ai',
                text: `Hello! How can I help you understand "${dialogTitle}" based on KJV 1611 principles today?`
            }]);
        }
    } else {
      // Optionally clear chat when dialog closes, or persist it if you want it to reopen with old messages
      // setChatMessages([]);
      // setInputValue("");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BrainCircuit className="mr-2 h-4 w-4" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Ask questions about the content. AI responses are guided by KJV 1611 principles.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatMessages.map((message) => {
              const isErrorResponse = message.text.toLowerCase().startsWith("error:") ||
                                      message.text.toLowerCase().startsWith("sorry, i could not generate a response") ||
                                      message.text.toLowerCase().startsWith("failed to get response:");
              const showDigDeeper = message.sender === "ai" && message.id !== 'initial-greeting' && !isErrorResponse;

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.sender === "ai" && (
                    <span className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                      <Bot className="h-5 w-5 text-primary" />
                    </span>
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-[75%] prose prose-sm dark:prose-invert ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                        <p className="text-xs font-semibold">Sources Consulted (Placeholder/Simulated):</p>
                        <ul className="list-disc list-inside text-xs">
                          {message.sources.map((source, idx) => (
                            <li key={idx}><a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">{source}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {showDigDeeper && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs p-0 h-auto mt-2 text-primary/80 hover:text-primary"
                        onClick={() => handleDigDeeper(message.text)}
                        disabled={isLoading}
                      >
                        <MessageCircleMore className="mr-1 h-3 w-3" />
                        Dig Deeper
                      </Button>
                    )}
                  </div>
                  {message.sender === "user" && (
                   <span className="flex-shrink-0 p-2 bg-accent rounded-full">
                      <User className="h-5 w-5 text-accent-foreground" />
                    </span>
                  )}
                </div>
              );
            })}
             {isLoading && chatMessages.length > 0 && chatMessages[chatMessages.length -1].sender === 'user' && (
              <div className="flex items-center gap-3">
                 <span className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                    <Bot className="h-5 w-5 text-primary" />
                  </span>
                <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t flex-col sm:flex-row items-center gap-2">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 flex-grow">
            <Input
              id={`chat-input-${reportIdOrContextKey}`}
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoComplete="off"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
          {isReportContext && (
            <Button
              onClick={handleSaveChat}
              disabled={isSavingChat || chatMessages.length <= 1} // Disable if saving or only initial greeting exists
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isSavingChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Chat to Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
