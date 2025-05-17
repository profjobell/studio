
"use client";

import { useState, useTransition, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb, HelpCircle, CheckCircle2, XCircle, RotateCcw, BookOpen, Brain } from "lucide-react";
import { getFallacyExplanationAction, generateQuizQuestionAction } from "../actions";
import type { ExplainFallacyOutput } from "@/ai/flows/explain-fallacy-flow";
import type { FallacyQuizQuestion } from "@/ai/flows/generate-fallacy-quiz-question-flow";

const COMMON_FALLACIES = [
  "Ad Hominem", "Straw Man", "Appeal to Authority", "Slippery Slope",
  "False Dilemma", "Circular Reasoning", "Hasty Generalization",
  "Appeal to Ignorance", "Red Herring", "Appeal to Emotion", "Tu Quoque",
  "No True Scotsman", "Genetic Fallacy", "Bandwagon Fallacy", "Argument from Silence"
];

const QUIZ_LENGTH = 5;

export function FallacyQuizClient() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"idle" | "tutoring" | "quizzing" | "result">("idle");
  
  const [fallacyToExplain, setFallacyToExplain] = useState(COMMON_FALLACIES[0]);
  const [customFallacyInput, setCustomFallacyInput] = useState("");
  const [explanation, setExplanation] = useState<ExplainFallacyOutput | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<FallacyQuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [quizAnswers, setQuizAnswers] = useState<Array<{ question: FallacyQuizQuestion, selectedOptionId: string | null, isCorrect: boolean }>>([]);


  const handleExplainFallacy = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const name = customFallacyInput.trim() || fallacyToExplain;
    if (!name) {
      toast({ title: "Input Error", description: "Please enter a fallacy name or select one.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      setMode("tutoring");
      setExplanation(null); // Clear previous explanation while loading
      const result = await getFallacyExplanationAction({ fallacyName: name });
      if (result.success && result.data) {
        setExplanation(result.data);
      } else {
        toast({ title: "Error", description: result.error || "Failed to fetch explanation.", variant: "destructive" });
        // setMode("idle"); // Or stay in tutoring with error message
      }
    });
  };

  const handleStartQuiz = () => {
    setMode("quizzing");
    setScore(0);
    setQuestionsAttempted(0);
    setQuizAnswers([]);
    fetchNextQuestion();
  };

  const fetchNextQuestion = () => {
    startTransition(async () => {
      setIsAnswerSubmitted(false);
      setSelectedOptionId(null);
      setCurrentQuestion(null);
      const result = await generateQuizQuestionAction({ difficulty: quizDifficulty });
      if (result.success && result.data) {
        setCurrentQuestion(result.data);
      } else {
        toast({ title: "Error", description: result.error || "Failed to fetch question.", variant: "destructive" });
        setMode("idle");
      }
    });
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) return;
    
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    setIsAnswerSubmitted(true);
    setQuestionsAttempted(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast({ title: "Correct!", description: "Well done!", className: "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400" });
    } else {
      const correctAnswerText = currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId)?.text;
      toast({ title: "Incorrect", description: `The correct answer was: "${correctAnswerText}"`, variant: "destructive" });
    }
    setQuizAnswers(prev => [...prev, { question: currentQuestion, selectedOptionId, isCorrect }]);
  };

  const handleNextQuizQuestion = () => {
    if (questionsAttempted >= QUIZ_LENGTH) {
      setMode("result");
    } else {
      fetchNextQuestion();
    }
  };

  const resetQuiz = () => {
    setMode("idle");
    setScore(0);
    setQuestionsAttempted(0);
    setExplanation(null);
    setCurrentQuestion(null);
    setIsAnswerSubmitted(false);
    setSelectedOptionId(null);
    setQuizAnswers([]);
  }

  const renderIdleMode = () => (
    <div className="space-y-6 text-center">
      <p className="text-muted-foreground">
        Choose an option below to learn about logical fallacies or test your knowledge.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => setMode("tutoring")} size="lg" variant="outline">
          <BookOpen className="mr-2" /> Fallacy Tutor
        </Button>
        <Button onClick={handleStartQuiz} size="lg">
          <Brain className="mr-2" /> Start Quiz
        </Button>
      </div>
    </div>
  );

  const renderTutoringMode = () => (
    <div className="space-y-6">
      <form onSubmit={handleExplainFallacy} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="fallacySelect">Select a Common Fallacy</Label>
            <Select value={fallacyToExplain} onValueChange={setFallacyToExplain}>
              <SelectTrigger id="fallacySelect">
                <SelectValue placeholder="Select a fallacy" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_FALLACIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="customFallacy">Or Enter Fallacy Name</Label>
            <Input 
              id="customFallacy"
              placeholder="e.g., Appeal to Pity"
              value={customFallacyInput}
              onChange={e => setCustomFallacyInput(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending && !explanation ? <Loader2 className="mr-2 animate-spin"/> : <Lightbulb className="mr-2" />}
          Explain Fallacy
        </Button>
      </form>

      {isPending && !explanation && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading explanation...</p>
        </div>
      )}

      {explanation && (
        <Card className="mt-4 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">{explanation.fallacyName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm prose prose-sm dark:prose-invert max-w-none">
            <div><strong>Explanation:</strong> <p className="whitespace-pre-wrap">{explanation.explanation}</p></div>
            <div><strong>Examples:</strong> 
              <ul className="list-disc pl-5">
                {explanation.examples.map((ex, i) => <li key={i} className="whitespace-pre-wrap">{ex}</li>)}
              </ul>
            </div>
            <div><strong>How to Spot:</strong> <p className="whitespace-pre-wrap">{explanation.howToSpot}</p></div>
            <div><strong>How to Counter:</strong> <p className="whitespace-pre-wrap">{explanation.howToCounter}</p></div>
          </CardContent>
        </Card>
      )}
       <Button onClick={() => setMode("idle")} variant="outline" className="mt-4">Back to Options</Button>
    </div>
  );

  const renderQuizzingMode = () => {
    if (isPending && !currentQuestion) {
      return <div className="flex items-center justify-center py-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Loading question...</p></div>;
    }
    if (!currentQuestion) {
      return <p className="text-center text-muted-foreground py-10">No question loaded. Try starting again.</p>;
    }

    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Question {questionsAttempted + 1} of {QUIZ_LENGTH}</CardTitle>
          <CardDescription>Difficulty: <span className="capitalize">{quizDifficulty}</span>. Score: {score}/{questionsAttempted}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold text-base whitespace-pre-wrap">{currentQuestion.questionText}</p>
          <RadioGroup
            value={selectedOptionId || undefined}
            onValueChange={setSelectedOptionId}
            disabled={isAnswerSubmitted}
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
          <Button onClick={() => setMode("idle")} variant="outline" disabled={isPending && currentQuestion !== null}>Exit Quiz</Button>
          {!isAnswerSubmitted ? (
            <Button onClick={handleSubmitAnswer} disabled={!selectedOptionId || isPending}>Submit Answer</Button>
          ) : (
            <Button onClick={handleNextQuizQuestion} disabled={isPending}>
              {questionsAttempted >= QUIZ_LENGTH ? "View Results" : "Next Question"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderResultMode = () => (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Quiz Complete!</CardTitle>
        <CardDescription>You scored {score} out of {QUIZ_LENGTH} questions on {quizDifficulty} difficulty.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="font-semibold">Review Your Answers:</h3>
        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
          {quizAnswers.map((ans, index) => (
            <div key={index} className={`p-3 border rounded-md ${ans.isCorrect ? 'border-green-400 bg-green-500/10' : 'border-red-400 bg-red-500/10'}`}>
              <p className="text-sm font-medium whitespace-pre-wrap">Q: {ans.question.questionText}</p>
              <p className={`text-xs mt-1 ${ans.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                Your answer: {ans.question.options.find(o => o.id === ans.selectedOptionId)?.text || "Not answered"}
                {ans.isCorrect ? <CheckCircle2 className="inline h-4 w-4 ml-1"/> : <XCircle className="inline h-4 w-4 ml-1"/>}
              </p>
              {!ans.isCorrect && (
                 <p className="text-xs text-muted-foreground">Correct: {ans.question.options.find(o => o.id === ans.question.correctOptionId)?.text}</p>
              )}
              <p className="text-xs mt-1 text-muted-foreground prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap">Explanation: {ans.question.explanation}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
        <Button onClick={resetQuiz} variant="outline" size="lg">
          <RotateCcw className="mr-2" /> Try Another Quiz / Tutor
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      {mode === "idle" && renderIdleMode()}
      {mode === "tutoring" && renderTutoringMode()}
      {mode === "quizzing" && renderQuizzingMode()}
      {mode === "result" && renderResultMode()}

      {mode !== "idle" && mode !== "result" && (
        <div className="mt-6 flex justify-center">
            <Select value={quizDifficulty} onValueChange={(value) => setQuizDifficulty(value as any)} disabled={mode === "quizzing" || (isPending && currentQuestion !== null)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
        </div>
      )}
    </div>
  );
}
