
"use client"; 

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Activity, FileText, Search, Edit, ExternalLink, Loader2, Image as ImageIconLucide } from "lucide-react"; 
import { fetchReportsList } from "../reports/actions";
import { fetchLibraryDocuments } from "../library/actions";
import type { AnalysisReport, DocumentReference, UserDashboardPreference } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClearHistoryButton } from "./components/clear-history-button";
import { format } from 'date-fns';
import { FeaturesGuideModal } from "@/components/features-guide";
import { fetchUserDashboardPreference } from "../profile/actions"; 

export default function DashboardPage() {
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisReport[]>([]);
  const [libraryDocuments, setLibraryDocuments] = useState<DocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dashboardPreference, setDashboardPreference] = useState<UserDashboardPreference | null>(null);
  const [isLoadingPreference, startLoadingPreferenceTransition] = useTransition();
  const [imageError, setImageError] = useState(false); 

  useEffect(() => {
    const id = localStorage.getItem('conceptualUserType') || 'default';
    setCurrentUserId(id);

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [reports, docs] = await Promise.all([
          fetchReportsList(),
          fetchLibraryDocuments(),
        ]);
        setRecentAnalyses(reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLibraryDocuments(docs);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      startLoadingPreferenceTransition(async () => {
        setImageError(false); 
        const pref = await fetchUserDashboardPreference(currentUserId);
        setDashboardPreference(pref);
      });
    }
  }, [currentUserId]);

  const stats = [
    { title: "Total Analyses", value: recentAnalyses.length.toString(), icon: FileText, change: "", href:"/reports" },
    { title: "Documents in Library", value: libraryDocuments.length.toString(), icon: Search, change: "+ View/Upload", href: "/library" },
  ];

  const hasReports = recentAnalyses.length > 0;

  if (isLoading && !currentUserId) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  const renderCustomDashboardSection = () => {
    if (isLoadingPreference) {
      return (
        <Card className="my-4 p-4 border rounded-md bg-card text-card-foreground">
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading your custom section...</p>
          </div>
        </Card>
      );
    }

    if (dashboardPreference?.enabled) {
      let imageDisplayElement;
      const shouldUseSymbolic = dashboardPreference.symbolicPlaceholder || !dashboardPreference.imageUrl || imageError;
      
      let aiHint = "abstract geometric shape"; // Default for symbolic
      if (dashboardPreference.imageUrl === "https://storage.googleapis.com/project-images-public/kjv_sentinel_dashboard_default.png") {
        aiHint = "scripture study";
      } else if (dashboardPreference.imageUrl) {
        aiHint = "scripture books"; // For other custom images
      }


      if (shouldUseSymbolic) {
        imageDisplayElement = (
          <div 
            style={{ 
                width: '100px', 
                height: '100px', 
                backgroundColor: dashboardPreference.symbolicColor || 'black', 
                border: '1px solid hsl(var(--border))',
                margin: '10px auto'
            }} 
            title={imageError && dashboardPreference.imageUrl ? "Symbolic placeholder (image failed to load)" : "Symbolic placeholder"}
            data-ai-hint={aiHint}
          ></div>
        );
      } else {
        imageDisplayElement = (
          <div className="relative w-full max-w-xs h-40 mx-auto mb-3">
            <Image 
              src={dashboardPreference.imageUrl!} 
              alt="User defined image" 
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-md"
              onError={() => {
                console.warn(`Failed to load custom dashboard image: ${dashboardPreference.imageUrl}`);
                setImageError(true);
              }}
              data-ai-hint={aiHint}
            />
          </div>
        );
      }

      return (
        <Card className="my-4 p-4 border rounded-md bg-card text-card-foreground text-center shadow-md">
          <CardHeader className="p-2">
             <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                <ImageIconLucide className="h-5 w-5 text-primary" /> Your Custom Welcome
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {imageDisplayElement}
            {dashboardPreference.notes && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{dashboardPreference.notes}</p>
            )}
          </CardContent>
           <CardFooter className="p-2 pt-3 justify-center">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/profile">
                        <Edit className="mr-2 h-3 w-3"/> Edit This Section
                    </Link>
                </Button>
           </CardFooter>
        </Card>
      );
    }
    // Default if not enabled or no preference
    return (
      <Card className="my-4 p-4 border rounded-md bg-card text-card-foreground">
        <p className="text-sm text-muted-foreground mb-2">Welcome to your dashboard!</p>
        <p className="text-xs text-muted-foreground mt-1">
          You can customize this welcome section on your <Link href="/profile" className="text-primary hover:underline">profile page</Link>.
        </p>
      </Card>
    );
  };


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

      {renderCustomDashboardSection()}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link href={stat.href || "#"} key={stat.title} className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  Overview of your latest content analyses.
                </CardDescription>
              </div>
              <ClearHistoryButton disabled={!hasReports} />
            </div>
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
                          {format(new Date(analysis.createdAt), 'PPP')} -
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to KJV Sentinel</CardTitle>
            <CardDescription>Your guide to understanding theological content through the lens of the KJV 1611 Bible.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
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
                <FeaturesGuideModal>
                    <Button variant="secondary">Learn More</Button>
                </FeaturesGuideModal>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5 text-primary" />
              RTN TV
            </CardTitle>
            <CardDescription>Recommended Christian Resources & Reading Material.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Explore additional insights, articles, and media at RTNTV.org, a valuable resource for discerning Christians. The linked page provides an index of various topics discussed.
            </p>
            <Button asChild variant="outline">
              <Link href="https://rtntv.org/IndexA?id=3" target="_blank" rel="noopener noreferrer">
                Visit RTNTV.org <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

