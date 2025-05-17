// src/app/(app)/learning/report-fallacy-quiz/[reportId]/components/report-fallacy-quiz-client.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, RotateCcw, Lightbulb } from "lucide-react";
import { generateQuizQuestionAction } from "../../../../learning/fallacy-quiz/actions"; // Re-use general action
import type { FallacyQuizQuestion } from "@/ai/flows/generate-fallacy-quiz-question-flow";

interface ReportFallacyQuizClientProps {
  reportId: string;
  uniqueFallacyTypes: string[];
}

interface QuizAnswer {
  questionData: FallacyQuizQuestion;
  selectedOptionId: string | null;
  isCorrect: boolean;
}

const QUIZ_DIFFICULTY = 'intermediate'; // Or make this configurable

export function ReportFallacyQuizClient({ reportId, uniqueFallacyTypes }: ReportFallacyQuizClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [quizQuestions, setQuizQuestions] = useState<FallacyQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [quizMode, setQuizMode] = useState<"loading" | "quizzing" | "results">("loading");

  useEffect(() => {
    const fetchAllQuestions = async () => {
      if (uniqueFallacyTypes.length === 0) {
        setIsLoadingQuestions(false);
        setQuizMode("results"); // Or some other state indicating no questions
        return;
      }
      
      setIsLoadingQuestions(true);
      setQuizMode("loading");
      const generatedQuestions: FallacyQuizQuestion[] = [];

      for (const fallacyType of uniqueFallacyTypes) {
        // Fetch one question per unique fallacy type
        const result = await generateQuizQuestionAction({ difficulty: QUIZ_DIFFICULTY, specificFallacy: fallacyType });
        if (result.success && result.data) {
          generatedQuestions.push(result.data);
        } else {
          toast({
            title: "Error Generating Question",
            description: `Could not generate a question for fallacy: ${fallacyType}. ${result.error || ""}`,
            variant: "destructive"
          });
        }
      }
      
      // Shuffle questions if desired, or present them in order of fallacy types
      setQuizQuestions(generatedQuestions);
      setIsLoadingQuestions(false);
      if (generatedQuestions.length > 0) {
        setQuizMode("quizzing");
      } else {
        setQuizMode("results"); // No questions could be generated
        toast({title: "No Quiz Questions", description: "Could not generate any quiz questions for the fallacies in this report.", variant: "default"});
      }
    };

    startTransition(fetchAllQuestions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueFallacyTypes, reportId]); // Only re-run if these key identifiers change

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) return;
    
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    setIsAnswerSubmitted(true);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast({ title: "Correct!", description: "Well done!", className: "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400" });
    } else {
      const correctAnswerText = currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId)?.text;
      toast({ title: "Incorrect", description: `Correct: "${correctAnswerText}"`, variant: "destructive" });
    }
    setQuizAnswers(prev => [...prev, { questionData: currentQuestion, selectedOptionId, isCorrect }]);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswerSubmitted(false);
      setSelectedOptionId(null);
    } else {
      setQuizMode("results");
    }
  };

  const resetQuiz = () => {
    // This implies re-fetching questions for the same report.
    // To simply restart the *current* set of fetched questions:
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizAnswers([]);
    setQuizMode("quizzing");
    if (quizQuestions.length === 0 && !isLoadingQuestions) { // If initial load failed to get questions
        startTransition(async () => { // Re-attempt fetching
            const generatedQuestions: FallacyQuizQuestion[] = [];
             for (const fallacyType of uniqueFallacyTypes) {
                const result = await generateQuizQuestionAction({ difficulty: QUIZ_DIFFICULTY, specificFallacy: fallacyType });
                if (result.success && result.data) generatedQuestions.push(result.data);
             }
            setQuizQuestions(generatedQuestions);
            setIsLoadingQuestions(false);
            if (generatedQuestions.length > 0) setQuizMode("quizzing");
            else {
                 setQuizMode("results");
                 toast({title: "No Quiz Questions", description: "Still couldn't generate questions for this report.", variant: "default"});
            }
        });
    }
  };

  if (quizMode === "loading" || isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating personalized quiz questions based on your report...</p>
        <p className="text-xs text-muted-foreground">(This may take a moment for each fallacy type)</p>
      </div>
    );
  }

  if (quizMode === "quizzing" && currentQuestion) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Question {currentQuestionIndex + 1} of {quizQuestions.length}</CardTitle>
          <CardDescription>Fallacy related to: <span className="font-medium text-foreground">{currentQuestion.fallacyCommitted || "General"}</span>. Score: {score}/{currentQuestionIndex}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold text-base whitespace-pre-wrap">{currentQuestion.questionText}</p>
          <RadioGroup
            value={selectedOptionId || undefined}
            onValueChange={setSelectedOptionId}
            disabled={isAnswerSubmitted || isPending}
          >
            {currentQuestion.options.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                <Label htmlFor={`option-${option.id}`} className={`flex-1 p-3 rounded-md border cursor-pointer transition-colors 
                  ${isAnswerSubmitted && option.id === currentQuestion.correctOptionId ? 'bg-green-100 dark:bg-green-800 border-green-500' : ''}
                  ${isAnswerSubmitted && option.id === selectedOptionId && option.id !== currentQuestion.correctOptionId ? 'bg-red-100 dark:bg-red-800 border-red-500 line-through' : ''}
                  ${!isAnswerSubmitted && selectedOptionId === option.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}>
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {isAnswerSubmitted && (
            <Alert className={selectedOptionId === currentQuestion.correctOptionId ? "border-green-500" : "border-destructive"}>
              {selectedOptionId === currentQuestion.correctOptionId ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
              <AlertTitle>{selectedOptionId === currentQuestion.correctOptionId ? "Correct!" : "Incorrect"}</AlertTitle>
              <AlertDescription className="text-xs prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap">
                {currentQuestion.explanation}
                {currentQuestion.fallacyCommitted && <p className="mt-1"><strong>Fallacy:</strong> {currentQuestion.fallacyCommitted}</p>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          {!isAnswerSubmitted ? (
            <Button onClick={handleSubmitAnswer} disabled={!selectedOptionId || isPending || isLoadingQuestions}>Submit Answer</Button>
          ) : (
            <Button onClick={handleNextQuizQuestion} disabled={isPending || isLoadingQuestions}>
              {currentQuestionIndex >= quizQuestions.length - 1 ? "View Results" : "Next Question"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }
  
  if (quizMode === "results") {
     return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Personalized Quiz Complete!</CardTitle>
          <CardDescription>You scored {score} out of {quizQuestions.length || uniqueFallacyTypes.length} questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizQuestions.length > 0 && quizAnswers.length > 0 ? (
            <>
              <h3 className="font-semibold">Review Your Answers:</h3>
              <ScrollArea className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {quizAnswers.map((ans, index) => (
                  <div key={index} className={`p-3 border rounded-md ${ans.isCorrect ? 'border-green-400 bg-green-500/10' : 'border-red-400 bg-red-500/10'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">Q: {ans.questionData.questionText}</p>
                    <p className={`text-xs mt-1 ${ans.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      Your answer: {ans.questionData.options.find(o => o.id === ans.selectedOptionId)?.text || "Not answered"}
                      {ans.isCorrect ? <CheckCircle2 className="inline h-4 w-4 ml-1"/> : <XCircle className="inline h-4 w-4 ml-1"/>}
                    </p>
                    {!ans.isCorrect && (
                       <p className="text-xs text-muted-foreground">Correct: {ans.questionData.options.find(o => o.id === ans.questionData.correctOptionId)?.text}</p>
                    )}
                    <p className="text-xs mt-1 text-muted-foreground prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap">Explanation: {ans.questionData.explanation}</p>
                  </div>
                ))}
              </ScrollArea>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {uniqueFallacyTypes.length === 0 ? "No fallacies were found in this report to quiz on." : "Could not generate questions for this quiz."}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <Button onClick={resetQuiz} variant="outline" size="lg" disabled={isLoadingQuestions || isPending || uniqueFallacyTypes.length === 0}>
            <RotateCcw className="mr-2" /> Try Quiz Again
          </Button>
           <Button asChild size="lg">
            <Link href="/learning/fallacy-quiz">Try General Fallacy Quiz</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <p className="text-center text-muted-foreground py-10">Setting up your personalized quiz...</p>;
}

