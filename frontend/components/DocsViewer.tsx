import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, ClipboardCheck, Compass } from 'lucide-react';

interface DocsViewerProps {
  onClose: () => void;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'system' | 'roadmap' | 'verification' | 'plan'>('system');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">CogniPath AI — Student Platform Specification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Architecture, AI Roadmap Generation, and Verification Standards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 pt-2 space-x-2 text-xs overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveDoc('system')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'system'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>STUDENT_ARCHITECTURE.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('roadmap')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'roadmap'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI_ROADMAP_SYNTHESIS.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('verification')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'verification'
                ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFICATION_ENGINE.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('plan')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex-shrink-0 ${
              activeDoc === 'plan'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            IMPLEMENTATION_PLAN.md
          </button>
        </div>

        {/* Doc Content Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed bg-white dark:bg-slate-950 overscroll-contain">
          {activeDoc === 'system' && (
            <div className="space-y-4">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans"># Student-Exclusive Architecture</h1>
              <p className="text-slate-600 dark:text-slate-400">
                CogniPath AI is designed strictly for student learners. All administrative workflows, developer roles, and role-switching interfaces have been purged from user-facing surfaces. Maintenance occurs through backend code, migrations, and developer testing.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs font-sans uppercase tracking-wider">
                  Core Student Learning Loop:
                </h3>
                <p className="text-slate-800 dark:text-slate-200 text-xs font-sans">
                  Goal Input (Any Skill / Syllabus) ➔ Vertex AI Roadmap Synthesis ➔ Prerequisite Graph Unlocking ➔ Verified Official Resources ➔ Real-time Doubt Assistant ➔ Diagnostic Assessment ➔ Weak-Topic Evidence ➔ Deterministic Next Action.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'roadmap' && (
            <div className="space-y-4">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans"># AI Roadmap Synthesis & Multi-Roadmap Engine</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Students can enter any free-form learning goal (e.g. Android Kotlin, React, SQL, Java Spring Boot, Machine Learning). Vertex AI Gemini 2.5 Flash synthesizes a tailored curriculum decomposed into phases and acyclic prerequisite nodes.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-600 dark:text-cyan-400 font-sans block text-xs uppercase">
                  DFS Cycle Guard:
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  All AI-generated prerequisite relationships are sanitized using Depth-First Search cycle detection to guarantee a valid Directed Acyclic Graph (DAG) before persistence.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'verification' && (
            <div className="space-y-4">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans"># Official Documentation Verification Engine</h1>
              <p className="text-slate-600 dark:text-slate-400">
                CogniPath does not generate ungrounded content. Instead, it extracts verifiable claims from accessible educational material and checks them against canonical Node.js and WHATWG specifications.
              </p>
            </div>
          )}

          {activeDoc === 'plan' && (
            <div className="space-y-3">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans"># Implementation Plan Status</h1>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300">
                All student milestones (0 through 8) including AI roadmaps for any skill, multi-roadmap storage, and responsive Light/Dark modes are completed and tested.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
