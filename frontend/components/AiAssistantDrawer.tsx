import React, { useState } from 'react';
import { CatalogTopic, ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import {
  Sparkles,
  Send,
  X,
  ExternalLink,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Terminal,
  BookOpen
} from 'lucide-react';

interface AiAssistantDrawerProps {
  activeTopic: CatalogTopic | null;
  onClose: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ activeTopic, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: activeTopic
        ? `Hello! I'm your Vertex AI Doubt Solver for **${activeTopic.title}**. What concept or edge case would you like to clarify?`
        : `Hello! I'm your Vertex AI Learning Assistant. Select a topic or ask any backend systems question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: activeTopic?.officialDocSources
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleDoubtChips = [
    'Explain the Poll phase vs Check phase timing with setImmediate()',
    'Why is Buffer.alloc safer than Buffer.allocUnsafe?',
    'How does Node handle backpressure when writable.write returns false?',
    'What happens to active sockets during a graceful SIGTERM in cluster?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuestion;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topicContextId: activeTopic?.id
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const topicTitle = activeTopic ? activeTopic.title : 'Node.js & Backend Architecture';
      const topicSummary = activeTopic ? activeTopic.summary : 'General software engineering runtime questions';

      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'student' ? ('user' as const) : ('model' as const),
          text: m.text
        }));

      const res = await geminiService.askLearningAssistant(topicTitle, topicSummary, query, history);

      const botMessage: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `Error communicating with Vertex AI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-white">AI Learning Assistant</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.2 rounded border border-indigo-500/30">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[280px]">
              {activeTopic ? `Grounded in: ${activeTopic.title}` : 'General Backend Context'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Doubt Chips */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium mb-1.5">Common Doubts for this Topic:</div>
          <div className="flex flex-wrap gap-1.5">
            {sampleDoubtChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 text-left transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${msg.sender === 'student' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-cyan-400 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Cited Official References:
                  </span>
                  {msg.citations.map((c, idx) => (
                    <a
                      key={idx}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-indigo-300 hover:underline truncate"
                    >
                      • {c.title}
                    </a>
                  ))}
                </div>
              )}

              <div
                className={`text-[10px] text-right ${msg.sender === 'student' ? 'text-indigo-200' : 'text-slate-400'}`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Consulting Vertex AI official knowledge base...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
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
            placeholder="Ask a technical doubt or explain this phase..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Answers distinguish official documentation evidence from general model explanations.
        </p>
      </div>
    </div>
  );
};
