
'use server';

import { 
  chatWithInternetKJV, 
  type ChatWithInternetKJVInput, 
  type ChatWithInternetKJVOutput,
  type ChatMessageHistory
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

// This is the Server Action that will be passed to AiChatDialog from IsmsExplainedPage and HeresiesHistoryPage
export async function generalIsmChatAction(
  userQuestion: string,
  _contextFromDialog: string, // This context is typically the initialContextOrPrompt from AiChatDialog
  chatHistory?: ChatMessageHistory[] // Added chatHistory parameter
): Promise<ChatWithInternetKJVOutput | { error: string }> {
  // Use the context passed from the dialog (which can be the list of heresies or a general ism context)
  return callChatWithInternetKJVFlow({ 
    userQuestion, 
    topicContext: _contextFromDialog, // Pass the specific context from the page
    chatHistory 
  });
}
    
