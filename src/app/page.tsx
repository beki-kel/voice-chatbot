'use client';

import { useVoiceChat, VOICES } from '@/hooks/useVoiceChat';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const {
    isRecording, isProcessing, isSpeaking, messages, provider, error,
    startRecording, stopRecording, stopSpeaking, setProvider, clearMessages,
    streamingText, currentTypingIndex, voice, setVoice,
  } = useVoiceChat();

  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const isDisabled = isProcessing;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Close voice menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentVoice = VOICES.find(v => v.id === voice) || VOICES[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <main className="min-h-[100dvh] bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
              <span className="text-base sm:text-lg">🎯</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-base sm:text-lg truncate">Fluent</h1>
              <p className="text-[10px] sm:text-xs text-white/50 truncate">AI Language Coach</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Voice Selector */}
            <div className="relative" ref={voiceMenuRef}>
              <button
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                disabled={isDisabled || isSpeaking}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs sm:text-sm transition disabled:opacity-50"
              >
                <span className="text-white/60">🎙️</span>
                <span className="hidden sm:inline text-white/80">{currentVoice.name}</span>
                <span className="sm:hidden text-white/80">{currentVoice.name.slice(0, 3)}</span>
                <svg className={`w-3 h-3 text-white/40 transition-transform ${showVoiceMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showVoiceMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                  <div className="p-2 border-b border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider px-2">Select Voice</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {VOICES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setVoice(v.id); setShowVoiceMenu(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition ${
                          voice === v.id ? 'bg-violet-500/20 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{v.name}</span>
                          <span className="text-white/40 text-xs ml-2">{v.gender}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/50">{v.accent}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Provider Pills */}
            <div className="flex gap-0.5 sm:gap-1 bg-white/5 p-0.5 sm:p-1 rounded-full shrink-0">
              {[
                { id: 'gemini', icon: '✨', label: 'Gemini' },
                { id: 'openai', icon: '🧠', label: 'GPT' },
                { id: 'anthropic', icon: '🎭', label: 'Claude' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  disabled={isDisabled || isSpeaking}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                    provider === p.id
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  } disabled:opacity-50`}
                >
                  <span className="hidden xs:inline">{p.icon} </span>{p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {messages.length === 0 && !streamingText && (
            <div className="text-center py-10 sm:py-20 px-2">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <span className="text-3xl sm:text-5xl">🗣️</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to practice?</h2>
              <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-6 sm:mb-8">
                I'm your personal language coach. Tap the mic and start speaking — 
                I'll help you improve your fluency and confidence.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {['Small talk', 'Interview prep', 'Pronunciation', 'Grammar'].map((tip) => (
                  <span key={tip} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-full text-xs sm:text-sm text-white/60">
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
            <div className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                <span className="text-xs sm:text-sm">🎯</span>
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-16 sm:top-20 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-red-500/90 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm text-center z-20">
          {error}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="border-t border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky bottom-0 safe-area-bottom">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Recording Visualizer */}
          {isRecording && (
            <div className="flex justify-center gap-0.5 sm:gap-1 mb-3 sm:mb-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 sm:w-1 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 6}px`,
                    animationDelay: `${i * 50}ms`,
                    animationDuration: '0.5s',
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Clear Button */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isDisabled || isSpeaking}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition disabled:opacity-50"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Main Mic Button */}
            <button
              onClick={isRecording ? stopRecording : (isSpeaking ? stopSpeaking : startRecording)}
              disabled={isProcessing}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 touch-manipulation ${
                isRecording
                  ? 'bg-red-500 scale-110'
                  : isSpeaking
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:scale-105 active:scale-95'
              } disabled:opacity-50 disabled:scale-100`}
            >
              {/* Pulse rings */}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                  <span className="absolute inset-[-6px] sm:inset-[-8px] rounded-full border-2 border-red-500/30 animate-pulse" />
                </>
              )}
              
              {isProcessing ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isSpeaking ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : isRecording ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>

            {/* Spacer for symmetry */}
            {messages.length > 0 && <div className="w-10 sm:w-12" />}
          </div>

          {/* Status Text */}
          <p className="text-center text-xs sm:text-sm text-white/40 mt-2 sm:mt-3">
            {isRecording ? 'Listening... tap to send' : 
             isProcessing ? 'Processing...' :
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
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <span className="text-xs sm:text-sm">🎯</span>
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-tr-sm'
            : 'bg-white/5 rounded-tl-sm'
        }`}
      >
        <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
          {isTyping && <span className="inline-block w-0.5 h-3.5 sm:h-4 bg-white/60 ml-0.5 animate-pulse" />}
        </p>
      </div>
    </div>
  );
}
