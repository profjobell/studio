
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Added for text input
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, CheckCircle2, XCircle, Repeat, BookOpen, Brain, Search, ArrowLeft } from "lucide-react"; // Added Search, ArrowLeft
import { useToast } from "@/hooks/use-toast"; // Added useToast

interface Question {
  id: string;
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  type: "fill-in" | "multiple-choice"; // Type of question
  relatedVerseRef: string;
}

interface ScriptureItem {
  id: string;
  reference: string;
  text: string;
  questions: Question[];
}

interface Theme {
  id: string;
  name: string;
  description: string;
  scriptures: ScriptureItem[];
}

// KJV Only - Sample Data
const KJV_THEMES_DATA: Theme[] = [
  {
    id: "creation",
    name: "Creation",
    description: "Verses about God's creation of the heavens and the earth.",
    scriptures: [
      {
        id: "gen1_1",
        reference: "Genesis 1:1",
        text: "In the beginning God created the heaven and the earth.",
        questions: [
          { id: "q1_1", relatedVerseRef: "Genesis 1:1", questionText: "Fill in the blank: 'In the beginning God ______ the heaven and the earth.'", correctAnswer: "created", type: "fill-in" },
          { id: "q1_2", relatedVerseRef: "Genesis 1:1", questionText: "Who created the heaven and the earth?", correctAnswer: "God", type: "fill-in" },
        ],
      },
      {
        id: "john1_3",
        reference: "John 1:3",
        text: "All things were made by him; and without him was not any thing made that was made.",
        questions: [
          { id: "q2_1", relatedVerseRef: "John 1:3", questionText: "According to John 1:3, who made all things?", correctAnswer: "Him (Jesus/God)", type: "fill-in" },
          { id: "q2_2", relatedVerseRef: "John 1:3", questionText: "Was anything made without Him?", correctAnswer: "No", type: "multiple-choice", options: ["Yes", "No", "Some things"] },
        ],
      },
      {
        id: "col1_16",
        reference: "Colossians 1:16",
        text: "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:",
        questions: [
          { id: "q3_1", relatedVerseRef: "Colossians 1:16", questionText: "Things in heaven and earth were created by Him and ___ Him.", correctAnswer: "for", type: "fill-in" },
        ],
      },
      {
        id: "ps19_1",
        reference: "Psalm 19:1",
        text: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
        questions: [
          { id: "q4_1", relatedVerseRef: "Psalm 19:1", questionText: "What do the heavens declare?", correctAnswer: "The glory of God", type: "fill-in" },
        ],
      },
    ],
  },
  {
    id: "sin",
    name: "Sin",
    description: "Verses about the nature and consequences of sin.",
    scriptures: [
      {
        id: "rom3_23",
        reference: "Romans 3:23",
        text: "For all have sinned, and come short of the glory of God;",
        questions: [
          { id: "q5_1", relatedVerseRef: "Romans 3:23", questionText: "Who has sinned according to Romans 3:23?", correctAnswer: "all", type: "fill-in" },
        ],
      },
      {
        id: "rom6_23",
        reference: "Romans 6:23",
        text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
        questions: [
          { id: "q6_1", relatedVerseRef: "Romans 6:23", questionText: "What are the wages of sin?", correctAnswer: "death", type: "fill-in" },
          { id: "q6_2", relatedVerseRef: "Romans 6:23", questionText: "What is the gift of God?", correctAnswer: "eternal life", type: "fill-in" },
        ],
      },
    ],
  },
  // Add more themes and scriptures here as per the full spec
];

const MEMORIZATION_SUGGESTIONS = [
  "Read the verse aloud multiple times.",
  "Write the verse down from memory.",
  "Break the verse into smaller phrases.",
  "Visualize the meaning of the verse.",
  "Associate the verse with a tune or rhythm.",
  "Review previously learned verses regularly.",
  "Teach the verse to someone else.",
  "Pray the verse.",
];

const VERSES_PER_SET = 7; 

