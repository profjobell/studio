
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, CheckCircle2, XCircle, Repeat, BookOpen, Brain, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  type: "fill-in" | "multiple-choice"; // Type of question
  relatedVerseRef: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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

const QUIZ_QUESTION_COUNT = 7;

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
          { id: "q_gen1_1_1", relatedVerseRef: "Genesis 1:1", questionText: "Fill in the blank: 'In the beginning God ______ the heaven and the earth.'", correctAnswer: "created", type: "fill-in", difficulty: "beginner" },
          { id: "q_gen1_1_2", relatedVerseRef: "Genesis 1:1", questionText: "Who created the heaven and the earth?", correctAnswer: "God", type: "fill-in", difficulty: "beginner" },
        ],
      },
      {
        id: "john1_3",
        reference: "John 1:3",
        text: "All things were made by him; and without him was not any thing made that was made.",
        questions: [
          { id: "q_john1_3_1", relatedVerseRef: "John 1:3", questionText: "According to John 1:3, who made all things?", correctAnswer: "Him (Jesus/God)", type: "fill-in", difficulty: "intermediate" },
          { id: "q_john1_3_2", relatedVerseRef: "John 1:3", questionText: "Was anything made without Him?", correctAnswer: "No", type: "multiple-choice", options: ["Yes", "No", "Some things"], difficulty: "intermediate" },
        ],
      },
      {
        id: "col1_16",
        reference: "Colossians 1:16",
        text: "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:",
        questions: [
          { id: "q_col1_16_1", relatedVerseRef: "Colossians 1:16", questionText: "Things in heaven and earth were created by Him and ___ Him.", correctAnswer: "for", type: "fill-in", difficulty: "advanced" },
        ],
      },
      {
        id: "ps19_1",
        reference: "Psalm 19:1",
        text: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
        questions: [
          { id: "q_ps19_1_1", relatedVerseRef: "Psalm 19:1", questionText: "What do the heavens declare?", correctAnswer: "The glory of God", type: "fill-in", difficulty: "beginner" },
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
          { id: "q_rom3_23_1", relatedVerseRef: "Romans 3:23", questionText: "Who has sinned according to Romans 3:23?", correctAnswer: "all", type: "fill-in", difficulty: "beginner" },
        ],
      },
      {
        id: "rom6_23",
        reference: "Romans 6:23",
        text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
        questions: [
          { id: "q_rom6_23_1", relatedVerseRef: "Romans 6:23", questionText: "What are the wages of sin?", correctAnswer: "death", type: "fill-in", difficulty: "intermediate" },
          { id: "q_rom6_23_2", relatedVerseRef: "Romans 6:23", questionText: "What is the gift of God?", correctAnswer: "eternal life", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "abraham",
    name: "Abraham",
    description: "Key verses related to the life and faith of Abraham.",
    scriptures: [
      {
        id: "gen12_1",
        reference: "Genesis 12:1",
        text: "Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee:",
        questions: [
          { id: "q_gen12_1_1", relatedVerseRef: "Genesis 12:1", questionText: "What did the LORD tell Abram to leave?", correctAnswer: "His country, kindred, and father's house", type: "fill-in", difficulty: "beginner" },
        ],
      },
      {
        id: "rom4_3",
        reference: "Romans 4:3",
        text: "For what saith the scripture? Abraham believed God, and it was counted unto him for righteousness.",
        questions: [
          { id: "q_rom4_3_1", relatedVerseRef: "Romans 4:3", questionText: "What was counted to Abraham for righteousness?", correctAnswer: "He believed God", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "isaac",
    name: "Isaac",
    description: "Verses concerning Isaac, the son of Abraham.",
    scriptures: [
      {
        id: "gen21_12",
        reference: "Genesis 21:12",
        text: "And God said unto Abraham, Let it not be grievous in thy sight because of the lad, and because of thy bondwoman; in all that Sarah hath said unto thee, hearken unto her voice; for in Isaac shall thy seed be called.",
        questions: [
          { id: "q_gen21_12_1", relatedVerseRef: "Genesis 21:12", questionText: "In whom was Abraham's seed to be called?", correctAnswer: "Isaac", type: "fill-in", difficulty: "beginner" },
        ],
      },
    ],
  },
  {
    id: "jacob",
    name: "Jacob",
    description: "Key events and promises in the life of Jacob (Israel).",
    scriptures: [
      {
        id: "gen28_15",
        reference: "Genesis 28:15",
        text: "And, behold, I am with thee, and will keep thee in all places whither thou goest, and will bring thee again into this land; for I will not leave thee, until I have done that which I have spoken to thee of.",
        questions: [
          { id: "q_gen28_15_1", relatedVerseRef: "Genesis 28:15", questionText: "What did God promise Jacob regarding His presence?", correctAnswer: "I am with thee, and will keep thee", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "joseph",
    name: "Joseph",
    description: "The story of Joseph and God's providence.",
    scriptures: [
      {
        id: "gen50_20",
        reference: "Genesis 50:20",
        text: "But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.",
        questions: [
          { id: "q_gen50_20_1", relatedVerseRef: "Genesis 50:20", questionText: "What did Joseph say God meant for good?", correctAnswer: "The evil his brothers thought against him", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "israel_deliverance",
    name: "Israel (Deliverance)",
    description: "The deliverance of the children of Israel from Egypt.",
    scriptures: [
      {
        id: "ex14_13",
        reference: "Exodus 14:13",
        text: "And Moses said unto the people, Fear ye not, stand still, and see the salvation of the LORD, which he will shew to you to day: for the Egyptians whom ye have seen to day, ye shall see them again no more for ever.",
        questions: [
          { id: "q_ex14_13_1", relatedVerseRef: "Exodus 14:13", questionText: "What did Moses tell the people to do to see the LORD's salvation?", correctAnswer: "Fear not, stand still", type: "fill-in", difficulty: "beginner" },
        ],
      },
    ],
  },
  {
    id: "moses",
    name: "Moses",
    description: "Verses related to Moses, the lawgiver and leader.",
    scriptures: [
      {
        id: "deut34_10",
        reference: "Deuteronomy 34:10",
        text: "And there arose not a prophet since in Israel like unto Moses, whom the LORD knew face to face,",
        questions: [
          { id: "q_deut34_10_1", relatedVerseRef: "Deuteronomy 34:10", questionText: "How did the LORD know Moses?", correctAnswer: "face to face", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "joshua",
    name: "Joshua",
    description: "Joshua's leadership and the conquest of Canaan.",
    scriptures: [
      {
        id: "josh1_9",
        reference: "Joshua 1:9",
        text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
        questions: [
          { id: "q_josh1_9_1", relatedVerseRef: "Joshua 1:9", questionText: "What was Joshua commanded to be?", correctAnswer: "Strong and of a good courage", type: "fill-in", difficulty: "beginner" },
        ],
      },
    ],
  },
  {
    id: "saul",
    name: "Saul",
    description: "The reign of King Saul, Israel's first king.",
    scriptures: [
      {
        id: "1sam15_22",
        reference: "1 Samuel 15:22",
        text: "And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.",
        questions: [
          { id: "q_1sam15_22_1", relatedVerseRef: "1 Samuel 15:22", questionText: "According to Samuel, what is better than sacrifice?", correctAnswer: "To obey", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
  {
    id: "psalms",
    name: "The Psalms",
    description: "Selections from the book of Psalms.",
    scriptures: [
      {
        id: "ps23_1",
        reference: "Psalm 23:1",
        text: "The LORD is my shepherd; I shall not want.",
        questions: [
          { id: "q_ps23_1_1", relatedVerseRef: "Psalm 23:1", questionText: "Who is my shepherd, according to Psalm 23?", correctAnswer: "The LORD", type: "fill-in", difficulty: "beginner" },
        ],
      },
      {
        id: "ps119_105",
        reference: "Psalm 119:105",
        text: "Thy word is a lamp unto my feet, and a light unto my path.",
        questions: [
          { id: "q_ps119_105_1", relatedVerseRef: "Psalm 119:105", questionText: "What is a lamp unto my feet?", correctAnswer: "Thy word", type: "fill-in", difficulty: "beginner" },
        ],
      },
    ],
  },
  {
    id: "proverbs",
    name: "Proverbs",
    description: "Wisdom from the book of Proverbs.",
    scriptures: [
      {
        id: "prov3_5_6",
        reference: "Proverbs 3:5-6",
        text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
        questions: [
          { id: "q_prov3_5_6_1", relatedVerseRef: "Proverbs 3:5-6", questionText: "What should we not lean on?", correctAnswer: "Thine own understanding", type: "fill-in", difficulty: "intermediate" },
          { id: "q_prov3_5_6_2", relatedVerseRef: "Proverbs 3:5-6", questionText: "If we acknowledge Him in all our ways, what will He do?", correctAnswer: "Direct thy paths", type: "fill-in", difficulty: "intermediate" },
        ],
      },
    ],
  },
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

export function ScriptureMemoryTool() {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeInput, setThemeInput] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Question['difficulty']>('beginner');
  const { toast } = useToast();

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
      // For now, we use all scriptures in the theme for review. Quiz will filter by difficulty.
      setVerseSet(allScriptures);
      startReviewPhase(allScriptures);
    } else {
      setVerseSet([]);
      setMode("review");
    }
  }, [selectedTheme, selectedDifficulty]); // Re-trigger if difficulty changes for quiz prep later

  const startReviewPhase = (scriptures: ScriptureItem[]) => {
    setMode("review");
    setVerseSet(scriptures);
    setCurrentVerseIndex(0);
    setShowVerseText(false);
    setQuizQuestions([]);
    setAnswersFeedback([]);
    setScore(0);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const handleDifficultyChange = (difficulty: Question['difficulty']) => {
    setSelectedDifficulty(difficulty);
    // If a theme is already selected, restarting the review phase implicitly handles
    // the new difficulty for the subsequent quiz.
    if (selectedTheme) {
      startReviewPhase(selectedTheme.scriptures);
    }
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
      setThemeInput("");
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
    if (!verseSet.length || !selectedTheme) return;

    const allQuestionsFromSet = verseSet.flatMap(scripture => 
      scripture.questions.map(q => ({...q, relatedVerseRef: scripture.reference}))
    );
    
    const questionsForDifficulty = allQuestionsFromSet.filter(q => q.difficulty === selectedDifficulty);

    if (questionsForDifficulty.length === 0) {
      toast({
        title: "No Questions",
        description: `No questions available for '${selectedTheme.name}' at '${selectedDifficulty}' difficulty. Try another difficulty or theme.`,
        variant: "default",
      });
      setMode("review"); // Go back to review or theme selection
      return;
    }

    // Shuffle and pick up to QUIZ_QUESTION_COUNT
    const shuffledQuestions = [...questionsForDifficulty].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffledQuestions.slice(0, QUIZ_QUESTION_COUNT));
    
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
        startReviewPhase(selectedTheme.scriptures);
      }
  };

  const renderReviewMode = () => {
    if (!verseSet.length || !selectedTheme) return null;
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
    if (!quizQuestions.length || !selectedTheme) return null;
    const question = quizQuestions[currentQuestionIndex];
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
             <Brain className="h-6 w-6 text-primary" />
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Related to: {question.relatedVerseRef} (Difficulty: {question.difficulty})</p>
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
     if (!selectedTheme) return null;
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Quiz Results
          </CardTitle>
          <CardDescription>
            You scored {score} out of {quizQuestions.length} ({quizQuestions.length > 0 ? ((score / quizQuestions.length) * 100).toFixed(0) : 0}%)
            for theme &quot;{selectedTheme.name}&quot; at &quot;{selectedDifficulty}&quot; difficulty.
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
            Choose New Theme/Difficulty
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {!selectedThemeId && (
        <Card className="shadow-md p-6">
          <CardTitle className="mb-4 text-xl">Select Theme & Difficulty</CardTitle>
          <div className="space-y-4">
            <div>
              <label htmlFor="theme-select" className="block text-sm font-medium text-foreground mb-1">Choose from list:</label>
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
            <div>
              <label htmlFor="theme-text-input" className="block text-sm font-medium text-foreground mb-1">Or search theme by keyword:</label>
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
              <p className="text-xs text-muted-foreground mt-1">Note: Text search currently looks through predefined themes.</p>
            </div>
            <div>
              <label htmlFor="difficulty-select" className="block text-sm font-medium text-foreground mb-1">Select Difficulty:</label>
              <Select onValueChange={(value) => handleDifficultyChange(value as Question['difficulty'])} defaultValue={selectedDifficulty}>
                <SelectTrigger id="difficulty-select" className="w-full">
                  <SelectValue placeholder="Choose difficulty..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginning my Walk in Him</SelectItem>
                  <SelectItem value="intermediate">Young men</SelectItem>
                  <SelectItem value="advanced">Older in The Way with Him</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    