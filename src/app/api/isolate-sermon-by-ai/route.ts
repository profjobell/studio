
import { NextRequest, NextResponse } from 'next/server';
import { isolateSermonAI, type IsolateSermonAIInput } from '@/ai/flows/isolateSermonAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = body.transcript;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required and must be a string.' }, { status: 400 });
    }

    const input: IsolateSermonAIInput = { transcript };
    const result = await isolateSermonAI(input); // Call the Genkit flow

    // The result should now match IsolateSermonAIOutput: { sermon: string, prayers: Array<{ prayer: string }>, warning?: string }
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/isolate-sermon-by-ai:', error);
    if (error.issues) { // ZodError
        return NextResponse.json({ error: 'Invalid input for AI processing.', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to process sermon and prayers using AI.' }, { status: 500 });
  }
}
