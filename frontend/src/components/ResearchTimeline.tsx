import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Cpu,
  Layers,
} from 'lucide-react';
import { SourceReference, StructuredResearch } from '../types/client.types.js';

interface ResearchTimelineProps {
  isResearching: boolean;
  agentState: string;
  statusMessage?: string;
  searchQueries: string[];
  sources: SourceReference[];
  pagesOpened: Array<{ url: string; title: string; charCount?: number }>;
  structuredResearch?: StructuredResearch | null;
  onOpenSourceModal?: (source: SourceReference) => void;
  onOpenTelemetry?: () => void;
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({
  isResearching,
  agentState,
  statusMessage,
  searchQueries,
  sources,
  pagesOpened,
  structuredResearch,
  onOpenSourceModal,
  onOpenTelemetry,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isUnderstandingDone = searchQueries.length > 0 || sources.length > 0;
  const isSearchDone = sources.length > 0 && !isResearching;
  const isReadingDone = pagesOpened.length > 0 || (structuredResearch !== null && structuredResearch !== undefined);
  const isResearchDone = structuredResearch !== null && structuredResearch !== undefined;

  return (
    <div className="w-full rounded-2xl border border-white/12 bg-[#0E1218]/70 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all mb-6">
      {/* Header bar */}
      <div
        className="px-4 py-3.5 bg-white/[0.02] border-b border-white/[0.07] flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(212,175,55,0.15)]">
            {isResearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Cpu className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200">
                Agent 1: Autonomous Web Research
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded tracking-wide ${
                  isResearching
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isResearching ? agentState || 'INVESTIGATING' : 'SYNTHESIS COMPLETE'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {statusMessage ||
                (isResearching
                  ? 'Gathering live evidence and discovering authoritative sources...'
                  : `Discovered ${sources.length} sources · Analyzed ${pagesOpened.length} full documents`)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTelemetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTelemetry();
              }}
              className="text-[11px] font-medium text-neutral-300 hover:text-amber-300 px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] transition-colors flex items-center gap-1 shadow-sm"
            >
              <Layers className="w-3 h-3 text-amber-400/80" />
              <span>Inspect Logs</span>
            </button>
          )}

          <button className="p-1 text-neutral-400 hover:text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Workflow Steps */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Timeline steps with frosted glass cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Scoping */}
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-1.5">
                {isUnderstandingDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                )}
                <span className="font-semibold text-neutral-200">1. Problem Scoping</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Deconstructs intent into keyword queries & domain constraints.
              </p>
            </div>

            {/* Step 2: Web Search */}
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-1.5">
                {isSearchDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : searchQueries.length > 0 ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                <span className="font-semibold text-neutral-200">
                  2. Web Queries ({searchQueries.length})
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {searchQueries.length > 0
                  ? `"${searchQueries[searchQueries.length - 1]}"`
                  : 'Formulating web queries...'}
              </p>
            </div>

            {/* Step 3: Source Verification */}
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-1.5">
                {sources.length > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                <span className="font-semibold text-neutral-200">
                  3. Evidence ({sources.length} sources)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {sources.length > 0
                  ? `${sources.length} unique domains verified`
                  : 'Evaluating relevance...'}
              </p>
            </div>

            {/* Step 4: Deep Reading */}
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-1.5">
                {isReadingDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : pagesOpened.length > 0 ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                <span className="font-semibold text-neutral-200">
                  4. Deep Read ({pagesOpened.length} pages)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {pagesOpened.length > 0
                  ? `${pagesOpened.reduce((acc, p) => acc + (p.charCount || 0), 0).toLocaleString()} chars parsed`
                  : 'Inspects full documents for quotes'}
              </p>
            </div>
          </div>

          {/* Active Search Queries List */}
          {searchQueries.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-medium text-neutral-400 mb-1.5 block">
                Executed Web Searches:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {searchQueries.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] text-[11px] text-neutral-300 shadow-sm"
                  >
                    <Search className="w-2.5 h-2.5 text-amber-400" />
                    <span>{q}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Discovered Sources Preview Strip */}
          {sources.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-neutral-400">
                  Discovered Sources ({sources.length}):
                </span>
                <span className="text-[10px] text-amber-400/90 font-medium">Click citation badge to inspect</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {sources.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onOpenSourceModal && onOpenSourceModal(s)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#141820]/60 backdrop-blur-md hover:bg-[#1a202c]/80 hover:border-amber-500/40 text-left transition-colors group shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {s.index}
                    </span>
                    <span className="text-neutral-200 font-medium truncate max-w-[180px]">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 group-hover:text-amber-400/80 shrink-0">
                      {s.domain}
                    </span>
                    <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
