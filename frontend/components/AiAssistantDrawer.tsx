import React, { useState, useRef, useEffect } from 'react';
import {
  CatalogTopic,
  ChatMessage,
  ChatSessionContext,
  LearningResource,
  AssistantCitation
} from '../types';
import { chatAssistantService } from '../services/chatAssistantService';
import {
  Sparkles,
  Send,
  X,
  ExternalLink,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Square,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AiAssistantDrawerProps {
  activeTopic: CatalogTopic | null;
  activeResource?: LearningResource | null;
  learningGoal?: string;
  onClose: () => void;
  onNavigateToTopic?: (topicId: string) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  activeTopic,
  activeResource,
  learningGoal,
  onClose,
  onNavigateToTopic
}) => {
  // Messages log initialized with clean starter greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const starterGreeting: ChatMessage = {
      id: 'greeting_0',
      sender: 'assistant',
      text: activeResource
        ? `Hello! I am your Vertex AI Learning Assistant for **${activeResource.title}** (${activeTopic?.title || 'Active Topic'}). What concepts, implementation details, or specification questions can I help you clarify?`
        : activeTopic
        ? `Hello! I am your Vertex AI Learning Assistant grounded in **${activeTopic.title}**. What concept, event loop phase, or systems architecture doubt would you like to explore?`
        : `Hello! I am your real-time AI Learning Assistant. Select any topic or resource from your roadmap to start contextual doubt solving!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: activeTopic?.officialDocSources?.map((src, i) => ({
        id: `init_src_${i}`,
        title: src.title,
        url: src.url,
        authorityName: src.authorityName,
        provenance: 'canonical_spec'
      }))
    };
    return [starterGreeting];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Context bundle
  const sessionContext: ChatSessionContext = {
    learningGoal: learningGoal || 'Master Production Node.js Architecture',
    activeTopic,
    activeResource,
    prerequisites: activeTopic?.prerequisiteIds || [],
    verificationReportSummary: activeResource?.verificationReport?.findings?.[0]
  };

  // Pre-configured pedagogical starter suggestions
  const starterPrompts = [
    'Explain this concept simply.',
    'Give me a practical code example.',
    'Explain this execution step by step.',
    'What should I understand before this topic?',
    activeResource ? 'Help me understand a key concept from this resource.' : 'Compare this with standard synchronous I/O.'
  ];

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleClearConversation = () => {
    handleStopGeneration();
    setErrorMessage(null);
    setMessages([
      {
        id: `greeting_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. I am grounded in **${activeTopic?.title || 'Backend Architecture'}**. What would you like to ask next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: activeTopic?.officialDocSources?.map((s, i) => ({
          id: `clr_${i}`,
          title: s.title,
          url: s.url,
          authorityName: s.authorityName,
          provenance: 'canonical_spec'
        }))
      }
    ]);
  };

  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputQuestion).trim();
    if (!query || isStreaming) return;

    setErrorMessage(null);
    const userMsgId = `usr_${Date.now()}`;
    const assistantMsgId = `ast_${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topicContextId: activeTopic?.id,
      resourceContextId: activeResource?.id
    };

    // Placeholder message for progressive streaming
    const streamingPlaceholder: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      topicContextId: activeTopic?.id
    };

    setMessages((prev) => [...prev, userMessage, streamingPlaceholder]);
    setInputQuestion('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await chatAssistantService.streamQuery(
        query,
        messages,
        sessionContext,
        {
          onChunk: (accumulated) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, text: accumulated, isStreaming: true }
                  : m
              )
            );
          },
          onComplete: (fullText, citations) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      text: fullText,
                      isStreaming: false,
                      citations,
                      groundingStatus: citations.length > 0 ? 'grounded_in_canonical_docs' : 'general_knowledge_fallback'
                    }
                  : m
              )
            );
            setIsStreaming(false);
            abortControllerRef.current = null;
          },
          onError: (err) => {
            setErrorMessage(err.message || 'Vertex AI stream encountered a connection interruption.');
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      text: m.text.length > 0 ? m.text : 'I was unable to complete the response due to a service timeout or interruption. Please retry.',
                      isStreaming: false,
                      hasError: true
                    }
                  : m
              )
            );
            setIsStreaming(false);
            abortControllerRef.current = null;
          }
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.message?.includes('aborted') || err.message?.includes('cancelled')) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: m.text + ' [Generation stopped by user]', isStreaming: false }
              : m
          )
        );
      } else {
        setErrorMessage(err.message || 'Failed to initialize AI stream.');
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyCodeOrText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetryLastQuery = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'student');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-white">AI Learning Assistant</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                Gemini 2.5 Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[280px]">
              {activeResource
                ? `Context: ${activeResource.title}`
                : activeTopic
                ? `Context: ${activeTopic.title}`
                : 'General Backend Context'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearConversation}
            title="Clear current session"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              handleStopGeneration();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Grounding Context Bar */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1.5 truncate text-slate-300">
          <Building className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-400">Grounding:</span>
          <span className="font-semibold text-slate-200 truncate">
            {activeTopic ? activeTopic.title : 'Node.js Core Specifications'}
          </span>
        </div>

        {activeTopic?.prerequisiteIds && activeTopic.prerequisiteIds.length > 0 && (
          <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
            {activeTopic.prerequisiteIds.length} Prereqs
          </span>
        )}
      </div>

      {/* Error Alert Bar */}
      {errorMessage && (
        <div className="bg-rose-950/40 border-b border-rose-500/40 p-2.5 px-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleRetryLastQuery}
            className="text-xs bg-rose-900/60 hover:bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Starter Suggestions (Shown when only greeting exists) */}
      {messages.length <= 1 && (
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Suggested questions for this session:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${msg.sender === 'student' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}
            >
              {/* Message Body */}
              <div className="whitespace-pre-wrap font-sans">
                {msg.text ? (
                  msg.text
                ) : msg.isStreaming ? (
                  <span className="inline-flex items-center space-x-1 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-300" />
                    <span className="ml-1 text-[11px]">Formulating response from specifications...</span>
                  </span>
                ) : null}
              </div>

              {/* Citations Grounding block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-700 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-cyan-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Authoritative Grounding Citations:</span>
                  </div>
                  <div className="space-y-1">
                    {msg.citations.map((c, idx) => (
                      <a
                        key={idx}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition"
                      >
                        <span className="truncate pr-2">• {c.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Footer: Timestamp & Copy */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>{msg.timestamp}</span>

                {msg.sender === 'assistant' && msg.text && (
                  <button
                    onClick={() => handleCopyCodeOrText(msg.text, msg.id)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Streaming Stop Control & Input Area */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95 space-y-2">
        {isStreaming && (
          <div className="flex items-center justify-center">
            <button
              onClick={handleStopGeneration}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-sm transition"
            >
              <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>Stop Generating</span>
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Assistant is streaming answer...' : 'Ask a doubt, request code, or clarify a phase...'}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isStreaming}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition shadow-md shadow-indigo-600/30"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center">
          Grounds answers in official specifications; distinguishes general explanations from cited standards.
        </p>
      </div>
    </div>
  );
};
