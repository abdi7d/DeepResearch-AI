import React, { useState, useEffect } from 'react';
import { Conversation } from '../types/client.types.js';
import { Search, Trash2, MessageSquare, X, Plus, FileText, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced live search across title and content
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.getConversations(trimmed);
        setSearchResults(results);
      } catch {
        // Fallback to client-side filtering if API fails
        const fallback = conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(trimmed.toLowerCase()) ||
            (c.snippet && c.snippet.toLowerCase().includes(trimmed.toLowerCase()))
        );
        setSearchResults(fallback);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, conversations]);

  // Use search results if active search term, otherwise show all conversations
  const displayedConversations = search.trim() ? (searchResults ?? []) : conversations;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-over sidebar with luxury glassmorphism */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-84 bg-[#0E1217]/85 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white tracking-tight">Research History</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Search Section */}
        <div className="p-3 border-b border-white/[0.06] space-y-2.5">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2 px-3 text-xs font-medium text-neutral-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Research Topic</span>
          </button>

          {/* Search Input Field for Title or Content */}
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or content..."
              className="w-full bg-[#141822]/70 border border-white/[0.08] rounded-lg pl-8 pr-8 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-[#141822] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Status / Filter Metadata */}
          {search.trim() && (
            <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-0.5">
              <span>
                {isSearching
                  ? 'Searching...'
                  : `${displayedConversations.length} ${
                      displayedConversations.length === 1 ? 'result' : 'results'
                    } found`}
              </span>
              <button
                onClick={() => setSearch('')}
                className="text-amber-400/90 hover:text-amber-300 transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {displayedConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">
                {search.trim() ? 'No matching investigations found' : 'No previous investigations yet'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {search.trim()
                  ? 'Try searching with different title keywords or discussion topics.'
                  : 'Start a new inquiry to begin research.'}
              </p>
              {search.trim() && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 px-3 py-1 rounded-md text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            displayedConversations.map((c) => {
              const isActive = c.id === activeId;
              const hasContentMatch = c.matchType === 'content' && c.snippet;

              return (
                <div
                  key={c.id}
                  className={`group relative flex flex-col rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30 shadow-sm'
                      : 'text-neutral-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10'
                  }`}
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate flex-1">
                      <p className="truncate font-medium text-neutral-200 group-hover:text-white">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                        <span>
                          {new Date(c.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {c.matchType && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400/80 font-mono text-[9px] uppercase tracking-wider">
                              Matched {c.matchType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 rounded transition-opacity shrink-0"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Matching content snippet excerpt if matched by body content */}
                  {hasContentMatch && (
                    <div className="mt-2 pt-2 border-t border-white/[0.05] text-[11px] text-neutral-400 italic font-sans leading-relaxed line-clamp-2 bg-black/20 p-1.5 rounded-md">
                      "{c.snippet}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0A0D12] text-[11px] text-neutral-500 flex items-center justify-between">
          <span>{conversations.length} Investigations</span>
          <span className="text-amber-400/80 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Search Active</span>
          </span>
        </div>
      </aside>
    </>
  );
};
