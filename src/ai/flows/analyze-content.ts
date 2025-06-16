
'use server';

/**
 * @fileOverview Analyzes user-submitted religious content for theological accuracy, historical context,
 * manipulative tactics, identified "isms", and Calvinistic influence using the Scriptural Sentinel model.
 *
 * - analyzeContent - A function that handles the content analysis process.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContentInputSchema = z.object({
  content: z.string().describe('The religious content to analyze (text, audio transcript, or video transcript).'),
  referenceMaterial: z.string().optional().describe('Optional user-provided reference material to consider in the analysis.'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const LinkedFallacySchema = z.object({
  fallacy: z.string().describe('Specific fallacy type linked to the framing/signalling.'),
  evidence: z.string().describe('Textual evidence for this fallacy within the framing/signalling.'),
});

const HistoricalParallelSchema = z.object({
  example: z.string().describe('Historical figure or movement.'),
  description: z.string().describe('Description of the similar tactic used.'),
});

const AnalyzeContentOutputSchema = z.object({
  summary: z.string().describe('A concise overview of your findings.'),
  scripturalAnalysis: z.array(z.object({
    verse: z.string(),
    analysis: z.string(),
  })).describe('Verse-by-verse or thematic analysis against KJV 1611.'),
  historicalContext: z.string().describe('General historical context.'),
  etymology: z.string().describe('Etymology of key terms used in the content.'),
  exposure: z.string().describe('Potential exposure of the content to harmful ideologies.'),
  fallacies: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).describe('Identified general logical fallacies in reasoning (Overall).'),
  manipulativeTactics: z.array(z.object({
    technique: z.string(),
    description: z.string(),
  })).describe('Identified general manipulative rhetorical strategies (Overall).'),

  moralisticFramingAnalysis: z.object({
    description: z.string().describe('Assessment of whether the content presents teachings primarily via rules, duties, or human moral effort, potentially underemphasizing grace or divine agency. Note appeals to moral superiority or condemnation.'),
    advantagesForSpeakerObedience: z.string().describe('How this moralistic framing might afford the speaker advantages in securing listener/congregational obedience.'),
    linkedLogicalFallacies: z.array(LinkedFallacySchema).describe('Specific logical fallacies employed within this moralistic framing and provide textual evidence.'),
    historicalParallels: z.array(HistoricalParallelSchema).describe('Up to two general historical examples where figures/movements used similar moralistic framing tactics (focus on method similarity).'),
  }).describe('Analysis of moralistic framing in the content.'),

  virtueSignallingAnalysis: z.object({
    description: z.string().describe('Assessment of whether the speaker employs language primarily to signal their own (or group\'s) moral uprightness, piety, or adherence to certain values, possibly for social validation or authority, rather than purely for edification.'),
    advantagesForSpeakerObedience: z.string().describe('How this virtue signalling might afford the speaker advantages in securing listener/congregational obedience or admiration.'),
    linkedLogicalFallacies: z.array(LinkedFallacySchema).describe('Specific logical fallacies employed within this virtue signalling and provide textual evidence.'),
    historicalParallels: z.array(HistoricalParallelSchema).describe('Up to two general historical examples where figures/movements used similar virtue signalling tactics (e.g., public displays of piety).'),
  }).describe('Analysis of virtue signalling in the content.'),

  identifiedIsms: z.array(z.object({
    ism: z.string(),
    description: z.string(),
    evidence: z.string(),
  })).describe('Identified theological "isms".'),
  calvinismAnalysis: z.array(z.object({
    element: z.string(),
    description: z.string(),
    evidence: z.string(),
    infiltrationTactic: z.string().optional(),
  })).describe('Analysis of Calvinistic influence against KJV 1611.'),

  biblicalRemonstrance: z.object({
    scripturalFoundationAssessment: z.string().describe('Assessment of the content\'s scriptural foundation based on KJV 1611.'),
    historicalTheologicalContextualization: z.string().describe('Contextualization of the content within historical theology from a KJV 1611 perspective.'),
    rhetoricalAndHomileticalObservations: z.string().describe('Observations on the content\'s rhetoric and homiletics.'),
    theologicalFrameworkRemarks: z.string().describe('Remarks on the overarching theological framework of the content compared to KJV 1611 orthodoxy.'),
    kjvScripturalCounterpoints: z.string().describe('Specific KJV 1611 scriptural counterpoints to problematic assertions in the content.'),
    suggestionsForFurtherStudy: z.string().describe('Suggestions for further KJV 1611-based study related to the content.'),
  }).describe('Detailed Biblical Remonstrance: A critical assessment based on KJV 1611.'),

  potentialManipulativeSpeakerProfile: z.string().describe('Based on the tactics and framing identified, a general profile of the personality type or characteristics that might be at work. Focus on patterns discernable from the text.'),
  guidanceOnWiseConfrontation: z.string().describe('General, biblically-informed principles (KJV 1611 based) for wisely confronting and exposing such actions or teachings, emphasizing truth, love, and discernment.'),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}

const analyzeContentPrompt = ai.definePrompt({
  name: 'analyzeContentPrompt',
  input: {schema: AnalyzeContentInputSchema},
  output: {schema: AnalyzeContentOutputSchema},
  prompt: `You are an expert theologian and discerning analyst, specializing in evaluating religious content against the King James Version (KJV) 1611 Bible's orthodoxy. Conduct a rigorous scholarly examination of the provided sermon or teaching content.

Content to Analyze:
{{{content}}}

{{#if referenceMaterial}}
Additionally, consider the following user-provided reference material in your analysis:
--- REFERENCE MATERIAL START ---
{{{referenceMaterial}}}
--- REFERENCE MATERIAL END ---
{{/if}}

Produce a structured theological assessment by populating all fields in the output schema. Pay close attention to the "biblicalRemonstrance" object and its sub-fields, ensuring each is addressed thoroughly:

1.  **Overall Summary**: Provide a concise overview of your findings.
2.  **Scriptural Analysis (KJV 1611)**: Verse-by-verse or thematic analysis against KJV 1611.
3.  **Historical Context**: General historical context.
4.  **Etymology of Key Terms**: Analyze impactful theological terms.
5.  **Exposure to Harmful Ideologies**: Assess based on KJV 1611.
6.  **Identified Logical Fallacies (Overall)**: Detail any general logical fallacies in reasoning.
7.  **Identified Manipulative Tactics (Overall)**: Detail any general manipulative rhetorical strategies.
8.  **Moralistic Framing Analysis**:
    *   description: Assess if the content presents teachings primarily via rules, duties, or human moral effort, potentially underemphasizing grace or divine agency. Note appeals to moral superiority or condemnation.
    *   advantagesForSpeakerObedience: How might this framing afford the speaker advantages in securing listener/congregational obedience?
    *   linkedLogicalFallacies: Identify specific logical fallacies employed *within this moralistic framing* and provide textual evidence. (Return as an array of objects, each with 'fallacy' and 'evidence' strings).
    *   historicalParallels: Describe up to two general historical examples where figures/movements used *similar* moralistic framing tactics (focus on method similarity, e.g., emphasis on strict adherence to specific codes for acceptance/status). (Return as an array of objects, each with 'example' and 'description' strings).
9.  **Virtue Signalling Analysis**:
    *   description: Identify if the speaker employs language primarily to signal their own (or group's) moral uprightness, piety, or adherence to certain values, possibly for social validation or authority, rather than purely for edification.
    *   advantagesForSpeakerObedience: How might this framing afford the speaker advantages in securing listener/congregational obedience or admiration?
    *   linkedLogicalFallacies: Identify specific logical fallacies employed *within this virtue signalling* and provide textual evidence. (Return as an array of objects, each with 'fallacy' and 'evidence' strings).
    *   historicalParallels: Describe up to two general historical examples where figures/movements used *similar* virtue signalling tactics (e.g., public displays of piety to consolidate power or influence). (Return as an array of objects, each with 'example' and 'description' strings).
10. **Identified Theological 'Isms'**: Identify specific "isms" and provide evidence.
11. **Calvinism Analysis (KJV 1611)**: Analyze Calvinistic influences.
12. **Biblical Remonstrance (Detailed Assessment)**: Critical section.
    *   scripturalFoundationAssessment: (string)
    *   historicalTheologicalContextualization: (string)
    *   rhetoricalAndHomileticalObservations: (string)
    *   theologicalFrameworkRemarks: (string)
    *   kjvScripturalCounterpoints: (string - may include multiple points)
    *   suggestionsForFurtherStudy: (string)
13. **Potential Manipulative Speaker Profile**: Based on the tactics and framing identified, provide a general profile of the personality type or characteristics that might be at work. Focus on patterns discernable from the text.
14. **Guidance on Wise Confrontation**: Offer general, biblically-informed principles for wisely confronting and exposing such actions or teachings, emphasizing truth, love, and discernment. (The KJV is the final authority on all matters scriptural, theological and is the reference for all that is being examined.)

Be thorough, objective, and base your entire analysis on the KJV 1611 Bible as the standard. For historical parallels, focus on *similarity of method or tactic* rather than making direct moral equivalencies of the figures themselves, especially if they are controversial. Ensure all fields in the output schema are populated as applicable. Your response MUST be a valid JSON object that conforms to the AnalyzeContentOutputSchema.
`,
});

const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async input => {
    const {output} = await analyzeContentPrompt(input);
    return output!;
  }
);
