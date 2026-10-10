import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DocsViewerProps {
  onClose: () => void;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'context' | 'plan'>('context');

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
              <p className="text-xs text-slate-400">Live inspection of PROJECT_CONTEXT.md and IMPLEMENTATION_PLAN.md</p>
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
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 space-x-2 text-xs">
          <button
            onClick={() => setActiveDoc('context')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeDoc === 'context'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PROJECT_CONTEXT.md
          </button>
          <button
            onClick={() => setActiveDoc('plan')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeDoc === 'plan'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            IMPLEMENTATION_PLAN.md
          </button>
        </div>

        {/* Doc Content Container */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 space-y-4 leading-relaxed bg-slate-950">
          {activeDoc === 'context' ? (
            <div className="space-y-3">
              <h1 className="text-lg font-bold text-white font-sans"># Project Context: CogniPath AI</h1>
              <p className="text-slate-400">
                CogniPath is an autonomous self-learning platform engineered for students and independent developers.
                It emphasizes strict prerequisite sequencing and official-documentation verification over unvalidated content generation.
              </p>

              <h2 className="text-sm font-bold text-indigo-300 font-sans mt-4">## Core Learning Cycle</h2>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                Syllabus Ingestion → Structured Topic Extraction → Prerequisite Roadmap → Curated Resources → Official Docs Verification → Real-Time Doubt Solving → Diagnostic Practice → Weak Subtopic Analysis → Explainable Recommendation.
              </div>

              <h2 className="text-sm font-bold text-indigo-300 font-sans mt-4">## Roles Implemented</h2>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Student:</strong> Upload/edit syllabus, review roadmaps, discover verified materials, ask doubts via Gemini tutor, and run diagnostics.</li>
                <li><strong className="text-slate-200">Administrator:</strong> Manage the catalog, verify prerequisite trees, manage resource metadata, and inspect audit logs.</li>
              </ul>

              <h2 className="text-sm font-bold text-indigo-300 font-sans mt-4">## Technical & AI Constraints</h2>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>AI Provider: Google Vertex AI / Gemini 2.5 Flash with structured response schemas.</li>
                <li>Zero fabricated ratings, dates, or verification citations.</li>
                <li>Fallback gracefully to "Unable to verify" when external documentation cannot be confirmed.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h1 className="text-lg font-bold text-white font-sans"># Implementation Plan & Execution Status</h1>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 0 & 1: Skeleton, Design System, & Shared Layouts</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Tailwind responsive layout, Navbar, status badges, role switcher.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 2 & 3: Syllabus Ingestion & Prerequisite Roadmaps</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Gemini curriculum parsing, editable topic table, and dependency graph.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 4 & 5: Resource Discovery & Official Doc Verification</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Resource cards with verified status badges, benchmark modal vs Node.js specs.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 6: Real-Time AI Doubt Assistant (Vertex AI/Gemini)</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Topic-grounded tutor with question chips and spec citations.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 7: Diagnostic Assessments & Evidence-Based Subtopic Analysis</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Quiz scoring, subtopic tagging, and explainable next-action recommendations.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-emerald-300">Phase 8: Admin Tools & Governance Console</strong>
                    <p className="text-slate-400 text-[11px]">Completed: Topic catalog additions, prerequisite edge inspection, resource registry.</p>
                  </div>
                </div>
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
