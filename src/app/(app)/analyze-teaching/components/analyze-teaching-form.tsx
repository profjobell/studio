'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { submitTeachingAnalysisAction, TeachingAnalysisFormSchema } from '../actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const outputFormatOptions = [
  { id: 'PDF', label: 'PDF' },
  { id: 'TXT', label: 'TXT' },
  { id: 'RTF', label: 'RTF' },
  { id: 'Email', label: 'Email' },
  { id: 'Share', label: 'Share' },
  { id: 'Print', label: 'Print' },
] as const;

type FormData = z.infer<typeof TeachingAnalysisFormSchema>;

export function AnalyzeTeachingForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(TeachingAnalysisFormSchema),
    defaultValues: {
      teaching: '',
      recipientNameTitle: '',
      tonePreference: 'gentle',
      outputFormats: ['PDF'],
      userEmail: '',
      additionalNotes: '',
    },
  });

  async function onSubmit(values: FormData) {
    startTransition(async () => {
      try {
        const result = await submitTeachingAnalysisAction(values);

        if (result.success && result.analysisId) {
          toast({
            title: 'Analysis Submitted',
            description: 'Your teaching analysis request has been submitted successfully. Redirecting to report...',
          });
          router.push(`/teaching-reports/${result.analysisId}`);
          form.reset();
        } else {
          toast({
            title: 'Submission Failed',
            description: result.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Submission error:', error);
        toast({
          title: 'Submission Error',
          description: error instanceof Error ? error.message : 'An unexpected server error occurred.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="teaching"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teaching / Philosophy / Saying</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the teaching or philosophy you want to analyze..."
                  className="resize-y min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide the specific teaching, saying, or philosophical statement for analysis.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipientNameTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Name and Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pastor John Doe, Teacher Jane Smith" {...field} />
              </FormControl>
              <FormDescription>
                For whom is the letter of clarification intended?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tonePreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Letter Tone Preference</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gentle">Gentle</SelectItem>
                  <SelectItem value="firm">Firm</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the tone for the generated letter of clarification.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="outputFormats"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Output Formats</FormLabel>
                <FormDescription>
                  Select at least one desired output format for the analysis report.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {outputFormatOptions.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="outputFormats"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="userEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email Address (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Required if you select &apos;Email&apos; or &apos;Share&apos; as output formats.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide any extra context or specific points of concern..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any other information you want the AI to consider.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Submit for Teaching Analysis"
          )}
        </Button>
      </form>
    </Form>
  );
}