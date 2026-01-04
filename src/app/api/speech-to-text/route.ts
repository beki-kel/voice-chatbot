import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[STT] Request received');
    console.log('[STT] GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    
    if (!audioFile) {
      console.error('[STT] No audio file in request');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('[STT] Audio file size:', audioFile.size, 'bytes');
    console.log('[STT] Audio file type:', audioFile.type);

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    console.log('[STT] Base64 audio length:', base64Audio.length);

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
          },
          audio: { content: base64Audio },
        }),
      }
    );

    const data = await response.json();
    console.log('[STT] Google API response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('[STT] Google API error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Concatenate all results for longer audio
    const transcript = data.results
      ?.map((r: { alternatives?: { transcript?: string }[] }) => r.alternatives?.[0]?.transcript || '')
      .join('') || '';
    console.log('[STT] Transcript:', transcript);
    return NextResponse.json({ transcript });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[STT] Error:', errorMessage);
    console.error('[STT] Stack:', error instanceof Error ? error.stack : '');
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
