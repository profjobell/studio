import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-content.ts';
import '@/ai/flows/calvinism-deep-dive.ts';
import '@/ai/flows/analyze-teaching-flow.ts';
import '@/ai/flows/chat-with-report-flow.ts';
import '@/ai/flows/explain-fallacy-flow.ts'; // Added new flow
import '@/ai/flows/generate-fallacy-quiz-question-flow.ts'; // Added new flow
