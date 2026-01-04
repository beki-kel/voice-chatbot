'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export const VOICES = [
  { id: 'en-US-Neural2-J', name: 'James', gender: 'Male', accent: 'US' },
  { id: 'en-US-Neural2-D', name: 'David', gender: 'Male', accent: 'US' },
  { id: 'en-US-Neural2-H', name: 'Hannah', gender: 'Female', accent: 'US' },
  { id: 'en-US-Neural2-F', name: 'Fiona', gender: 'Female', accent: 'US' },
  { id: 'en-GB-Neural2-B', name: 'Brian', gender: 'Male', accent: 'UK' },
  { id: 'en-GB-Neural2-A', name: 'Amy', gender: 'Female', accent: 'UK' },
  { id: 'en-AU-Neural2-B', name: 'Bruce', gender: 'Male', accent: 'AU' },
  { id: 'en-AU-Neural2-A', name: 'Ava', gender: 'Female', accent: 'AU' },
] as const;

export function useVoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [provider, setProvider] = useState('gemini');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Typing animation effect
  useEffect(() => {
    if (streamingText && currentTypingIndex < streamingText.length) {
      typingIntervalRef.current = setTimeout(() => {
        // Type faster for spaces and punctuation, slower for words
        const char = streamingText[currentTypingIndex];
        const delay = char === ' ' ? 20 : char.match(/[.,!?]/) ? 80 : 30;
        setCurrentTypingIndex(prev => prev + 1);
      }, 30);
    }
    return () => {
      if (typingIntervalRef.current) clearTimeout(typingIntervalRef.current);
    };
  }, [streamingText, currentTypingIndex]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Please allow microphone access to continue');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsProcessing(true);
        setStreamingText('');
        setCurrentTypingIndex(0);

        try {
          // Speech to Text
          const formData = new FormData();
          formData.append('audio', audioBlob);
          const sttRes = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
          const sttData = await sttRes.json();
          
          if (sttData.error) throw new Error(sttData.error);
          if (!sttData.transcript) throw new Error('No speech detected. Please try again.');

          const userMessage: Message = { role: 'user', content: sttData.transcript };
          const newMessages = [...messages, userMessage];
          setMessages(newMessages);

          // Chat with LLM
          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages, provider }),
          });
          const chatData = await chatRes.json();
          
          if (chatData.error) throw new Error(chatData.error);

          // Start typing animation
          setStreamingText(chatData.response);
          setIsProcessing(false);

          // Text to Speech (start immediately while typing)
          setIsSpeaking(true);
          const ttsRes = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chatData.response, voice }),
          });
          const ttsData = await ttsRes.json();
          
          if (ttsData.error) {
            console.error('TTS Error:', ttsData.error);
            // Continue without audio
            setIsSpeaking(false);
            // Add message after typing completes
            setTimeout(() => {
              setMessages(prev => [...prev, { role: 'assistant', content: chatData.response }]);
              setStreamingText('');
              setCurrentTypingIndex(0);
            }, chatData.response.length * 30 + 500);
            return;
          }

          // Play audio
          const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            setMessages(prev => [...prev, { role: 'assistant', content: chatData.response }]);
            setStreamingText('');
            setCurrentTypingIndex(0);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            setMessages(prev => [...prev, { role: 'assistant', content: chatData.response }]);
            setStreamingText('');
            setCurrentTypingIndex(0);
          };
          await audio.play();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
          console.error('Processing error:', err);
          setIsProcessing(false);
          setIsSpeaking(false);
        }
        resolve();
      };
      mediaRecorderRef.current!.stop();
    });
  }, [messages, provider, voice]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Finalize the message
    if (streamingText) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingText }]);
      setStreamingText('');
      setCurrentTypingIndex(0);
    }
    setIsSpeaking(false);
  }, [streamingText]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingText('');
    setCurrentTypingIndex(0);
  }, []);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    isRecording, isProcessing, isSpeaking, messages, provider, error,
    startRecording, stopRecording, stopSpeaking, setProvider, clearMessages,
    streamingText, currentTypingIndex, voice, setVoice,
  };
}
