
'use server';

import { 
  chatWithInternetKJV, 
  type ChatWithInternetKJVInput, 
  type ChatWithInternetKJVOutput 
} from '@/ai/flows/chat-with-internet-kjv-flow';

export async function getIsmExplanationChatAction(
  input: ChatWithInternetKJVInput
): Promise<ChatWithInternetKJVOutput | { error: string }> {
  try {
    // Input validation is implicitly handled by the Genkit flow's inputSchema
    const result = await chatWithInternetKJV(input);
    return result;
  } catch (error) {
    console.error("Error in getIsmExplanationChatAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during AI chat for 'isms'.";
     if (error instanceof Error && 'details' in error) {
        console.error("Error details:", (error as any).details);
    }
    return { error: errorMessage };
  }
}

    