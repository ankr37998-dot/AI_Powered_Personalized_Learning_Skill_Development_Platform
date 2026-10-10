import React, { useState } from 'react';
import { AssessmentQuestion, AssessmentAttempt, CatalogTopic } from '../types';
import { storageService } from '../services/storageService';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  BookOpen,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface AssessmentQuizProps {
  questions: AssessmentQuestion[];
  catalog: CatalogTopic[];
  selectedTopicId: string;
  onAssessmentCompleted: (attempt: AssessmentAttempt) => void;
  onNavigateToRoadmap: () => void;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  questions,
  catalog,
  selectedTopicId,
  onAssessmentCompleted,
  onNavigateToRoadmap
}) => {
  const [topicFilter, setTopicFilter] = useState(selectedTopicId || 'all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<AssessmentAttempt | null>(null);

  const activeQuestions = questions.filter(
    (q) => topicFilter === 'all' || q.topicId === topicFilter
  );

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (activeQuestions.length === 0) return;

    let correctScore = 0;
    const answerRecords = activeQuestions.map((q) => {
      const selected = selectedAnswers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctScore += 1;
      return {
        questionId: q.id,
        subtopic: q.subtopic,
        selectedOption: selected ?? -1,
        isCorrect
      };
    });

    const targetTopicId = topicFilter === 'all' ? activeQuestions[0].topicId : topicFilter;

    const attempt: AssessmentAttempt = {
      id: `att_${Date.now()}`,
      topicId: targetTopicId,
      timestamp: new Date().toISOString(),
      answers: answerRecords,
      totalScore: correctScore,
      maxScore: activeQuestions.length
    };

    storageService.saveAttempt(attempt);
    setLastAttempt(attempt);
    setIsSubmitted(true);
    onAssessmentCompleted(attempt);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setLastAttempt(null);
  };

  const scorePercentage = lastAttempt
    ? Math.round((lastAttempt.totalScore / lastAttempt.maxScore) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold uppercase">
              <Award className="w-4 h-4" />
              <span>Evidence-Based Diagnostic Assessments</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Technical Practice & Mastery Checks</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Every question is tagged with a precise subtopic to generate factual weak-topic analysis.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Select Topic:</span>
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                handleResetQuiz();
              }}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Supported Diagnostic Questions</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary pill if submitted */}
        {isSubmitted && lastAttempt && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              scorePercentage >= 75
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : scorePercentage >= 50
                ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm">
                Diagnostic Result: {lastAttempt.totalScore} / {lastAttempt.maxScore} Correct ({scorePercentage}%)
              </div>
              <p className="text-xs mt-0.5 text-slate-300">
                {scorePercentage >= 75
                  ? 'Great performance! Your prerequisite status for dependent topics has been unlocked.'
                  : 'Diagnostic evidence recorded. Inspect the subtopic breakdown below for revision priorities.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetQuiz}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={onNavigateToRoadmap}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
              >
                <span>View Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {activeQuestions.map((q, qIndex) => {
          const selectedOption = selectedAnswers[q.id];
          const hasAnswered = typeof selectedOption === 'number';

          return (
            <div
              key={q.id}
              className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                    <span className="font-mono font-bold text-indigo-400">Q{qIndex + 1}</span>
                    <span>•</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px] text-cyan-300 border border-slate-700">
                      Subtopic: {q.subtopic}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{q.questionText}</h3>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isCorrect = q.correctOptionIndex === optIdx;

                  let optionStyle =
                    'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-700/80 hover:border-slate-600';

                  if (isSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                    } else {
                      optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between ${optionStyle}`}
                    >
                      <span className="flex-1">{option}</span>
                      {isSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-2 flex-shrink-0" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation and Official Doc citation when submitted */}
              {isSubmitted && (
                <div className="pt-3 border-t border-slate-700/80 space-y-2 text-xs">
                  <div className="text-slate-300">
                    <span className="font-bold text-cyan-400">Technical Rationale: </span>
                    {q.explanation}
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Official Citation: </span>
                    <a
                      href={q.officialDocCitation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 hover:underline flex items-center"
                    >
                      {q.officialDocCitation.title} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz Submit button */}
      {!isSubmitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmitQuiz}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <span>Submit Assessment & Run Diagnostics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