export function ScriptureMemoryTool() {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeInput, setThemeInput] = useState(""); // State for text input
  const { toast } = useToast(); // Toast for notifications

  const [verseSet, setVerseSet] = useState<ScriptureItem[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showVerseText, setShowVerseText] = useState(false);

  const [mode, setMode] = useState<"review" | "quiz" | "results">("review");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answersFeedback, setAnswersFeedback] = useState<Array<{ questionText: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }>>([]);
  const [score, setScore] = useState(0);

  const selectedTheme = useMemo(() => KJV_THEMES_DATA.find(t => t.id === selectedThemeId), [selectedThemeId]);

  useEffect(() => {
    if (selectedTheme) {
      const allScriptures = selectedTheme.scriptures;
      const sessionScriptures = allScriptures.slice(0, 21); 
      setVerseSet(sessionScriptures); // Set verseSet here
      startReviewPhase(sessionScriptures);
    } else {
      setVerseSet([]); // Clear verseSet if no theme is selected
      setMode("review"); // Default to review mode (which will show theme selection)
    }
  }, [selectedTheme]);

  const startReviewPhase = (scriptures: ScriptureItem[]) => {
    setMode("review");
    setVerseSet(scriptures); // Ensure verseSet is correctly populated for review
    setCurrentVerseIndex(0);
    setShowVerseText(false);
    setQuizQuestions([]);
    setAnswersFeedback([]);
    setScore(0);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const handleThemeTextSearch = () => {
    if (!themeInput.trim()) return;
    const searchTerm = themeInput.trim().toLowerCase();
    const foundTheme = KJV_THEMES_DATA.find(
      (theme) =>
        theme.name.toLowerCase().includes(searchTerm) ||
        theme.description.toLowerCase().includes(searchTerm) ||
        theme.id.toLowerCase() === searchTerm
    );
    if (foundTheme) {
      setSelectedThemeId(foundTheme.id);
      setThemeInput(""); // Clear input after successful search
    } else {
      toast({
        title: "Theme Not Found",
        description: "The entered theme was not found in the predefined list. Full KJV search by keyword is a future enhancement.",
        variant: "default",
      });
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < verseSet.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
      setShowVerseText(false);
    } else {
      prepareQuizForSet();
    }
  };

  const handlePreviousVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
      setShowVerseText(false);
    }
  };
  
  const prepareQuizForSet = () => {
    if (verseSet.length === 0) return; // Don't start quiz if no verses
    const questionsForQuiz = verseSet.flatMap(scripture => scripture.questions.map(q => ({...q, relatedVerseRef: scripture.reference})));
    setQuizQuestions(questionsForQuiz.slice(0, Math.min(questionsForQuiz.length, VERSES_PER_SET * 3))); 
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setAnswersFeedback([]);
    setScore(0);
    setMode("quiz");
  };

  const handleAnswerSubmit = () => {
    if (!quizQuestions.length) return;
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnswersFeedback(prev => [
      ...prev,
      { questionText: currentQuestion.questionText, userAnswer: userAnswer.trim(), correctAnswer: currentQuestion.correctAnswer, isCorrect },
    ]);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer("");
    } else {
      setMode("results");
    }
  };
  
  const restartCurrentSet = () => {
      if(verseSet.length > 0) {
        startReviewPhase(verseSet);
      } else if (selectedTheme) {
        // This case handles if verseSet became empty but a theme was still logically selected
        startReviewPhase(selectedTheme.scriptures.slice(0,21));
      }
  };

  const renderReviewMode = () => {
    if (!verseSet.length || !selectedTheme) return null; // Don't render if no verse set
    const verse = verseSet[currentVerseIndex];
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Review Verse: {verse.reference} ({currentVerseIndex + 1}/{verseSet.length})
          </CardTitle>
          <Progress value={((currentVerseIndex + 1) / verseSet.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="min-h-[150px] flex flex-col justify-center items-center text-center">
          {!showVerseText ? (
            <Button onClick={() => setShowVerseText(true)} variant="outline" size="lg">
              Show Verse Text
            </Button>
          ) : (
            <p className="text-lg md:text-xl p-4 bg-muted rounded-md">{verse.text}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handlePreviousVerse} variant="outline" disabled={currentVerseIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4"/> Previous
            </Button>
            <Button onClick={() => setShowVerseText(false)} variant="ghost" disabled={!showVerseText} className="flex-grow sm:flex-grow-0">
              Hide Verse
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={restartCurrentSet} variant="outline" className="flex-grow sm:flex-grow-0">
              <Repeat className="mr-2 h-4 w-4"/> Restart Set
            </Button>
            <Button onClick={handleNextVerse} className="bg-primary hover:bg-primary/90 flex-grow sm:flex-grow-0">
              {currentVerseIndex === verseSet.length - 1 ? "Start Quiz" : "Next Verse"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderQuizMode = () => {
    if (!quizQuestions.length || !selectedTheme) return null; // Don't render if no questions or theme
    const question = quizQuestions[currentQuestionIndex];
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
             <Brain className="h-6 w-6 text-primary" />
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Related to: {question.relatedVerseRef}</p>
          <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-md font-semibold">{question.questionText}</p>
          {question.type === "fill-in" && (
            <Input 
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Your answer..."
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnswerSubmit(); }}
            />
          )}
          {question.type === "multiple-choice" && question.options && (
            <div className="space-y-2">
              {question.options.map(option => (
                <Button
                  key={option}
                  variant={userAnswer === option ? "default" : "outline"}
                  onClick={() => setUserAnswer(option)}
                  className="w-full justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
           <Button onClick={restartCurrentSet} variant="outline">
            <Repeat className="mr-2 h-4 w-4"/> Restart This Set
          </Button>
          <Button onClick={handleAnswerSubmit} disabled={!userAnswer.trim()} className="bg-primary hover:bg-primary/90">
            {currentQuestionIndex === quizQuestions.length - 1 ? "Show Results" : "Next Question"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderResultsMode = () => {
     if (!selectedTheme) return null; // Don't render if no theme context for results
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Quiz Results
          </CardTitle>
          <CardDescription>
            You scored {score} out of {quizQuestions.length} ({quizQuestions.length > 0 ? ((score / quizQuestions.length) * 100).toFixed(0) : 0}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Your Answers:</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {answersFeedback.map((fb, index) => (
                <li key={index} className={`p-2 rounded-md border ${fb.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                  <p className="text-sm font-medium">{fb.questionText}</p>
                  <p className={`text-xs ${fb.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    Your answer: {fb.userAnswer} {fb.isCorrect ? <CheckCircle2 className="inline h-4 w-4 ml-1" /> : <XCircle className="inline h-4 w-4 ml-1" />}
                  </p>
                  {!fb.isCorrect && <p className="text-xs text-muted-foreground">Correct answer: {fb.correctAnswer}</p>}
                </li>
              ))}
            </ul>
          </div>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Memorization Tips</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-xs">
                {MEMORIZATION_SUGGESTIONS.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
          <Button onClick={restartCurrentSet} variant="outline">
            <Repeat className="mr-2 h-4 w-4"/> Review Same Set Again
          </Button>
          <Button onClick={() => setSelectedThemeId(null)} className="bg-primary hover:bg-primary/90">
            Choose New Theme
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {!selectedThemeId && (
        <Card className="shadow-md p-6">
          <CardTitle className="mb-4 text-xl">Select a Theme to Begin</CardTitle>
          <div className="space-y-2 mb-4">
            <label htmlFor="theme-select" className="block text-sm font-medium text-foreground">Choose from list:</label>
            <Select onValueChange={handleThemeChange} value={selectedThemeId || undefined}>
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue placeholder="Choose a predefined theme..." />
              </SelectTrigger>
              <SelectContent>
                {KJV_THEMES_DATA.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>{theme.name} - <span className="text-xs text-muted-foreground">{theme.description}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
             <label htmlFor="theme-text-input" className="block text-sm font-medium text-foreground">Or search theme by keyword:</label>
            <div className="flex gap-2">
              <Input 
                id="theme-text-input"
                placeholder="e.g., Creation, Sin..." 
                value={themeInput} 
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleThemeTextSearch(); }}
                className="flex-grow"
              />
              <Button onClick={handleThemeTextSearch} variant="outline">
                <Search className="mr-2 h-4 w-4"/> Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Note: Text search currently looks through predefined themes. Full KJV keyword search is a future enhancement.</p>
          </div>
        </Card>
      )}

      {selectedThemeId && mode === "review" && renderReviewMode()}
      {selectedThemeId && mode === "quiz" && renderQuizMode()}
      {selectedThemeId && mode === "results" && renderResultsMode()}

      {selectedThemeId && (
         <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setSelectedThemeId(null)}>
              Back to Theme Selection
            </Button>
        </div>
      )}
    </div>
  );
}

