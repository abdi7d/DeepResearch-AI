import React, { useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, Loader2, Compass } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  onSuggestionClick?: (prompt: string) => void;
}

const SAMPLE_QUESTIONS = [
  'What are the latest breakthroughs in autonomous AI agent architectures?',
  'Recent advances in quantum error correction and topological qubits',
  'Comparison of multimodal diffusion models versus autoregressive vision-language systems',
  'Latest discoveries in longevity research and cellular rejuvenation',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  onSuggestionClick,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Input container with subtle luxury glassmorphism */}
      <div className="relative rounded-2xl border border-white/12 bg-[#0E1218]/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 focus-within:border-amber-500/40 focus-within:shadow-[0_12px_40px_0_rgba(0,0,0,0.5),0_0_24px_0_rgba(212,175,55,0.08),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or enter a research topic..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-[14px] text-neutral-100 placeholder:text-neutral-500 resize-none focus:outline-none leading-relaxed"
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span className="hidden sm:inline-flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400/80" />
              <span>Dual-Agent Autonomous Web Search</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono text-neutral-400">↵ Enter</kbd> to search
            </span>
            <button
              onClick={() => onSubmit()}
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition-all shadow-md active:scale-95"
              title="Initiate Research"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested prompts strip */}
      {onSuggestionClick && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(q)}
              className="text-[11px] text-neutral-400 hover:text-amber-200 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07] border border-white/[0.08] hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all text-left truncate max-w-[280px] sm:max-w-none shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
