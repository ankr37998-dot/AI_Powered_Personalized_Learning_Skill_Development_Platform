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
  Info,
  ShieldCheck,
  Award
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
  // Subtopic diagnostics calculated strictly on assessment evidence
  const subtopicAnalyses: SubtopicAnalysis[] = useMemo(() => {
    return assessmentService.analyzeSubtopics(attempts);
  }, [attempts]);

  // Next-step recommendation based on real evidence
  const recommendation: LearningRecommendation = useMemo(() => {
    return assessmentService.generateRecommendation(roadmap, catalog, attempts, subtopicAnalyses);
  }, [roadmap, catalog, attempts, subtopicAnalyses]);

  const weakCount = subtopicAnalyses.filter((s) => s.status === 'needs_revision').length;
  const uncertainCount = subtopicAnalyses.filter((s) => s.status === 'insufficient_evidence').length;
  const totalCompletedAssessments = attempts.length;

  return (
    <div className="space-y-5">
      {/* Page Header (Apple minimalist typography) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
          <Activity className="w-3.5 h-3.5" />
          <span>Factual Competency Diagnostics</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Assessment Results & Weak-Topic Analysis
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
          Subtopic performance is calculated solely from recorded test answers. Subtopics with fewer than 2 answered questions are tagged "Insufficient Evidence" instead of guessing weaknesses.
        </p>
      </div>

      {/* 4 Metric Tiles Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Monitored Subtopics
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {subtopicAnalyses.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Tagged in catalog</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Needs Revision
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {weakCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">&lt;70% accuracy threshold</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Insufficient Evidence
          </span>
          <div className="text-xl font-bold text-slate-600 dark:text-slate-300 mt-1">
            {uncertainCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">&lt;2 questions recorded</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Diagnostic Runs
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalCompletedAssessments}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Scored on server</span>
        </div>
      </div>

      {/* Restrained Recommendation Box */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Recommended Next Step
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">{recommendation.topicTitle}</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {recommendation.subtopicTarget
              ? `Priority Focus: ${recommendation.subtopicTarget}`
              : recommendation.suggestedActionLabel}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {recommendation.rationale}
          </p>

          <div className="text-[10px] text-slate-400 pt-0.5 flex items-center space-x-1">
            <Info className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            <span>Basis: {recommendation.evidenceSummary}</span>
          </div>
        </div>

        <button
          onClick={() => onSelectRecommendation(recommendation)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-center flex-shrink-0 shadow-xs"
        >
          <span>{recommendation.suggestedActionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtopic Evidence Breakdown List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-925 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Subtopic Diagnostic Evidence ({subtopicAnalyses.length} tags)</span>
          </div>
          <span className="text-[10px] text-slate-400">Rule: Min. 2 questions per tag</span>
        </div>

        {subtopicAnalyses.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <AlertTriangle className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto mb-1.5" />
            <p>No assessment evidence recorded yet. Complete a quiz to analyze subtopics.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {subtopicAnalyses.map((sub, idx) => {
              const isNeedsRevision = sub.status === 'needs_revision';
              const isProficient = sub.status === 'proficient';
              const isInsufficient = sub.status === 'insufficient_evidence';

              return (
                <div
                  key={idx}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sub.subtopic}
                      </span>

                      {/* Status Badges */}
                      {isNeedsRevision && (
                        <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                          Needs Revision
                        </span>
                      )}
                      {isProficient && (
                        <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          Proficient
                        </span>
                      )}
                      {isInsufficient && (
                        <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Insufficient Evidence (&lt;2 Qs)
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isInsufficient
                        ? `${sub.correctCount} of ${sub.totalQuestions} questions answered · Need at least 2 questions to evaluate`
                        : `${sub.correctCount} of ${sub.totalQuestions} questions answered · Verified via test attempts`}
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="flex items-center space-x-3 self-start sm:self-auto flex-shrink-0">
                    {!isInsufficient ? (
                      <>
                        <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              sub.accuracyRate >= 70 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${sub.accuracyRate}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-semibold text-xs w-10 text-right ${
                            sub.accuracyRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {sub.accuracyRate}%
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No score</span>
                    )}

                    <button
                      onClick={() => onOpenAssistant(sub.topicId)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
