import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { SourceReference } from '../types/client.types.js';

interface MarkdownRendererProps {
  content: string;
  sources?: SourceReference[];
  onCitationClick?: (index: number) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  sources = [],
  onCitationClick,
}) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Pre-process citations: [1], [2], [1, 2]
  const renderInlineFormatted = (text: string) => {
    // Regex splits by citations like [1] or [1, 2]
    const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[([\d,\s]+)\]$/);
      if (match) {
        const numbers = match[1].split(',').map((n) => parseInt(n.trim(), 10));
        return (
          <span key={i} className="inline-flex items-center gap-0.5 mx-1 align-baseline">
            {numbers.map((num) => {
              const src = sources.find((s) => s.index === num);
              return (
                <button
                  key={num}
                  onClick={() => onCitationClick && onCitationClick(num)}
                  title={src ? `${src.title} (${src.domain})` : `Source [${num}]`}
                  className="inline-flex items-center justify-center px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  [{num}]
                </button>
              );
            })}
          </span>
        );
      }

      // Format bold, italics, inline code inside standard text
      return <span key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(part) }} />;
    });
  };

  // Block level parser
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let codeBlockCount = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code Block
      if (line.trim().startsWith('```')) {
        const lang = line.trim().substring(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const fullCode = codeLines.join('\n');
        const currentIdx = codeBlockCount++;

        elements.push(
          <div
            key={`code-${i}`}
            className="my-4 rounded-xl border border-white/[0.08] bg-[#0B0D13] overflow-hidden text-xs font-mono"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                {lang}
              </span>
              <button
                onClick={() => handleCopyCode(fullCode, currentIdx)}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-300 transition-colors"
              >
                {copiedCodeIdx === currentIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-neutral-200 leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-white mt-6 mb-3 tracking-tight">
            {renderInlineFormatted(line.substring(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-semibold text-neutral-100 mt-5 mb-2.5 tracking-tight border-b border-white/[0.06] pb-1.5">
            {renderInlineFormatted(line.substring(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold text-amber-200/90 mt-4 mb-2 tracking-tight">
            {renderInlineFormatted(line.substring(4))}
          </h3>
        );
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 pl-4 border-l-2 border-amber-500/60 text-neutral-300 italic py-1 bg-amber-500/[0.02] rounded-r-lg"
          >
            {renderInlineFormatted(line.substring(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Unordered lists
      if (line.match(/^[-*]\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
          listItems.push(lines[i].replace(/^[-*]\s+/, ''));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-5 list-disc text-neutral-300 marker:text-amber-400/80">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineFormatted(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered lists
      if (line.match(/^\d+\.\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-5 list-decimal text-neutral-300 marker:font-mono marker:text-amber-400/80">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineFormatted(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Table detection
      if (line.includes('|') && lines[i + 1]?.includes('|') && lines[i + 1]?.includes('-')) {
        const headerRow = line.split('|').filter(Boolean).map((s) => s.trim());
        i += 2; // skip separator row
        const bodyRows: string[][] = [];
        while (i < lines.length && lines[i].includes('|')) {
          bodyRows.push(lines[i].split('|').filter(Boolean).map((s) => s.trim()));
          i++;
        }
        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#141822] text-neutral-100 font-semibold border-b border-white/[0.08]">
                <tr>
                  {headerRow.map((th, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                    {row.map((td, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 font-mono tabular-nums">
                        {renderInlineFormatted(td)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Standard Paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={`p-${i}`} className="my-2.5 text-neutral-200 leading-relaxed text-[14.5px]">
            {renderInlineFormatted(line)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  return <div className="markdown-body leading-relaxed">{renderBlocks()}</div>;
};

// Helper for formatting inline bold, italics, code, and links
function formatInlineMarkdown(text: string): string {
  let res = text;
  // bold **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  // italic *text*
  res = res.replace(/\*(.*?)\*/g, '<em class="italic text-neutral-300">$1</em>');
  // inline code `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-white/[0.08] text-amber-200 font-mono text-[13px]">$1</code>'
  );
  // links [title](url)
  res = res.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:underline inline-flex items-center gap-0.5">$1</a>'
  );
  return res;
}
