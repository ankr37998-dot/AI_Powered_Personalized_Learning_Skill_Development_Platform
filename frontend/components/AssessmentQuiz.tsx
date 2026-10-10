import React, { useState } from 'react';
import {
  AssessmentQuestion,
  AssessmentAttempt,
  CatalogTopic,
  LearningResource,
  UserProfile
} from '../types';
import { assessmentService } from '../services/assessmentService';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface AssessmentQuizProps {
  questions: AssessmentQuestion[];
  catalog: CatalogTopic[];
  resources: LearningResource[];
  selectedTopicId: string;
  userProfile: UserProfile;
  onAssessmentCompleted: (attempt: AssessmentAttempt) => void;
  onNavigateToRoadmap: () => void;
  onOpenAssistant: (topicId: string) => void;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  questions,
  catalog,
  resources,
  selectedTopicId,
  userProfile,
  onAssessmentCompleted,
  onNavigateToRoadmap,
  onOpenAssistant
}) => {
  const [activeTopicId, setActiveTopicId] = useState(selectedTopicId || catalog[0]?.id || 'topic_event_loop');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<AssessmentAttempt | null>(null);

  const currentTopic = catalog.find((c) => c.id === activeTopicId);
  const topicQuestions = questions.filter((q) => q.topicId === activeTopicId);

  const topicAssessmentResources = resources.filter(
    (r) => r.topicId === activeTopicId && (r.type === 'mcq' || r.type === 'practice')
  );

  const currentQuestion = topicQuestions[currentQuestionIndex];
  const totalQuestions = topicQuestions.length;

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted || !currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (totalQuestions === 0) return;

    const attempt = assessmentService.scoreAttempt(
      userProfile,
      activeTopicId,
      currentTopic?.title || 'Active Topic',
      selectedAnswers,
      questions
    );

    setLatestAttempt(attempt);
    setIsSubmitted(true);
    onAssessmentCompleted(attempt);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
    setCurrentQuestionIndex(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Topic Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
            Practice Module
          </span>
          <span className="font-bold text-white text-sm">
            {currentTopic ? currentTopic.title : 'Diagnostic Quiz'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-slate-400 font-medium">Topic:</label>
          <select
            value={activeTopicId}
            onChange={(e) => {
              setActiveTopicId(e.target.value);
              handleResetQuiz();
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULT DISPLAY IF SUBMITTED */}
      {isSubmitted && latestAttempt ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              latestAttempt.scorePercentage >= 75
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-sm sm:text-base">
                {latestAttempt.scorePercentage >= 75 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <span>
                  Result: {latestAttempt.totalScore} / {latestAttempt.maxScore} Correct ({latestAttempt.scorePercentage}%)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {latestAttempt.scorePercentage >= 75
                  ? 'Mastery threshold satisfied (≥75%). Dependent topics are unlocked on your roadmap.'
                  : 'Diagnostic evidence recorded. Inspect the subtopic breakdown below to prioritize revision.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleResetQuiz}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                onClick={() => onOpenAssistant(activeTopicId)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Answers & Authoritative Citations
            </h4>

            {latestAttempt.answers.map((ans, idx) => {
              const questionObj = topicQuestions.find((q) => q.id === ans.questionId);

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5">
                        <span className="font-mono font-bold text-indigo-400">Q{idx + 1}</span> · Subtopic: {ans.subtopic}
                      </div>
                      <div className="font-semibold text-white">{questionObj?.questionText}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        ans.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-cyan-400">Rationale: </span>
                    {ans.explanation}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    <span>Official Doc:</span>
                    <a
                      href={ans.citationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 hover:underline flex items-center"
                    >
                      {ans.citationTitle} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* QUIZ IN PROGRESS */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          {totalQuestions === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No internal diagnostic questions found for this topic.
            </div>
          ) : (
            <>
              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span className="font-mono">{progressPercent}% complete</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              {currentQuestion && (
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-indigo-400 font-mono font-semibold">
                    Subtopic: {currentQuestion.subtopic}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                    {currentQuestion.questionText}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium ring-1 ring-indigo-500'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400 ml-2 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={handlePrevQuestion}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={answeredCount === 0}
                    onClick={handleSubmitQuiz}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <span>Submit Quiz</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
