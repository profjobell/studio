
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FallacyQuizClient } from "./components/fallacy-quiz-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Fallacy Detection Quiz & Tutor - KJV Sentinel",
  description: "Learn about logical fallacies and test your ability to identify them with AI-powered tutoring and quizzes.",
};

export default function FallacyQuizPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Fallacy Detection: Tutor & Quiz</CardTitle>
          <CardDescription>
            Sharpen your critical thinking skills. Learn to identify and understand logical fallacies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FallacyQuizClient />
        </CardContent>
      </Card>
       <div className="mt-8 text-center print:hidden">
          <Button variant="outline" asChild>
            <Link href="/learning">Back to Learning Tools</Link>
          </Button>
        </div>
    </div>
  );
}
