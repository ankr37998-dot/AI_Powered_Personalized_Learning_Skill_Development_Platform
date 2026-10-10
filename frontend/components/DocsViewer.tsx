import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, ClipboardCheck, FlaskConical, ShieldAlert } from 'lucide-react';

interface DocsViewerProps {
  onClose: () => void;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'admin' | 'verification' | 'audit' | 'context' | 'plan'>('admin');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Project Architecture & Implementation Specification</h2>
              <p className="text-xs text-slate-400">Live inspection of Admin Governance, Verification, Context, and Plans</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 space-x-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveDoc('admin')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'admin'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ADMIN_GOVERNANCE.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('verification')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'verification'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFICATION_ENGINE.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('audit')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeDoc === 'audit'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>INSPECTION_REPORT.md</span>
          </button>
          <button
            onClick={() => setActiveDoc('context')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex-shrink-0 ${
              activeDoc === 'context'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PROJECT_CONTEXT.md
          </button>
          <button
            onClick={() => setActiveDoc('plan')}
            className={`px-3 py-2 font-semibold border-b-2 transition flex-shrink-0 ${
              activeDoc === 'plan'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            IMPLEMENTATION_PLAN.md
          </button>
        </div>

        {/* Doc Content Container */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 space-y-4 leading-relaxed bg-slate-950">
          {activeDoc === 'admin' && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold text-white font-sans"># Admin & Platform Management Specification</h1>
              <p className="text-slate-400">
                CogniPath strictly restricts platform administration to the <code>admin</code> role and implements rigorous server-side safety guards.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm font-sans">1. Role & Access Boundaries</h3>
                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                  <li><strong>Only 2 Roles:</strong> <code>student</code> and <code>admin</code>. No faculty role, cohorts, or teacher workflows.</li>
                  <li><strong>Server Authorization Guard:</strong> <code>adminService.assertAdmin</code> rejects unauthenticated callers (401) and student roles (403).</li>
                  <li><strong>Last-Admin Protection:</strong> The engine prevents demoting or suspending the final active administrator.</li>
                  <li><strong>Zero Sensitive Data Leaks:</strong> User responses exclude password hashes, tokens, or private secrets.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm font-sans">2. Prerequisite Graph Cycle Guard (DFS)</h3>
                <p className="text-slate-400">
                  When adding prerequisite link <code>Target ➔ ProposedPrereq</code>, the engine performs a Depth-First Search starting from <code>ProposedPrereq</code>.
                  If a path reaches <code>Target</code>, a circular dependency chain is detected and blocked with an explainable trace:
                </p>
                <div className="p-2 rounded bg-slate-950 text-rose-300 font-mono text-[11px]">
                  Circular dependency detected: Topic A ➔ Topic B ➔ Topic C ➔ Topic A
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-300 text-sm font-sans">3. Topic Dependency & Deletion Guard</h3>
                <p className="text-slate-400">
                  A topic cannot be deleted if active resources are mapped to it or other catalog topics depend on it as a prerequisite.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'verification' && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold text-white font-sans"># Official Documentation-Based Verification Architecture</h1>
              <p className="text-slate-400">
                CogniPath extracts verifiable claims from accessible educational material and checks them against canonical Node.js and WHATWG specifications.
              </p>
            </div>
          )}

          {activeDoc === 'audit' && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold text-white font-sans"># Repository Inspection & Architectural Audit</h1>
              <p className="text-slate-400">
                Detailed inspection answering core audit questions regarding implemented screens, mock data provenance, and Vertex AI connections.
              </p>
            </div>
          )}

          {activeDoc === 'context' && (
            <div className="space-y-3">
              <h1 className="text-lg font-bold text-white font-sans"># Project Context: CogniPath AI</h1>
              <p className="text-slate-400">
                Autonomous self-learning platform engineered for students and independent developers.
              </p>
            </div>
          )}

          {activeDoc === 'plan' && (
            <div className="space-y-3">
              <h1 className="text-lg font-bold text-white font-sans"># Implementation Plan & Execution Status</h1>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 text-emerald-300">
                All core phases (0 through 8) implemented and verified.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
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
