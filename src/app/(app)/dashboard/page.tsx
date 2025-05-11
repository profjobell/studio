
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, Search } from "lucide-react";
import Image from "next/image";
import { fetchReportsList } from "../reports/actions"; // Fetches list of reports
import type { AnalysisReport } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DashboardPage() {
  const allReports: Omit<AnalysisReport, keyof import('@/ai/flows/analyze-content').AnalyzeContentOutput >[] = await fetchReportsList();
  
  const recentAnalyses = allReports
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // .slice(0, 5); // Optionally limit to a certain number if not using scroll or for above-the-fold

  const stats = [
    { title: "Total Analyses", value: recentAnalyses.length.toString(), icon: FileText, change: "" }, // Updated value, change can be static or dynamic
    { title: "Documents in Library", value: "32", icon: Search, change: "+2 uploaded" }, // Placeholder
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/analyze">New Analysis</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Overview of your latest content analyses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length > 0 ? (
              <ScrollArea className="h-[350px] w-full">
                <ul className="space-y-3 pr-3">
                  {recentAnalyses.map((analysis) => (
                    <li key={analysis.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-md border border-border">
                      <div>
                        <Link href={`/reports/${analysis.id}`} className="font-medium text-primary hover:underline">
                          {analysis.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString()} - 
                          <span className={`ml-1 capitalize ${
                            analysis.status === "completed" ? "text-green-600" :
                            analysis.status === "processing" ? "text-yellow-600" :
                            analysis.status === "failed" ? "text-red-600" : ""
                          }`}>
                            {analysis.status}
                          </span>
                        </p>
                        {analysis.fileName && (
                           <p className="text-xs text-muted-foreground italic">{analysis.fileName}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reports/${analysis.id}`}>View</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No recent analyses found. <Link href="/analyze" className="text-primary hover:underline">Start a new analysis</Link>.</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline">
              <Link href="/analyze">
                <Search className="mr-2 h-4 w-4" /> Analyze New Content
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/library">
                <FileText className="mr-2 h-4 w-4" /> Upload to Library
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/learning">
                <Activity className="mr-2 h-4 w-4" /> Access Learning Tools
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Welcome to KJV Sentinel</CardTitle>
          <CardDescription>Your guide to understanding theological content through the lens of the KJV 1611 Bible.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <Image 
            src="https://picsum.photos/seed/kjvbiblestudy/400/300" 
            alt="KJV Bible study"
            width={300}
            height={225}
            className="rounded-lg shadow-md"
            data-ai-hint="bible book open"
          />
          <div>
            <p className="mb-4 text-muted-foreground">
              KJV Sentinel helps you analyze religious texts, sermons, and discussions for theological accuracy, historical context, potential manipulative tactics, and influences from various theological systems like Calvinism. Our analysis is grounded in the King James Version (KJV) 1611 Bible.
            </p>
            <p className="mb-4 text-muted-foreground">
              Get started by submitting content for analysis, uploading reference materials to your personal library, or exploring our interactive learning tools.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/analyze">Analyze Content</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
