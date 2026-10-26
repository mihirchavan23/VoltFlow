'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Zap,
  Lightbulb,
  Fan,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { parseEnglishVoiceIntent, ParsedVoiceIntent } from '@/lib/nlp/voiceIntentParser';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (params: {
    device: 'light' | 'fan';
    action: 'on' | 'off' | 'eco' | 'normal' | 'speed' | 'set_timer';
    value?: number;
    duration_seconds?: number;
    timer_action?: 'on' | 'off';
  }) => Promise<{ success: boolean; error?: string }>;
  onCancelTimer?: (device: 'light' | 'fan') => Promise<void>;
  lightOn?: boolean;
  fanSpeed?: number;
}

export function VoiceControlModal({
  isOpen,
  onClose,
  onExecuteCommand,
  onCancelTimer,
  lightOn,
  fanSpeed,
}: VoiceControlModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap the microphone to speak');
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [waveformBars, setWaveformBars] = useState<number[]>([30, 60, 45, 80, 55, 90, 40, 70, 50]);

  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setStatusMessage('Speech recognition not supported in this browser. Use quick command chips below.');
      }
    }
  }, []);

  // Animate audio waveform when listening
  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setWaveformBars(
        Array.from({ length: 9 }, () => Math.floor(Math.random() * 70) + 25)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isListening]);

  // Voice feedback synthesizer
  const speakFeedback = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // English Natural Language Intent Parser
  const parseVoiceCommand = useCallback(
    (rawText: string): ParsedVoiceIntent[] | null => {
      return parseEnglishVoiceIntent(rawText, { lightOn, fanSpeed });
    },
    [lightOn, fanSpeed]
  );

  // Execute recognized commands (single or compound)
  const executeIntents = useCallback(
    async (intents: ParsedVoiceIntent[]) => {
      if (!intents || intents.length === 0) return;

      const descriptions = intents.map((i) => i.humanDescription).join(' & ');
      setStatusMessage(`Executing: ${descriptions}...`);
      speakFeedback(intents[0].humanDescription);
      setLastExecuted(descriptions);

      for (const intent of intents) {
        await onExecuteCommand({
          device: intent.device,
          action: intent.action,
          value: intent.value,
          duration_seconds: intent.duration_seconds,
          timer_action: intent.timer_action,
        });
      }

      setStatusMessage(`Executed: ${descriptions}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    [onExecuteCommand, onClose, speakFeedback]
  );

  // Process any speech transcript through the English NLP engine
  const handleProcessTranscript = useCallback(
    (textToProcess: string) => {
      const clean = textToProcess.trim();
      if (!clean) return;

      const intents = parseVoiceCommand(clean);
      if (intents && intents.length > 0) {
        executeIntents(intents);
      } else {
        setStatusMessage(`Could not understand: "${clean}". Try conversational English like "it's too dark", "crank up the fan", or "turn off light in 5 minutes"`);
      }
    },
    [parseVoiceCommand, executeIntents]
  );

  // Toggle listening
  const handleToggleListen = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setStatusMessage('Listening... Speak naturally in English');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Check if final result is available
        if (event.results[0].isFinal) {
          handleProcessTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access denied. Please allow microphone permissions.');
        } else {
          setStatusMessage(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
      setStatusMessage('Could not activate microphone.');
    }
  }, [isListening, handleProcessTranscript]);

  // Conversational English voice prompt chips
  const QUICK_COMMANDS = [
    { label: '💡 "Turn on the lamp"', text: 'turn on the lamp' },
    { label: '🌑 "It\'s too dark here"', text: 'it is too dark in here' },
    { label: '🛑 "Kill the lights"', text: 'kill the lights' },
    { label: '🌿 "Save power / Eco mode"', text: 'save power' },
    { label: '🔥 "It\'s hot, blast the fan"', text: 'it is hot in here' },
    { label: '🌀 "Fan to maximum"', text: 'set fan to maximum' },
    { label: '💨 "Gentle breeze / Speed 1"', text: 'set fan to low' },
    { label: '❄️ "It\'s chilly, stop fan"', text: 'it is chilly stop fan' },
    { label: '⏱️ "Turn off light in 5 minutes"', text: 'turn off light in 5 minutes' },
    { label: '⏱️ "Fan timer for thirty seconds"', text: 'fan timer for thirty seconds' },
    { label: '🗑️ "Cancel light timer"', text: 'cancel light timer' },
    { label: '🌙 "Good night (All off)"', text: 'good night' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#070e1c] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] p-5 sm:p-7 overflow-hidden text-white box-border">
        {/* Futuristic glowing backdrop effect */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                <span>VoltFlow AI Voice</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  HUD v2.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">Speak commands naturally to control lighting & fan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Microphone & Waveform Visualizer */}
        <div className="my-6 flex flex-col items-center justify-center relative z-10">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring when listening */}
            {isListening && (
              <span className="absolute -inset-4 rounded-full bg-cyan-400/20 animate-ping" />
            )}
            <button
              onClick={handleToggleListen}
              className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-[0_0_35px_rgba(244,63,94,0.6)] scale-105'
                  : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
              )}
            </button>
          </div>

          {/* Audio frequency wave visualizer */}
          <div className="flex items-center gap-1.5 mt-5 h-8">
            {waveformBars.map((h, idx) => (
              <div
                key={idx}
                style={{ height: isListening ? `${h}%` : '6px' }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-gradient-to-t from-cyan-500 to-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Live Transcript / Feedback Banner */}
          <div className="mt-3 text-center px-4 w-full">
            <div className="text-xs sm:text-sm font-mono text-cyan-300 min-h-[22px] font-semibold break-words">
              {transcript ? `"${transcript}"` : statusMessage}
            </div>
            {lastExecuted && (
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Last command: {lastExecuted}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Command Suggestions Chips */}
        <div className="pt-3 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Or Tap Quick Commands</span>
            <span className="text-[10px] text-cyan-400 font-normal lowercase">instant dispatch</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.text}
                type="button"
                onClick={() => {
                  handleProcessTranscript(cmd.text);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700/80 hover:border-cyan-400/50 text-[11px] text-slate-300 hover:text-cyan-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>{cmd.label}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Voice HUD
          </button>
        </div>
      </div>
    </div>
  );
}
