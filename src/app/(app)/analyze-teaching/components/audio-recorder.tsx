
"use client";

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, StopCircle, Save, Trash2, Loader2 } from 'lucide-react';
import { transcribeAudioAction } from '../actions'; // Server action for transcription

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string, audioStoragePath: string, audioBlob: Blob) => void;
  // analysisId: string; // analysisId to associate the recording, can be generated here or passed
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // For preview
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const [isProcessing, startProcessingTransition] = useTransition();

  useEffect(() => {
    // Check for microphone permission on component mount
    const checkPermission = async () => {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        try {
          // A quick check without actually starting, to see if permission was granted previously
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Immediately stop the tracks if we only wanted to check permission
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch (err) {
          console.warn("Microphone permission not (yet) granted or no microphone found.", err);
          setHasPermission(false);
        }
      } else {
        setErrorMessage("MediaDevices API not supported in this browser.");
        setHasPermission(false);
      }
    };
    checkPermission();
  }, []);


  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setErrorMessage("Audio recording is not supported by your browser.");
      toast({ title: "Error", description: "Audio recording not supported.", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Using webm for broader compatibility
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatusMessage('Recording stopped. Preview available. Save or delete.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setStatusMessage('Recording...');
      setErrorMessage('');
      toast({ title: "Recording Started", description: "Microphone is now active."});
    } catch (err) {
      console.error("Error starting recording:", err);
      setErrorMessage('Failed to access microphone. Please grant permission in your browser settings.');
      toast({ title: "Microphone Access Error", description: "Please grant permission.", variant: "destructive" });
      setHasPermission(false);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Tracks are stopped in onstop event of MediaRecorder to ensure data is flushed
      // streamRef.current?.getTracks().forEach((track) => track.stop());
       toast({ title: "Recording Stopped", description: "Processing audio..."});
    }
  };

  const convertBlobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };


  const handleSaveAndTranscribe = async () => {
    if (!audioBlob) {
      setErrorMessage('No recording available to save.');
      toast({ title: "Error", description: "No recording to save.", variant: "destructive" });
      return;
    }

    startProcessingTransition(async () => {
      setStatusMessage('Uploading and transcribing...');
      setErrorMessage('');
      try {
        const audioDataUrl = await convertBlobToDataURL(audioBlob);
        const result = await transcribeAudioAction(audioDataUrl);

        if (result.success && result.transcription && result.audioStoragePath) {
          onTranscriptionComplete(result.transcription, result.audioStoragePath, audioBlob);
          setStatusMessage('Transcription complete. Populated teaching input.');
          toast({ title: "Transcription Successful", description: "Teaching field populated." });
          // Clear local state after successful processing and passing to parent
          setAudioBlob(null);
          setAudioUrl(null);
        } else {
          setErrorMessage(result.message || 'Failed to transcribe audio.');
          toast({ title: "Transcription Failed", description: result.message, variant: "destructive" });
          setStatusMessage('Transcription failed.');
        }
      } catch (err) {
        console.error("Error saving/transcribing:", err);
        setErrorMessage('An unexpected error occurred during save/transcription.');
        toast({ title: "Error", description: "Transcription process failed.", variant: "destructive" });
        setStatusMessage('Error.');
      }
    });
  };

  const handleDeleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setStatusMessage('Recording discarded.');
    setErrorMessage('');
    if (isRecording) stopRecording(); // Stop if still recording
    toast({ title: "Recording Discarded" });
  };
  
  if (hasPermission === false && typeof navigator !== "undefined" && navigator.mediaDevices) {
    return (
      <div className="my-4 p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
        <p className="font-semibold">Microphone Access Required</p>
        <p>KJV Sentinel needs permission to access your microphone to use the recording feature. Please enable microphone permissions in your browser settings and refresh the page.</p>
      </div>
    );
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return <p className="text-sm text-muted-foreground my-4">Audio recording is not supported by your browser.</p>
  }


  return (
    <div className="my-6 p-4 border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-semibold mb-3 text-primary">Record Audio Input</h3>
      
      {statusMessage && <p className="text-sm text-green-600 mb-2">{statusMessage}</p>}
      {errorMessage && <p className="text-sm text-red-600 mb-2">{errorMessage}</p>}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          disabled={isProcessing || hasPermission === null}
        >
          {isRecording ? <StopCircle className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>

        {audioBlob && !isRecording && (
          <>
            <Button
              type="button"
              onClick={handleSaveAndTranscribe}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
              Save & Transcribe
            </Button>
            <Button
              type="button"
              onClick={handleDeleteRecording}
              variant="outline"
              disabled={isProcessing}
            >
              <Trash2 className="mr-2" />
              Delete Recording
            </Button>
          </>
        )}
      </div>

      {audioUrl && !isRecording && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-1">Preview Recording:</p>
          <audio controls src={audioUrl} className="w-full rounded-md">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
       {isProcessing && (
        <p className="text-sm text-muted-foreground mt-2 flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
          Processing audio... please wait.
        </p>
      )}
    </div>
  );
}
