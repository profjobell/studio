
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentSubmissionForm } from "./components/content-submission-form";

export const metadata = {
  title: "Analyze Content - KJV Sentinel",
  description: "Submit religious content for theological analysis.",
};

export default function AnalyzePage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analyze Content</h1>
        <p className="text-muted-foreground">
          Submit text, YouTube video links, audio, video, or documents for theological analysis based on the KJV 1611 Bible.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New Analysis Submission</CardTitle>
          <CardDescription>
            Provide your content below. YouTube links and file uploads are processed (simulated transcription for video/audio) before analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentSubmissionForm />
        </CardContent>
      </Card>
      
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Analysis Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Submission Types:</strong> Text input, YouTube video URL, MP3, WAV (audio), MP4, AVI (video), PDF, TXT, DOCX (documents).</p>
          <p><strong>Size Limits:</strong> Maximum 100MB for file uploads. Document page limit is 500 pages.</p>
          <p><strong>Process:</strong> YouTube videos, audio files, and video files undergo simulated transcription. Documents are processed for text. All content is then analyzed by Scriptural Sentinel.</p>
          <p><strong>Output:</strong> You will receive a detailed report covering theological accuracy, historical context, manipulative tactics, identified "isms", and Calvinistic influence.</p>
          <p><strong>Note:</strong> Large files or complex analyses may take some time to process. You will be notified upon completion.</p>
        </CardContent>
      </Card>
    </div>
  );
}
