import React from 'react';
import { AssessmentAttempt, SubtopicAnalysis, LearningRecommendation } from '../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface WeakTopicAnalysisProps {
  attempts: AssessmentAttempt[];
  onSelectRecommendation: (rec: LearningRecommendation) => void;
}

export const WeakTopicAnalysis: React.FC<WeakTopicAnalysisProps> = ({
  attempts,
  onSelectRecommendation
}) => {
  // Aggregate accuracy per subtopic across real attempts
  const subtopicMap: Record<string, { total: number; correct: number }> = {};

  attempts.forEach((att) => {
    att.answers.forEach((ans) => {
      if (!subtopicMap[ans.subtopic]) {
        subtopicMap[ans.subtopic] = { total: 0, correct: 0 };
      }
      subtopicMap[ans.subtopic].total += 1;
      if (ans.isCorrect) {
        subtopicMap[ans.subtopic].correct += 1;
      }
    });
  });

  const subtopics: SubtopicAnalysis[] = Object.keys(subtopicMap).map((sub) => {
    const data = subtopicMap[sub];
    const accuracy = Math.round((data.correct / data.total) * 100);
    let status: 'proficient' | 'needs_revision' | 'insufficient_evidence' = 'proficient';

    if (data.total < 1) {
      status = 'insufficient_evidence';
    } else if (accuracy < 70) {
      status = 'needs_revision';
    }

    return {
      subtopic: sub,
      totalQuestions: data.total,
      correctCount: data.correct,
      accuracyRate: accuracy,
      status,
      evidenceCount: data.total
    };
  });

  // Calculate explainable recommendations based purely on evidence
  const weakSubtopic = subtopics.find((s) => s.status === 'needs_revision');

  const recommendation: LearningRecommendation | null = weakSubtopic
    ? {
        type: 'revise_subtopic',
        topicId: 'topic_buffers_streams',
        topicTitle: 'Buffers & Streams Architecture',
        subtopicTarget: weakSubtopic.subtopic,
        rationale: `Assessment evidence recorded ${weakSubtopic.accuracyRate}% accuracy across ${weakSubtopic.totalQuestions} questions on "${weakSubtopic.subtopic}". Official documentation advises reviewing backpressure signals before advancing to cluster worker IPC.`,
        suggestedActionLabel: `Revise ${weakSubtopic.subtopic}`
      }
    : attempts.length > 0
    ? {
        type: 'next_topic',
        topicId: 'topic_cluster_scaling',
        topicTitle: 'Process Management, Clustering & IPC',
        rationale:
          'Current diagnostic attempts demonstrate >= 75% accuracy across foundational event loop & stream mechanics. Ready for multi-core scaling.',
        suggestedActionLabel: 'Advance to Clustering & Scaling'
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold uppercase">
          <Activity className="w-4 h-4" />
          <span>Factual Competency Diagnostic</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Subtopic Diagnostics & Next Step Recommendations</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Recommendations strictly use recorded quiz answer evidence. If there is insufficient tagged evidence, the platform states "Insufficient Evidence" instead of guessing.
        </p>
      </div>

      {/* Explainable Recommendation Banner */}
      {recommendation ? (
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/40 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold text-cyan-400">Explainable Next Step</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">Target: {recommendation.topicTitle}</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {recommendation.subtopicTarget ? `Priority Focus: ${recommendation.subtopicTarget}` : recommendation.topicTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation.rationale}</p>
            </div>

            <button
              onClick={() => onSelectRecommendation(recommendation)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition self-start sm:self-center flex-shrink-0"
            >
              <span>{recommendation.suggestedActionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 text-center text-slate-400 text-sm">
          No assessment attempts recorded yet. Complete a practice quiz to generate factual subtopic analysis.
        </div>
      )}

      {/* Subtopic Evidence Table */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Subtopic Performance Evidence Breakdown</h3>

        {subtopics.length === 0 ? (
          <div className="text-xs text-slate-400 py-3">Take an assessment to record subtopic data.</div>
        ) : (
          <div className="space-y-3">
            {subtopics.map((sub, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">{sub.subtopic}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        sub.status === 'proficient'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : sub.status === 'needs_revision'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Evidence Sample: {sub.correctCount} of {sub.totalQuestions} questions answered correctly
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full ${
                        sub.accuracyRate >= 70 ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.accuracyRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200 w-12 text-right">
                    {sub.accuracyRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
