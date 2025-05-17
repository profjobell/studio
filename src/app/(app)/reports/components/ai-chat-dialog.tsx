
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
import { BrainCircuit, Loader2, Send, User, Bot } from "lucide-react";
// Removed direct import of chatWithReportAction, will be passed as a prop

interface AiChatDialogProps {
  reportIdOrContextKey: string; // Used as a key for chat history or general context
  dialogTitle: string;
  initialContextOrPrompt: string; // For reports, this is originalContent. For 'isms', general prompt.
  triggerButtonText?: string;
  onSendMessageAction: (
    userInput: string, 
    context: string // This will be initialContextOrPrompt for report-chat, or topicContext for ism-chat
  ) => Promise<{ aiResponse: string; sourcesCited?: string[] } | { error: string }>;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: string[];
}

export function AiChatDialog({
  reportIdOrContextKey,
  dialogTitle,
  initialContextOrPrompt,
  triggerButtonText = "Examine with AI",
  onSendMessageAction,
}: AiChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, startTransition] = useTransition();
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


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, sender: "user", text: inputValue };
    setChatMessages((prev) => [...prev, userMessage]);
    const currentQuestion = inputValue;
    setInputValue("");

    startTransition(async () => {
      try {
        // The `initialContextOrPrompt` is passed as the `context` argument to onSendMessageAction.
        // For 'isms' chat, `initialContextOrPrompt` might be a general topic name or instruction.
        // For report chat, it's the report content.
        const result = await onSendMessageAction(currentQuestion, initialContextOrPrompt);

        if (result && "error" in result) {
          toast({
            title: "AI Chat Error",
            description: result.error,
            variant: "destructive",
          });
          const errorMessage: ChatMessage = { id: `${Date.now()}-error`, sender: 'ai', text: `Error: ${result.error}`};
          setChatMessages(prev => [...prev, errorMessage]);
        } else if (result && result.aiResponse) {
          const aiMessage: ChatMessage = { 
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
           const errorMessage: ChatMessage = { id: `${Date.now()}-no-response`, sender: 'ai', text: 'Sorry, I could not generate a response.'};
           setChatMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
          title: "AI Chat Failed",
          description: errorMsg,
          variant: "destructive",
        });
        const errorMessage: ChatMessage = { id: `${Date.now()}-catch`, sender: 'ai', text: `Failed to get response: ${errorMsg}`};
        setChatMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
        // Optionally add a default greeting or instruction when dialog opens
        if (chatMessages.length === 0) {
            setChatMessages([{
                id: 'initial-greeting',
                sender: 'ai',
                text: `Hello! How can I help you understand "${dialogTitle}" based on KJV 1611 principles today?`
            }]);
        }
    }
    // if (!open) {
        // Optionally reset chat when dialog is closed
        // setChatMessages([]); 
        // setInputValue("");
    // }
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
            {chatMessages.map((message) => (
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
                      <p className="text-xs font-semibold">Sources Consulted (Simulated):</p>
                      <ul className="list-disc list-inside text-xs">
                        {message.sources.map((source, idx) => (
                          <li key={idx}><a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">{source}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                 <span className="flex-shrink-0 p-2 bg-accent rounded-full">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </span>
                )}
              </div>
            ))}
             {isLoading && (
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

        <DialogFooter className="p-6 pt-2 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              id={`chat-input-${reportIdOrContextKey}`} // Make ID unique if multiple dialogs can exist
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    