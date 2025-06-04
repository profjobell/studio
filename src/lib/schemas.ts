
import { z } from 'zod';

// Base schema for the form
const BaseTeachingAnalysisFormSchema = z.object({
  teaching: z.string().min(20, 'Teaching content must be at least 20 characters.'),
  recipientNameTitle: z.string().min(3, 'Recipient details are required.'),
  tonePreference: z.enum(['gentle', 'firm', 'urgent']),
  outputFormats: z.array(z.enum(['PDF', 'TXT', 'RTF', 'Email', 'Share', 'Print'])).min(1, 'At least one output format must be selected.'),
  userEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  additionalNotes: z.string().optional(),
});

// Infer type from the base schema
type BaseTeachingAnalysisFormData = z.infer<typeof BaseTeachingAnalysisFormSchema>;

// Refinement function
const teachingAnalysisRefinement = (data: BaseTeachingAnalysisFormData): boolean => {
  if ((data.outputFormats.includes('Email') || data.outputFormats.includes('Share')) && (!data.userEmail || data.userEmail.trim() === '')) {
    return false; 
  }
  return true; 
};

// Final schema with refinement
export const TeachingAnalysisFormSchema = BaseTeachingAnalysisFormSchema.refine(
  teachingAnalysisRefinement,
  {
    message: 'Email address is required if Email or Share output format is selected.',
    path: ['userEmail'], 
  }
);
