import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LANGUAGE_COACH_SYSTEM_PROMPT } from '@/lib/prompts';

type Message = { role: 'user' | 'assistant'; content: string };

async function chatWithOpenAI(messages: Message[]): Promise<string> {
  console.log('[OpenAI] Starting request with', messages.length, 'messages');
  console.log('[OpenAI] API Key present:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: LANGUAGE_COACH_SYSTEM_PROMPT },
      ...messages,
    ],
  });
  
  console.log('[OpenAI] Response:', JSON.stringify(response.choices[0], null, 2));
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }
  return content;
}

async function chatWithAnthropic(messages: Message[]): Promise<string> {
  console.log('[Anthropic] Starting request with', messages.length, 'messages');
  console.log('[Anthropic] API Key present:', !!process.env.ANTHROPIC_API_KEY);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: LANGUAGE_COACH_SYSTEM_PROMPT,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });
  
  console.log('[Anthropic] Response:', JSON.stringify(response.content, null, 2));
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || !('text' in textBlock)) {
    throw new Error('Anthropic returned empty response');
  }
  return textBlock.text;
}

async function chatWithGemini(messages: Message[]): Promise<string> {
  console.log('[Gemini] Starting request with', messages.length, 'messages');
  console.log('[Gemini] API Key present:', !!process.env.GOOGLE_GEMINI_API_KEY);
  
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
  }
  
  const history = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  
  console.log('[Gemini] Request body:', JSON.stringify({ contents: history }, null, 2));
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: history,
        systemInstruction: { parts: [{ text: LANGUAGE_COACH_SYSTEM_PROMPT }] },
      }),
    }
  );
  
  const data = await response.json();
  console.log('[Gemini] Response:', JSON.stringify(data, null, 2));
  
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider = process.env.DEFAULT_LLM_PROVIDER || 'openai' } = body;
    
    console.log('[Chat API] Request received');
    console.log('[Chat API] Provider:', provider);
    console.log('[Chat API] Messages:', JSON.stringify(messages, null, 2));
    
    if (!messages || !Array.isArray(messages)) {
      console.error('[Chat API] Invalid messages format:', messages);
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    let response: string;
    
    switch (provider) {
      case 'anthropic':
        response = await chatWithAnthropic(messages);
        break;
      case 'gemini':
        response = await chatWithGemini(messages);
        break;
      case 'openai':
      default:
        response = await chatWithOpenAI(messages);
        break;
    }

    console.log('[Chat API] Final response:', response);
    return NextResponse.json({ response, provider });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Chat API] Error:', errorMessage);
    console.error('[Chat API] Stack:', errorStack);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
