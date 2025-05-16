
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScriptureMemoryTool } from "./components/scripture-memory-tool"; // New component

export const metadata = {
  title: "Scripture Memory Tool - KJV Sentinel",
  description: "Practice and memorize KJV verses.",
};

export default function ScriptureMemoryPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">KJV Scripture Memory Tool</CardTitle>
          <CardDescription>
            Select a theme and begin memorizing key verses from the King James Version Bible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScriptureMemoryTool />
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
