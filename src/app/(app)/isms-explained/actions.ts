
'use server';

import { 
  chatWithInternetKJV, 
  type ChatWithInternetKJVInput, 
  type ChatWithInternetKJVOutput 
} from '@/ai/flows/chat-with-internet-kjv-flow';

// Renamed the original function to make its role clearer as an internal helper.
async function callChatWithInternetKJVFlow(
  input: ChatWithInternetKJVInput
): Promise<ChatWithInternetKJVOutput | { error: string }> {
  try {
    const result = await chatWithInternetKJV(input);
    return result;
  } catch (error) {
    console.error("Error in callChatWithInternetKJVFlow:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during AI chat for 'isms'.";
     if (error instanceof Error && 'details' in error) {
        console.error("Error details:", (error as any).details);
    }
    return { error: errorMessage };
  }
}

// This is the Server Action that will be passed to AiChatDialog from IsmsExplainedPage
export async function generalIsmChatAction(
  userQuestion: string,
  _contextFromDialog: string // This context is typically the initialContextOrPrompt from AiChatDialog
): Promise<ChatWithInternetKJVOutput | { error: string }> {
  // For the general 'isms' chat, we'll use a fixed topicContext.
  // _contextFromDialog could be used if we wanted the AI to consider the dialog's initial prompt as part of its context more directly.
  return callChatWithInternetKJVFlow({ userQuestion, topicContext: "General Isms Discussion" });
}
    
