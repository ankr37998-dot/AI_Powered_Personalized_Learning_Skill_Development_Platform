import React, { useState } from "react";
import {
  AssessmentQuestion,
  AssessmentAttempt,
  CatalogTopic,
  LearningResource,
  UserProfile,
} from "../types";
import { assessmentService } from "../services/assessmentService";
import {
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";

interface AssessmentQuizProps {
  questions: AssessmentQuestion[];
  catalog: CatalogTopic[];
  resources: LearningResource[];
  selectedTopicId: string;
  userProfile: UserProfile;
  onAssessmentCompleted: (
    attempt: AssessmentAttempt,
  ) => Promise<AssessmentAttempt>;
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
  onOpenAssistant,
}) => {
  const [activeTopicId, setActiveTopicId] = useState(
    selectedTopicId || catalog[0]?.id || "topic_event_loop",
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<AssessmentAttempt | null>(
    null,
  );

  const currentTopic = catalog.find((c) => c.id === activeTopicId);
  const topicQuestions = questions.filter((q) => q.topicId === activeTopicId);

  const currentQuestion = topicQuestions[currentQuestionIndex];
  const totalQuestions = topicQuestions.length;

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted || !currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
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

  const handleSubmitQuiz = async () => {
    if (totalQuestions === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const draftAttempt = assessmentService.scoreAttempt(
        userProfile,
        activeTopicId,
        currentTopic?.title || "Active Topic",
        selectedAnswers,
        questions,
      );
      const savedAttempt = await onAssessmentCompleted(draftAttempt);
      setLatestAttempt(savedAttempt);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Assessment submission failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
    setCurrentQuestionIndex(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Module Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div>
          <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] block">
            Practice Module
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {currentTopic ? currentTopic.title : "Diagnostic Quiz"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            Topic:
          </label>
          <select
            value={activeTopicId}
            onChange={(e) => {
              setActiveTopicId(e.target.value);
              handleResetQuiz();
            }}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
          >
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results View */}
      {isSubmitted && latestAttempt ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              latestAttempt.scorePercentage >= 75
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-sm">
                {latestAttempt.scorePercentage >= 75 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
                <span>
                  Result: {latestAttempt.totalScore} of {latestAttempt.maxScore}{" "}
                  Correct ({latestAttempt.scorePercentage}%)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {latestAttempt.scorePercentage >= 75
                  ? "Mastery threshold met (≥75%). Dependent roadmap modules unlocked."
                  : "Diagnostic evidence recorded. Inspect question rationales below to target revision."}
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleResetQuiz}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                onClick={() => onOpenAssistant(activeTopicId)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Answers & Authoritative Citations
            </h4>

            {latestAttempt.answers.map((ans, idx) => {
              const questionObj = topicQuestions.find(
                (q) => q.id === ans.questionId,
              );

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-925 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-0.5">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          Q{idx + 1}
                        </span>{" "}
                        · {ans.subtopic}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {questionObj?.questionText}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.2 rounded font-bold uppercase flex-shrink-0 ${
                        ans.isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {ans.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                      Rationale:{" "}
                    </span>
                    {ans.explanation}
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 text-indigo-500" />
                    <span>Official Spec:</span>
                    <a
                      href={ans.citationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                    >
                      {ans.citationTitle}{" "}
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Quiz in Progress */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
          {totalQuestions === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No internal diagnostic questions found for this topic.
            </div>
          ) : (
            <>
              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="font-mono">{progressPercent}% answered</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-200"
                  style={{
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              {currentQuestion && (
                <div className="space-y-2.5 pt-1">
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold uppercase tracking-wider">
                    Subtopic: {currentQuestion.subtopic}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    {currentQuestion.questionText}
                  </h3>

                  {/* Options */}
                  <div className="space-y-1.5 pt-1">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected =
                        selectedAnswers[currentQuestion.id] === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-white font-medium ring-1 ring-indigo-500"
                              : "bg-slate-50/50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-2 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              {submitError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-xs"
                >
                  {submitError}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={handlePrevQuestion}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={answeredCount === 0 || isSubmitting}
                    onClick={handleSubmitQuiz}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <span>{isSubmitting ? "Saving score..." : "Submit"}</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
