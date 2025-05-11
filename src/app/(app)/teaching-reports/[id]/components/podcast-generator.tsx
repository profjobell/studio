"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Music, Mail, Save } from 'lucide-react';
import type { AnalyzeTeachingOutput, PodcastData, TeachingAnalysisReport } from '@/types';
import { generatePodcastAction, exportPodcastAction, updateTeachingReportPodcastDataAction } from '../../../analyze-teaching/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PodcastGeneratorProps {
  analysisId: string;
  initialReport: TeachingAnalysisReport; // Pass the whole report
}

const contentScopeOptions: Array<Extract<PodcastData["contentScope"][number], string>> = [
  'Full Report',
  'Church History',
  'Promoters',
  'Church Council',
  'Letter of Caution',
  'Warnings',
];

export function PodcastGenerator({ analysisId, initialReport }: PodcastGeneratorProps) {
  const [report, setReport] = useState(initialReport);
  const [isVisible, setIsVisible] = useState(!!report.analysisResult);
  
  const [contentScope, setContentScope] = useState<string[]>(report.podcast?.contentScope || ['Full Report']);
  const [treatmentType, setTreatmentType] = useState<'General Overview' | 'Deep'>(report.podcast?.treatmentType || 'General Overview');
  const [exportOptions, setExportOptions] = useState<Array<'Email' | 'Google Drive'>>(report.podcast?.exportOptions || []);
  const [email, setEmail] = useState(report.userEmail || '');
  
  const [statusMessage, setStatusMessage] = useState(report.podcast?.status === 'generated' || report.podcast?.status === 'exported' ? 'Podcast previously generated.' : '');
  const [errorMessage, setErrorMessage] = useState(report.podcast?.lastError || '');
  const [audioUrl, setAudioUrl] = useState(report.podcast?.audioUrl || '');

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isExporting, startExportingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(!!report.analysisResult);
    setReport(initialReport); // Keep local state synced with prop
    setContentScope(initialReport.podcast?.contentScope || ['Full Report']);
    setTreatmentType(initialReport.podcast?.treatmentType || 'General Overview');
    setExportOptions(initialReport.podcast?.exportOptions || []);
    setEmail(initialReport.userEmail || '');
    setAudioUrl(initialReport.podcast?.audioUrl || '');
    if (initialReport.podcast?.status === 'generated' || initialReport.podcast?.status === 'exported') {
        setStatusMessage('Podcast previously generated.');
    } else {
        setStatusMessage('');
    }
    setErrorMessage(initialReport.podcast?.lastError || '');
  }, [initialReport]);


  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contentScope.length === 0) {
      setErrorMessage('Please select at least one content scope item.');
      toast({ title: 'Error', description: 'Please select content scope.', variant: 'destructive' });
      return;
    }
    setErrorMessage('');
    setStatusMessage('Generating podcast...');
    setAudioUrl('');

    startGeneratingTransition(async () => {
      let reportContent = '';
      const result = report.analysisResult;
      if (!result) {
        setErrorMessage("Analysis result is not available to generate podcast.");
        setStatusMessage('');
        return;
      }

      if (contentScope.includes('Full Report')) {
        reportContent = `Teaching: ${report.teaching}\n\nChurch History: ${result.churchHistoryContext}\n\nPromoters: ${result.promotersDemonstrators.map(p => `${p.name}: ${p.description}`).join('\n')}\n\nCouncil Summary: ${result.churchCouncilSummary}\n\nLetter: ${result.letterOfClarification}\n\nWarnings: ${result.biblicalWarnings}`;
      } else {
        if (contentScope.includes('Church History')) reportContent += `Church History: ${result.churchHistoryContext}\n\n`;
        if (contentScope.includes('Promoters')) reportContent += `Promoters: ${result.promotersDemonstrators.map(p => `${p.name}: ${p.description}`).join('\n')}\n\n`;
        if (contentScope.includes('Church Council')) reportContent += `Council Summary: ${result.churchCouncilSummary}\n\n`;
        if (contentScope.includes('Letter of Caution')) reportContent += `Letter: ${result.letterOfClarification}\n\n`;
        if (contentScope.includes('Warnings')) reportContent += `Warnings: ${result.biblicalWarnings}\n\n`;
      }

      const podcastDataToSave: PodcastData = {
        status: 'generating',
        contentScope: contentScope as PodcastData['contentScope'],
        treatmentType,
        exportOptions: exportOptions,
        exportStatus: 'pending',
      };
      await updateTeachingReportPodcastDataAction(analysisId, podcastDataToSave);


      const genResult = await generatePodcastAction(analysisId, reportContent, treatmentType, contentScope);

      if (genResult.success && genResult.audioUrl && genResult.podcastData) {
        setStatusMessage('Podcast generated successfully! Ready to export.');
        setAudioUrl(genResult.audioUrl);
        toast({ title: 'Podcast Generated', description: genResult.message });
        const finalPodcastData = { ...podcastDataToSave, status: 'generated', audioUrl: genResult.audioUrl } as PodcastData;
        const updateRes = await updateTeachingReportPodcastDataAction(analysisId, finalPodcastData);
        if(updateRes.updatedReport) setReport(updateRes.updatedReport);
      } else {
        setErrorMessage(genResult.message || 'Failed to generate podcast.');
        setStatusMessage('');
        toast({ title: 'Generation Failed', description: genResult.message, variant: 'destructive' });
        const finalPodcastData = { ...podcastDataToSave, status: 'failed', lastError: genResult.message } as PodcastData;
        const updateRes = await updateTeachingReportPodcastDataAction(analysisId, finalPodcastData);
         if(updateRes.updatedReport) setReport(updateRes.updatedReport);
      }
    });
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exportOptions.length === 0) {
        setErrorMessage('Please select at least one export option.');
        toast({ title: 'Error', description: 'Please select export option.', variant: 'destructive' });
        return;
    }
    if (exportOptions.includes('Email') && !email) {
        setErrorMessage('Email address is required for email export.');
        toast({ title: 'Error', description: 'Email address is required.', variant: 'destructive' });
        return;
    }
     if (!audioUrl) {
        setErrorMessage('No podcast audio available to export. Please generate first.');
        toast({ title: 'Error', description: 'No podcast audio available.', variant: 'destructive' });
        return;
    }

    setErrorMessage('');
    setStatusMessage('Exporting podcast...');
    
    startExportingTransition(async () => {
        const podcastDataToSave: Partial<PodcastData> = {
            status: 'exporting',
            exportOptions: exportOptions,
        };
        await updateTeachingReportPodcastDataAction(analysisId, {...report.podcast, ...podcastDataToSave} as PodcastData );

        const exportResult = await exportPodcastAction(analysisId, audioUrl, exportOptions, email);

        if (exportResult.success && exportResult.podcastData) {
            setStatusMessage('Podcast exported successfully!');
            toast({ title: 'Podcast Exported', description: exportResult.message });
            const finalPodcastData = { ...report.podcast, ...podcastDataToSave, status: 'exported', exportStatus: 'completed' } as PodcastData;
            const updateRes = await updateTeachingReportPodcastDataAction(analysisId, finalPodcastData);
            if(updateRes.updatedReport) setReport(updateRes.updatedReport);

        } else {
            setErrorMessage(exportResult.message || 'Failed to export podcast.');
            setStatusMessage('Export failed.');
            toast({ title: 'Export Failed', description: exportResult.message, variant: 'destructive' });
            const finalPodcastData = { ...report.podcast, ...podcastDataToSave, status: 'generated', exportStatus: 'failed', lastError: exportResult.message } as PodcastData;
            const updateRes = await updateTeachingReportPodcastDataAction(analysisId, finalPodcastData);
             if(updateRes.updatedReport) setReport(updateRes.updatedReport);
        }
    });
  }


  if (!isVisible) return null;

  const currentPodcastStatus = report.podcast?.status;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Podcast Generation</CardTitle>
        <CardDescription>Generate an audio podcast from this analysis report.</CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage && <p className="mb-2 text-sm text-primary">{statusMessage}</p>}
        {errorMessage && <p className="mb-2 text-sm text-destructive">{errorMessage}</p>}

        <form onSubmit={handleGenerateSubmit} className="space-y-6">
          <div>
            <Label className="mb-2 block font-medium">Content Scope</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {contentScopeOptions.map((scope) => (
                <div key={scope} className="flex items-center">
                  <Checkbox
                    id={`scope-${scope.replace(/\s+/g, '-')}`}
                    value={scope}
                    checked={contentScope.includes(scope)}
                    onCheckedChange={(checked) => {
                      const value = scope;
                      setContentScope((prev) =>
                        checked ? [...prev, value] : prev.filter((s) => s !== value)
                      );
                    }}
                    className="mr-2"
                    disabled={isGenerating || currentPodcastStatus === 'generated' || currentPodcastStatus === 'exported' || currentPodcastStatus === 'exporting'}
                  />
                  <Label htmlFor={`scope-${scope.replace(/\s+/g, '-')}`} className="text-sm font-normal">{scope}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="treatmentType" className="mb-2 block font-medium">Treatment Type</Label>
            <Select
              value={treatmentType}
              onValueChange={(value: 'General Overview' | 'Deep') => setTreatmentType(value)}
              disabled={isGenerating || currentPodcastStatus === 'generated' || currentPodcastStatus === 'exported' || currentPodcastStatus === 'exporting'}
            >
              <SelectTrigger id="treatmentType">
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Overview">General Overview (Simulated 5-10 min)</SelectItem>
                <SelectItem value="Deep">Deep (Simulated 15-20 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={isGenerating || currentPodcastStatus === 'generated' || currentPodcastStatus === 'exported' || currentPodcastStatus === 'exporting'}>
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Music className="mr-2 h-4 w-4" />}
            {currentPodcastStatus === 'generated' || currentPodcastStatus === 'exported' || currentPodcastStatus === 'exporting' ? 'Podcast Generated' : 'Generate Podcast'}
          </Button>
        </form>

        {audioUrl && (currentPodcastStatus === 'generated' || currentPodcastStatus === 'exported' || currentPodcastStatus === 'exporting') && (
          <div className="mt-6 space-y-6">
            <div className="mt-4">
              <Label className="block font-medium">Generated Podcast Audio:</Label>
              <audio controls src={audioUrl} className="w-full mt-2">
                Your browser does not support the audio element. Direct link: <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{audioUrl}</a>
              </audio>
            </div>
            <form onSubmit={handleExportSubmit} className="space-y-6 pt-6 border-t">
                <div>
                    <Label className="mb-2 block font-medium">Export Options</Label>
                    <div className="flex flex-col gap-2">
                    {(['Email', 'Google Drive'] as const).map((type) => (
                        <div key={type} className="flex items-center">
                        <Checkbox
                            id={`export-${type}`}
                            value={type}
                            checked={exportOptions.includes(type)}
                            onCheckedChange={(checked) => {
                                const value = type;
                                setExportOptions((prev) =>
                                    checked ? [...prev, value] : prev.filter((t) => t !== value)
                                );
                            }}
                            className="mr-2"
                            disabled={isExporting || currentPodcastStatus === 'exported'}
                        />
                        <Label htmlFor={`export-${type}`} className="text-sm font-normal">{type}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                {exportOptions.includes('Email') && (
                <div>
                    <Label htmlFor="emailExport" className="mb-2 block font-medium">Email Address for Export</Label>
                    <Input
                    id="emailExport"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for export"
                    required={exportOptions.includes('Email')}
                    disabled={isExporting || currentPodcastStatus === 'exported'}
                    />
                </div>
                )}
                 <Button type="submit" className="w-full" disabled={isExporting || currentPodcastStatus === 'exported'}>
                    {isExporting ? <Loader2 className="animate-spin mr-2" /> : (exportOptions.includes('Email') ? <Mail className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
                    {currentPodcastStatus === 'exported' ? 'Podcast Exported' : 'Export Podcast'}
                </Button>
            </form>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Podcast generation and export are simulated. Audio is a placeholder.</p>
      </CardFooter>
    </Card>
  );
}