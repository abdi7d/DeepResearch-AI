import React from 'react';
import { X, Clock, Search, BookOpen, Cpu, ShieldAlert } from 'lucide-react';
import { ResearchLogEntry, StructuredResearch } from '../types/client.types.js';

interface ResearchLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs?: ResearchLogEntry[];
  structuredResearch?: StructuredResearch | null;
  executionTimeMs?: number;
}

export const ResearchLogsModal: React.FC<ResearchLogsModalProps> = ({
  isOpen,
  onClose,
  logs = [],
  structuredResearch,
  executionTimeMs = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/12 bg-[#0E1218]/85 backdrop-blur-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Agent Telemetry & Audit Logs</h3>
              <p className="text-xs text-neutral-400">
                Verifiable execution trail of tool calls and source evaluations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Stats Banner */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b border-white/[0.06] text-center">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Total Latency
            </span>
            <span className="text-sm font-semibold font-mono text-neutral-200">
              {(executionTimeMs / 1000).toFixed(2)}s
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Confidence Rating
            </span>
            <span className="text-sm font-semibold font-mono uppercase text-emerald-400">
              {structuredResearch?.confidence || 'High'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Synthesized Findings
            </span>
            <span className="text-sm font-semibold font-mono text-amber-300">
              {structuredResearch?.keyFindings?.length || 0} Points
            </span>
          </div>
        </div>

        {/* Structured Findings Overview */}
        {structuredResearch?.keyFindings && structuredResearch.keyFindings.length > 0 && (
          <div className="py-3 border-b border-white/[0.06]">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">
              Extracted Research Claims:
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {structuredResearch.keyFindings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#141822] border border-white/[0.05] text-xs"
                >
                  <p className="font-medium text-neutral-200">{f.claim}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{f.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflict report if any */}
        {structuredResearch?.conflicts && structuredResearch.conflicts.length > 0 && (
          <div className="py-3 border-b border-white/[0.06] text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Observed Conflicts in Web Evidence:</span>
            </div>
            {structuredResearch.conflicts.map((c, idx) => (
              <p key={idx} className="text-neutral-300 pl-5 text-[11px]">
                · {c}
              </p>
            ))}
          </div>
        )}

        {/* Step by step logs */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
          <h4 className="text-xs font-semibold text-neutral-400 mb-2">Execution Timeline:</h4>
          {logs.length === 0 ? (
            <p className="text-neutral-500 italic text-[11px]">
              Active session execution logs recorded dynamically.
            </p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.01] border border-white/[0.04]"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-300">{log.message}</span>
                    {log.tool && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-amber-300">
                        {log.tool}
                      </span>
                    )}
                  </div>
                  {log.outputSummary && (
                    <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                      {log.outputSummary}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
