
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export const metadata = {
  title: "Ism Awareness Quiz - KJV Sentinel",
  description: "Deepen your understanding of theological 'isms'.",
};

export default function IsmAwarenessQuizPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="mr-2 h-6 w-6 text-primary" />
            Ism Awareness Quiz
          </CardTitle>
          <CardDescription>
            This feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The Ism Awareness Quiz will help you deepen your understanding of various theological "isms" and Calvinistic influences. The quiz will draw upon concepts and examples that may be highlighted in your content analyses, providing an interactive way to learn and discern.
          </p>
          <p className="text-muted-foreground mb-6">
            Check back soon for updates!
          </p>
          <Button asChild variant="outline">
            <Link href="/learning">Back to Learning Tools</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
