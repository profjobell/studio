
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export const metadata = {
  title: "Fallacy Detection Quiz - KJV Sentinel",
  description: "Test your ability to identify logical fallacies.",
};

export default function FallacyQuizPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="mr-2 h-6 w-6 text-primary" />
            Fallacy Detection Quiz
          </CardTitle>
          <CardDescription>
            This feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The Fallacy Detection Quiz will help you sharpen your skills in identifying logical fallacies often found in theological arguments. This interactive tool will present scenarios or statements, and you'll be challenged to pinpoint the fallacies involved.
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
