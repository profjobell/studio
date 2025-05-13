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
import { chatWithReportAction } from "../actions"; 
import type { ChatWithReportInput, ChatWithReportOutput } from "@/ai/flows/chat-with-report-flow";

interface AiChatDialogProps {
  reportId: string;
  reportTitle: string;
  initialContext: string;
  triggerButtonText?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export function AiChatDialog({
  reportId,
  reportTitle,
  initialContext,
  triggerButtonText = "Examine with AI",
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

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: "user", text: inputValue };
    setChatMessages((prev) => [...prev, userMessage]);
    const currentQuestion = inputValue;
    setInputValue("");

    startTransition(async () => {
      try {
        const chatInput: ChatWithReportInput = {
          reportContext: initialContext,
          userQuestion: currentQuestion,
        };
        const result = await chatWithReportAction(chatInput);

        if (result && "error" in result) {
          toast({
            title: "AI Chat Error",
            description: result.error,
            variant: "destructive",
          });
          const errorMessage: ChatMessage = { id: Date.now().toString() + '-error', sender: 'ai', text: `Error: ${result.error}`};
          setChatMessages(prev => [...prev, errorMessage]);
        } else if (result && result.aiResponse) {
          const aiMessage: ChatMessage = { id: Date.now().toString() + '-ai', sender: "ai", text: result.aiResponse };
          setChatMessages((prev) => [...prev, aiMessage]);
        } else {
          toast({
            title: "AI Chat Error",
            description: "Received no response from AI.",
            variant: "destructive",
          });
           const errorMessage: ChatMessage = { id: Date.now().toString() + '-no-response', sender: 'ai', text: 'Sorry, I could not generate a response.'};
           setChatMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
          title: "AI Chat Failed",
          description: errorMsg,
          variant: "destructive",
        });
        const errorMessage: ChatMessage = { id: Date.now().toString() + '-catch', sender: 'ai', text: `Failed to get response: ${errorMsg}`};
        setChatMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        // Optionally reset chat when dialog is closed
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
            Deep Examination: {reportTitle}
          </DialogTitle>
          <DialogDescription>
            Ask questions about the report content. The AI will answer based on the provided text.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <Bot size={48} className="mx-auto mb-2"/>
                    <p>Ask a question about the report to start the conversation.</p>
                </div>
            )}
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
                  className={`p-3 rounded-lg max-w-[75%] ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
              id="chat-input"
              placeholder="Ask a question about the report..."
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
