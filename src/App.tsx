import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { ChatInput } from './components/ChatInput.js';
import { ResearchTimeline } from './components/ResearchTimeline.js';
import { MarkdownRenderer } from './components/MarkdownRenderer.js';
import { SourcesDrawer } from './components/SourcesDrawer.js';
import { ResearchLogsModal } from './components/ResearchLogsModal.js';
import { ArchitectureModal } from './components/ArchitectureModal.js';
import { AuthModal } from './components/AuthModal.js';
import { api } from './services/api.js';
import {
  User,
  Conversation,
  Message,
  SourceReference,
  StructuredResearch,
  ResearchLogEntry,
} from './types/client.types.js';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export default function App() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceReference | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Active Research State (Real-time SSE)
  const [isResearching, setIsResearching] = useState(false);
  const [agentState, setAgentState] = useState<string>('IDLE');
  const [agentStatusMessage, setAgentStatusMessage] = useState<string>('');
  const [activeSearchQueries, setActiveSearchQueries] = useState<string[]>([]);
  const [discoveredSources, setDiscoveredSources] = useState<SourceReference[]>([]);
  const [pagesOpened, setPagesOpened] = useState<
    Array<{ url: string; title: string; charCount?: number }>
  >([]);
  const [currentStructuredResearch, setCurrentStructuredResearch] =
    useState<StructuredResearch | null>(null);
  const [streamingAnswerText, setStreamingAnswerText] = useState<string>('');
  const [activeLogs, setActiveLogs] = useState<ResearchLogEntry[]>([]);
  const [activeExecutionTime, setActiveExecutionTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on streaming content
  useEffect(() => {
    if (isResearching || streamingAnswerText) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingAnswerText, isResearching, discoveredSources.length]);

  // Initial Auth & Conversations bootstrap
  useEffect(() => {
    async function init() {
      try {
        const authRes = await api.me();
        if (authRes?.user) {
          setUser(authRes.user);
        } else {
          // Auto create or use guest session
          const guestRes = await api.guest();
          setUser(guestRes.user);
        }

        const convs = await api.getConversations();
        setConversations(convs);
      } catch (err) {
        console.warn('Initial session check:', err);
      }
    }
    init();
  }, []);

  // Fetch messages when conversation changes
  const handleSelectConversation = async (id: string) => {
    try {
      setActiveConversationId(id);
      setErrorMessage(null);
      const data = await api.getConversation(id);
      setMessages(data.messages);
      // Reset live research stream states
      setIsResearching(false);
      setStreamingAnswerText('');
      setDiscoveredSources([]);
      setActiveSearchQueries([]);
      setPagesOpened([]);
      setCurrentStructuredResearch(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load conversation');
    }
  };

  const handleNewResearch = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputPrompt('');
    setIsResearching(false);
    setStreamingAnswerText('');
    setDiscoveredSources([]);
    setActiveSearchQueries([]);
    setPagesOpened([]);
    setCurrentStructuredResearch(null);
    setErrorMessage(null);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewResearch();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete conversation');
    }
  };

  // Submit Inquiry & Orchestrate Streaming
  const handleSubmit = async (overridePrompt?: string) => {
    const question = (overridePrompt || inputPrompt).trim();
    if (!question || isResearching) return;

    setInputPrompt('');
    setErrorMessage(null);
    setIsResearching(true);
    setAgentState('UNDERSTANDING');
    setAgentStatusMessage('Analyzing inquiry & scoping knowledge domain...');
    setActiveSearchQueries([]);
    setDiscoveredSources([]);
    setPagesOpened([]);
    setCurrentStructuredResearch(null);
    setStreamingAnswerText('');
    setActiveLogs([]);

    const startTime = Date.now();

    // Optimistically add user message to list
    const tempUserMsg: Message = {
      id: `temp_user_${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let accumulatedAnswer = '';
      let latestSources: SourceReference[] = [];
      let latestStructured: StructuredResearch | null = null;

      await api.streamChat({
        message: question,
        conversationId: activeConversationId || undefined,
        onEvent: (event) => {
          switch (event.type) {
            case 'agent_state':
              setAgentState(event.data.state);
              if (event.data.message) setAgentStatusMessage(event.data.message);
              break;

            case 'conversation_updated':
              if (event.data.conversationId) {
                setActiveConversationId(event.data.conversationId);
                // Refresh conversations list
                api.getConversations().then(setConversations);
              }
              break;

            case 'search_started':
              setActiveSearchQueries((prev) => [...prev, event.data.query]);
              break;

            case 'source_found':
              setDiscoveredSources((prev) => {
                if (prev.some((s) => s.url === event.data.url)) return prev;
                const next = [...prev, event.data];
                latestSources = next;
                return next;
              });
              break;

            case 'page_opened':
              setPagesOpened((prev) => [
                ...prev,
                {
                  url: event.data.url,
                  title: event.data.title,
                  charCount: event.data.charCount,
                },
              ]);
              break;

            case 'research_completed':
              setCurrentStructuredResearch(event.data);
              latestStructured = event.data;
              if (event.data.sources) {
                setDiscoveredSources(event.data.sources);
                latestSources = event.data.sources;
              }
              break;

            case 'answer_chunk':
              accumulatedAnswer += event.data.chunk;
              setStreamingAnswerText(accumulatedAnswer);
              break;

            case 'answer_completed':
              accumulatedAnswer = event.data.answer;
              setStreamingAnswerText(accumulatedAnswer);
              if (event.data.sources) {
                latestSources = event.data.sources;
              }
              break;

            case 'error':
              setErrorMessage(event.data.message || 'Research error occurred.');
              break;
          }
        },
      });

      // Synthesis finalized: persist to assistant message
      const finalAssistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: accumulatedAnswer,
        sources: latestSources,
        structuredResearch: latestStructured || undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, finalAssistantMsg]);
      setIsResearching(false);
      setStreamingAnswerText('');
      setActiveExecutionTime(Date.now() - startTime);

      // Refresh conversations list to sync titles
      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'An error occurred during research.');
      setIsResearching(false);
    }
  };

  const handleCopyAnswer = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExportMarkdown = (msg: Message) => {
    let md = `# Research Report: ${conversations.find((c) => c.id === activeConversationId)?.title || 'DeepResearch AI'}\n\n`;
    md += `${msg.content}\n\n`;
    if (msg.sources && msg.sources.length > 0) {
      md += `## Verified Sources & Evidence\n\n`;
      msg.sources.forEach((s) => {
        md += `[${s.index}] **${s.title}** (${s.domain})\nURL: ${s.url}\n\n`;
      });
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#090C10] text-[#E5E9F0] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Header */}
      <Header
        user={user}
        onNewChat={handleNewResearch}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={async () => {
          await api.logout();
          setUser(null);
          handleNewResearch();
        }}
        onOpenArchitecture={() => setIsArchOpen(true)}
      />

      {/* History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewResearch}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Research Encountered An Error</span>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => handleSubmit()}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State / Welcome Screen */}
        {messages.length === 0 && !isResearching ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 sm:py-20 relative">
            {/* Ambient luxury backdrop element */}
            <div className="absolute inset-0 max-w-lg mx-auto opacity-15 pointer-events-none blur-3xl bg-gradient-to-tr from-amber-500/30 to-amber-200/10 rounded-full" />

            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-500/40 shadow-[0_0_40px_rgba(212,175,55,0.18)] mb-6 bg-neutral-900 flex items-center justify-center">
              <img
                src="/src/assets/images/aethelgard_emblem_mark_1791435456992.jpg"
                alt="DeepResearch AI"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white mb-2">
              DeepResearch AI
            </h1>
            <p className="text-xs sm:text-sm font-medium tracking-wider uppercase text-amber-300/90 mb-3">
              Agentic AI Web Research System
            </p>
            <p className="text-sm sm:text-base text-neutral-400 max-w-lg mb-8 leading-relaxed font-light">
              Dual-agent architecture for rigorous investigations. The Research Agent crawls, reads, and cross-examines the live web; the Answer Agent synthesizes grounded intelligence with verifiable citations.
            </p>

            {/* Input Box */}
            <div className="w-full">
              <ChatInput
                input={inputPrompt}
                setInput={setInputPrompt}
                onSubmit={() => handleSubmit()}
                isLoading={isResearching}
                onSuggestionClick={(prompt) => {
                  setInputPrompt(prompt);
                  handleSubmit(prompt);
                }}
              />
            </div>
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="flex-1 flex flex-col space-y-8 pb-32">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className="space-y-4">
                {/* User Message */}
                {msg.role === 'user' ? (
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-2xl rounded-2xl bg-[#141822]/80 backdrop-blur-xl border border-white/12 px-5 py-3.5 text-sm text-neutral-100 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                      <p className="leading-relaxed font-medium">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  /* Assistant Message with luxury glassmorphism */
                  <div className="rounded-2xl border border-white/12 bg-[#0E1218]/75 backdrop-blur-xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-6">
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-serif text-xs border border-amber-500/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                          Æ
                        </div>
                        <span className="font-semibold text-neutral-200">
                          Grounded Synthesis
                        </span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-emerald-400/90 flex items-center gap-1 font-mono text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{msg.sources?.length || 0} Verified Sources</span>
                        </span>
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyAnswer(msg.content, msg.id)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-[11px]"
                          title="Copy Answer"
                        >
                          {copiedMessageId === msg.id ? (
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

                        <button
                          onClick={() => handleExportMarkdown(msg)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-[11px]"
                          title="Export Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    {/* Markdown Body with Interactive Citations */}
                    <MarkdownRenderer
                      content={msg.content}
                      sources={msg.sources}
                      onCitationClick={(num) => {
                        const target = msg.sources?.find((s) => s.index === num);
                        if (target) setSelectedSource(target);
                      }}
                    />

                    {/* Sources Grid Card Strip with Glassmorphism */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-4 border-t border-white/[0.07] space-y-2.5">
                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                          Primary Sources & Citations
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.sources.map((src) => (
                            <div
                              key={src.id}
                              onClick={() => setSelectedSource(src)}
                              className="p-3 rounded-xl border border-white/[0.08] bg-[#141822]/65 backdrop-blur-md hover:bg-[#191f2c]/85 hover:border-amber-500/40 cursor-pointer transition-all flex items-start gap-2.5 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                            >
                              <span className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                {src.index}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-amber-200 transition-colors">
                                  {src.title}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                                  <span>{src.domain}</span>
                                  {src.publishedAt && <span>· {src.publishedAt}</span>}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 shrink-0 mt-0.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* In-Flight Real-Time Research Progress Card */}
            {isResearching && (
              <div className="space-y-4">
                <ResearchTimeline
                  isResearching={isResearching}
                  agentState={agentState}
                  statusMessage={agentStatusMessage}
                  searchQueries={activeSearchQueries}
                  sources={discoveredSources}
                  pagesOpened={pagesOpened}
                  structuredResearch={currentStructuredResearch}
                  onOpenSourceModal={(src) => setSelectedSource(src)}
                  onOpenTelemetry={() => setIsLogsModalOpen(true)}
                />

                {/* Live Token Streaming Output */}
                {streamingAnswerText && (
                  <div className="rounded-2xl border border-white/12 bg-[#0E1218]/75 backdrop-blur-xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2 text-xs text-neutral-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="font-semibold text-neutral-200">
                        Agent 2: Answer Agent Streaming...
                      </span>
                    </div>

                    <MarkdownRenderer
                      content={streamingAnswerText}
                      sources={discoveredSources}
                      onCitationClick={(num) => {
                        const target = discoveredSources.find((s) => s.index === num);
                        if (target) setSelectedSource(target);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Floating Bottom Input Bar during active conversation */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#090C10] via-[#090C10]/85 to-transparent backdrop-blur-sm pt-6 pb-5 px-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              input={inputPrompt}
              setInput={setInputPrompt}
              onSubmit={() => handleSubmit()}
              isLoading={isResearching}
            />
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <SourcesDrawer source={selectedSource} onClose={() => setSelectedSource(null)} />

      <ResearchLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={activeLogs}
        structuredResearch={currentStructuredResearch}
        executionTimeMs={activeExecutionTime}
      />

      <ArchitectureModal isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          api.getConversations().then(setConversations);
        }}
      />
    </div>
  );
}
