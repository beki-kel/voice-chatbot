'use client';

import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useEffect, useRef } from 'react';

export default function Home() {
  const {
    isRecording, isProcessing, isSpeaking, messages, provider, error,
    startRecording, stopRecording, stopSpeaking, setProvider, clearMessages,
    streamingText, currentTypingIndex,
  } = useVoiceChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDisabled = isProcessing;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg">Fluent</h1>
              <p className="text-xs text-white/50">AI Language Coach</p>
            </div>
          </div>
          
          {/* Provider Pills */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-full">
            {[
              { id: 'gemini', icon: '✨', label: 'Gemini' },
              { id: 'openai', icon: '🧠', label: 'GPT' },
              { id: 'anthropic', icon: '🎭', label: 'Claude' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                disabled={isDisabled || isSpeaking}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  provider === p.id
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !streamingText && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <span className="text-5xl">🗣️</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to practice?</h2>
              <p className="text-white/50 max-w-md mx-auto mb-8">
                I'm your personal language coach. Tap the mic and start speaking — 
                I'll help you improve your fluency, pronunciation, and confidence.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Practice small talk', 'Job interview prep', 'Pronunciation help', 'Grammar check'].map((tip) => (
                  <span key={tip} className="px-3 py-1.5 bg-white/5 rounded-full text-sm text-white/60">
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble 
              key={i} 
              message={msg} 
              isTyping={false}
              displayText={msg.content}
            />
          ))}

          {/* Streaming message */}
          {streamingText && (
            <MessageBubble 
              message={{ role: 'assistant', content: streamingText }}
              isTyping={currentTypingIndex < streamingText.length}
              displayText={streamingText.slice(0, currentTypingIndex)}
            />
          )}

          {/* Processing indicator */}
          {isProcessing && !streamingText && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                <span className="text-sm">🎯</span>
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
          {error}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="border-t border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Recording Visualizer */}
          {isRecording && (
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animationDelay: `${i * 50}ms`,
                    animationDuration: '0.5s',
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            {/* Clear Button */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isDisabled || isSpeaking}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Main Mic Button */}
            <button
              onClick={isRecording ? stopRecording : (isSpeaking ? stopSpeaking : startRecording)}
              disabled={isProcessing}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 scale-110'
                  : isSpeaking
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:scale-105'
              } disabled:opacity-50 disabled:scale-100`}
            >
              {/* Pulse rings */}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                  <span className="absolute inset-[-8px] rounded-full border-2 border-red-500/30 animate-pulse" />
                </>
              )}
              
              {isProcessing ? (
                <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isSpeaking ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : isRecording ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>

            {/* Spacer for symmetry */}
            {messages.length > 0 && <div className="w-12" />}
          </div>

          {/* Status Text */}
          <p className="text-center text-sm text-white/40 mt-3">
            {isRecording ? 'Listening... tap to send' : 
             isProcessing ? 'Processing your message...' :
             isSpeaking ? 'Tap to stop' : 
             'Tap to speak'}
          </p>
        </div>
      </div>
    </main>
  );
}

function MessageBubble({ 
  message, 
  isTyping, 
  displayText 
}: { 
  message: { role: 'user' | 'assistant'; content: string };
  isTyping: boolean;
  displayText: string;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <span className="text-sm">🎯</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-tr-sm'
            : 'bg-white/5 rounded-tl-sm'
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {displayText}
          {isTyping && <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse" />}
        </p>
      </div>
    </div>
  );
}
