import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Puzzle, BookOpen, Brain, ListChecks } from "lucide-react"; // Added ListChecks
import Image from "next/image";

export const metadata = {
  title: "Learning Tools - KJV Sentinel",
  description: "Interactive tools to enhance your theological understanding and scripture memory.",
};

const learningModules = [
  {
    title: "General Fallacy Quiz & Tutor", // Updated title for clarity
    description: "Test your ability to identify logical fallacies in various contexts. Learn with AI-powered tutoring and quizzes.",
    icon: Puzzle,
    actionText: "Start General Quiz/Tutor", // Updated action text
    href: "/learning/fallacy-quiz", 
    imageHint: "brain puzzle game"
  },
  {
    title: "Personalized Fallacy Quiz (from your reports)", // New Module
    description: "Take a quiz based on fallacies identified in your own analyzed content reports. Reinforce your learning from specific examples.",
    icon: ListChecks, // New Icon
    actionText: "Start Personalized Quiz",
    href: "/learning/report-fallacy-quiz", // New Link
    imageHint: "report checklist analytics"
  },
  {
    title: "Scripture Memory Tool",
    description: "Save and practice KJV verses identified in your analyses. Uses a flashcard-style interface to aid memorization.",
    icon: BookOpen,
    actionText: "Practice Verses",
    href: "/learning/scripture-memory", 
    imageHint: "flashcards study learning"
  },
  {
    title: "Ism Awareness Quiz",
    description: "Deepen your understanding of various theological 'isms' and Calvinistic influences detected in your content analyses.",
    icon: Lightbulb,
    actionText: "Start Ism Quiz",
    href: "/learning/ism-quiz", 
    imageHint: "lightbulb idea thinking"
  },
];

export default function LearningPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Tools</h1>
        <p className="text-muted-foreground">
          Engage with interactive tools to solidify your understanding of theology and scripture.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {learningModules.map((module) => (
          <Card key={module.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-center gap-4 pb-2">
               <div className="p-3 bg-primary/10 rounded-full">
                <module.icon className="h-8 w-8 text-primary" />
               </div>
               <CardTitle className="text-xl">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <Image 
                src={`https://picsum.photos/seed/${module.title.replace(/\s+/g, '')}/400/200`}
                alt={module.title}
                width={400}
                height={200}
                className="w-full h-40 object-cover rounded-md mb-4"
                data-ai-hint={module.imageHint} 
              />
              <CardDescription>{module.description}</CardDescription>
            </CardContent>
            <CardContent className="mt-auto">
              <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                <Link href={module.href}>
                  {module.actionText}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Why Use These Tools?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Theological understanding is not just about acquiring information, but about discerning truth and applying it. These tools are designed to:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>Reinforce Learning:</strong> Actively engaging with concepts improves retention.</li>
            <li><strong>Develop Critical Thinking:</strong> Learn to spot inconsistencies and manipulative tactics.</li>
            <li><strong>Strengthen Faith:</strong> A deeper understanding of scripture and doctrine can fortify your beliefs.</li>
            <li><strong>Personalized Practice:</strong> Quizzes and memory tools can be tailored based on content you've analyzed.</li>
          </ul>
          <p className="pt-2">
            We encourage you to regularly use these tools alongside your content analysis to grow in knowledge and discernment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

