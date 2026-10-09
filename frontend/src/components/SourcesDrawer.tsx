import React from 'react';
import { X, ExternalLink, ShieldCheck, Globe, Calendar } from 'lucide-react';
import { SourceReference } from '../types/client.types.js';

interface SourcesDrawerProps {
  source: SourceReference | null;
  onClose: () => void;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/12 bg-[#0F131A]/85 backdrop-blur-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm flex items-center justify-center">
              {source.index}
            </span>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 block">
                Primary Web Citation
              </span>
              <h3 className="text-base font-semibold text-white line-clamp-2">
                {source.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content details */}
        <div className="py-4 space-y-3.5 text-xs">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 text-neutral-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-neutral-300">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{source.domain}</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Web Grounded</span>
            </span>

            {source.publishedAt && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-neutral-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{source.publishedAt}</span>
              </span>
            )}
          </div>

          {/* Snippet / Extracted Quote */}
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
              Retrieved Evidence & Snippet:
            </span>
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141822] text-neutral-300 leading-relaxed max-h-48 overflow-y-auto">
              {source.snippet || 'Document retrieved and verified during autonomous research run.'}
            </div>
          </div>

          {/* Full URL */}
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
              Verified Web URL:
            </span>
            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-[#0A0D12] text-neutral-400 font-mono text-[11px] truncate select-all">
              {source.url}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-neutral-950 bg-amber-300 hover:bg-amber-200 transition-colors shadow-sm"
          >
            <span>Visit Webpage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
