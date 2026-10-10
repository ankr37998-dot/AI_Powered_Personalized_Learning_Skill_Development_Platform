import React, { useMemo } from 'react';
import {
  AssessmentAttempt,
  SubtopicAnalysis,
  LearningRecommendation,
  RoadmapNode,
  CatalogTopic
} from '../types';
import { assessmentService } from '../services/assessmentService';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  RotateCcw,
  Info,
  ShieldCheck,
  Check,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';

interface WeakTopicAnalysisProps {
  attempts: AssessmentAttempt[];
  roadmap: RoadmapNode[];
  catalog: CatalogTopic[];
  onSelectRecommendation: (rec: LearningRecommendation) => void;
  onOpenAssistant: (topicId: string) => void;
}

export const WeakTopicAnalysis: React.FC<WeakTopicAnalysisProps> = ({
  attempts,
  roadmap,
  catalog,
  onSelectRecommendation,
  onOpenAssistant
}) => {
  // Compute factual subtopic analysis strictly from attempts with minimum evidence rule (>=2 questions)
  const subtopicAnalyses: SubtopicAnalysis[] = useMemo(() => {
    return assessmentService.analyzeSubtopics(attempts);
  }, [attempts]);

  // Compute explainable next-action recommendation
  const recommendation: LearningRecommendation = useMemo(() => {
    return assessmentService.generateRecommendation(roadmap, catalog, attempts, subtopicAnalyses);
  }, [roadmap, catalog, attempts, subtopicAnalyses]);

  const proficientCount = subtopicAnalyses.filter((s) => s.status === 'proficient').length;
  const weakCount = subtopicAnalyses.filter((s) => s.status === 'needs_revision').length;
  const uncertainCount = subtopicAnalyses.filter((s) => s.status === 'insufficient_evidence').length;
  const totalCompletedAssessments = attempts.length;

  return (
    <div className="space-y-6">
      {/* A. Compact Page Heading (roadmap.sh style, no giant bloated hero) */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Evidence-Based Competency Diagnostics</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Assessment & Diagnostics
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Understand your strengths, identify topics that need revision, and choose the next step based on actual assessment evidence.
        </p>
      </div>

      {/* B. Diagnostic Summary: 4 Compact Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Monitored Subtopics</span>
          <div className="text-xl font-bold text-white mt-1">{subtopicAnalyses.length}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Tagged in curriculum</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Needs Revision</span>
          <div className="text-xl font-bold text-rose-400 mt-1">{weakCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">&lt;70% diagnostic accuracy</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Insufficient Evidence</span>
          <div className="text-xl font-bold text-slate-300 mt-1">{uncertainCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">&lt;2 test questions answered</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Completed Tests</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{totalCompletedAssessments}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Scored on backend</span>
        </div>
      </div>

      {/* C. Compact Recommended Next Step Panel (Clean & Developer-Focused) */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-indigo-400 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
              Recommended Next Step
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">{recommendation.topicTitle}</span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">
            {recommendation.subtopicTarget
              ? `Priority Focus: ${recommendation.subtopicTarget}`
              : recommendation.suggestedActionLabel}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            {recommendation.rationale}
          </p>

          <div className="text-[11px] text-slate-400 pt-0.5 flex items-center space-x-1.5">
            <Info className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span>Basis: {recommendation.evidenceSummary}</span>
          </div>
        </div>

        <button
          onClick={() => onSelectRecommendation(recommendation)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition self-start sm:self-center flex-shrink-0 shadow-sm"
        >
          <span>{recommendation.suggestedActionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* D. Structured Subtopic Evidence List (Clean roadmap.sh style table/rows) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Subtopic Diagnostic Evidence</span>
          </div>
          <span className="text-[11px] text-slate-400">Rule: Min. 2 questions required</span>
        </div>

        {subtopicAnalyses.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <AlertTriangle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p>No diagnostic assessment evidence recorded yet. Take an assessment to evaluate subtopics.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {subtopicAnalyses.map((sub, idx) => {
              const isNeedsRevision = sub.status === 'needs_revision';
              const isProficient = sub.status === 'proficient';
              const isInsufficient = sub.status === 'insufficient_evidence';

              return (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-xs sm:text-sm">
                        {sub.subtopic}
                      </span>

                      {/* Status Badges */}
                      {isNeedsRevision && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Needs Revision
                        </span>
                      )}
                      {isProficient && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Proficient
                        </span>
                      )}
                      {isInsufficient && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Insufficient Evidence (&lt;2 Qs)
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {isInsufficient ? (
                        <span>{sub.correctCount} of {sub.totalQuestions} questions answered · Need at least 2 questions to evaluate</span>
                      ) : (
                        <span>{sub.correctCount} of {sub.totalQuestions} questions answered · Verified via quiz attempts</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Accuracy & Progress Bar */}
                  <div className="flex items-center space-x-4 self-start sm:self-auto">
                    {!isInsufficient ? (
                      <>
                        <div className="w-28 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className={`h-full ${
                              sub.accuracyRate >= 70 ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${sub.accuracyRate}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-mono font-bold w-12 text-right ${
                            sub.accuracyRate >= 70 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {sub.accuracyRate}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono italic">
                        Not enough data
                      </span>
                    )}

                    <button
                      onClick={() => onOpenAssistant(sub.topicId)}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                      title="Ask AI Doubt Assistant about this subtopic"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
