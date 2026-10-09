import React from 'react';
import { X, Search, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/12 bg-[#0E1218]/85 backdrop-blur-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex flex-col max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
              Dual-Agent System Specifications
            </span>
            <h3 className="text-lg font-semibold text-white">
              Strict Separation of Research & Synthesis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Diagram */}
        <div className="my-5 p-4 rounded-xl border border-white/[0.06] bg-[#141822] text-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            {/* Agent 1 */}
            <div className="flex-1 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.05] w-full">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-2 font-mono font-bold">
                1
              </div>
              <h4 className="font-semibold text-amber-200">Research Agent</h4>
              <p className="text-[11px] text-neutral-400 mt-1">
                Autonomous tool loop: Formulates queries, browses live web, opens pages, extracts quotes, evaluates conflicts.
              </p>
              <div className="mt-2.5 flex justify-center gap-1.5 font-mono text-[10px] text-amber-300">
                <span className="px-1.5 py-0.5 rounded bg-black/40">web_search</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40">open_page</span>
              </div>
            </div>

            <div className="text-neutral-500 rotate-90 sm:rotate-0">
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </div>

            {/* Structured Evidence */}
            <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-[11px] text-neutral-300 shrink-0">
              <span className="font-mono text-amber-400 font-bold block">Structured</span>
              <span>Research Output</span>
            </div>

            <div className="text-neutral-500 rotate-90 sm:rotate-0">
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </div>

            {/* Agent 2 */}
            <div className="flex-1 p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] w-full">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-2 font-mono font-bold">
                2
              </div>
              <h4 className="font-semibold text-emerald-200">Answer Agent</h4>
              <p className="text-[11px] text-neutral-400 mt-1">
                Drafts final grounded prose with mandatory bracketed citations [1], [2]. No direct web access.
              </p>
              <div className="mt-2.5 flex justify-center gap-1.5 font-mono text-[10px] text-emerald-300">
                <span className="px-1.5 py-0.5 rounded bg-black/40">citations</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40">stream</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Safety Guarantees */}
        <div className="space-y-3 text-xs text-neutral-300">
          <h4 className="font-semibold text-neutral-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Built-in Production Security Guarantees</span>
          </h4>

          <ul className="space-y-2 text-[12px] text-neutral-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">SSRF Protection:</strong> The `open_page` tool enforces strict DNS validation, blocking loopback addresses, local network subnets, and cloud metadata endpoints.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Prompt Injection Shield:</strong> All scraped HTML text is explicitly tagged as untrusted external content. Instructions within web pages are isolated from agent instructions.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Zero URL Hallucination:</strong> The Answer Agent can only cite sources provided by the Research Agent. All URLs and citations are verifiable.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Execution Bounds:</strong> Configurable limits on maximum tool calls, search iterations, page fetch sizes, and execution timeouts.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
