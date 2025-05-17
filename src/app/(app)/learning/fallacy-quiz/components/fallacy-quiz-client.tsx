
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb, HelpCircle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { getFallacyExplanationAction, generateQuizQuestionAction } from "../actions";
import type { ExplainFallacyOutput, FallacyQuizQuestion } from "@/ai/flows/explain-fallacy-flow"; // Re-using ExplainFallacyOutput type is fine. Need FallacyQuizQuestion type.

// Assuming FallacyQuizQuestion type is correctly defined in generate-fallacy-quiz-question-flow.ts
// If not, define it here or import from the correct location.
// type FallacyQuizQuestion = Awaited<ReturnType<typeof generateQuizQuestionAction>>['data']

const COMMON_FALLACIES = [
  "Ad Hominem", "Straw Man", "Appeal to Authority", "Slippery Slope",
  "False Dilemma", "Circular Reasoning", "Hasty Generalization",
  "Appeal to Ignorance", "Red Herring", "Appeal to Emotion", "Tu Quoque",
  "No True Scotsman", "Genetic Fallacy", "Bandwagon Fallacy"
];

export function FallacyQuizClient() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"idle" | "tutoring" | "quizzing" | "result">("idle");
  
  // Tutoring state
  const [fallacyToExplain, setFallacyToExplain] = useState("");
  const [explanation, setExplanation] = useState<ExplainFallacyOutput | null>(null);

  // Quizzing state
  const [currentQuestion, setCurrentQuestion] = useState<FallacyQuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const handleExplainFallacy = (fallacyName?: string) => {
    const name = fallacyName || fallacyToExplain;
    if (!name.trim() && !fallacyName) { // If nothing is selected and input is empty
      toast({ title: "Input Error", description: "Please enter a fallacy name or select one.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      setMode("tutoring");
      setExplanation(null);
      const result = await getFallacyExplanationAction({ fallacyName: name });
      if (result.success && result.data) {
        setExplanation(result.data);
      } else {
        toast({ title: "Error", description: result.error || "Failed to fetch explanation.", variant: "destructive" });
        setMode("idle");
      }
    });
  };

  const handleStartQuiz = () => {
    setMode("quizzing");
    setScore(0);
    setQuestionsAttempted(0);
    fetchNextQuestion();
  };

  const fetchNextQuestion = () =<ctrl63>