import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[TTS] Request received');
    console.log('[TTS] GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    
    const { text } = await request.json();
    console.log('[TTS] Text to synthesize:', text);
    
    if (!text) {
      console.error('[TTS] No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-J',
            ssmlGender: 'MALE',
          },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      }
    );

    const data = await response.json();
    console.log('[TTS] Google API response status:', response.status);
    
    if (data.error) {
      console.error('[TTS] Google API error:', JSON.stringify(data.error, null, 2));
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    console.log('[TTS] Audio content length:', data.audioContent?.length || 0);
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TTS] Error:', errorMessage);
    console.error('[TTS] Stack:', error instanceof Error ? error.stack : '');
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
