
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export const metadata = {
  title: "Scripture Memory Tool - KJV Sentinel",
  description: "Practice and memorize KJV verses.",
};

export default function ScriptureMemoryPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="mr-2 h-6 w-6 text-primary" />
            Scripture Memory Tool
          </CardTitle>
          <CardDescription>
            This feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The Scripture Memory Tool will provide a flashcard-style interface to help you save and practice KJV verses, particularly those identified during your content analyses. Effective memorization techniques will be incorporated to aid retention.
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
