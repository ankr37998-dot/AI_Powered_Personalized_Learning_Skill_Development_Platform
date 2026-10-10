import {
  AssessmentQuestion,
  AssessmentAttempt,
  QuestionAnswerRecord,
  SubtopicAnalysis,
  LearningRecommendation,
  RoadmapNode,
  CatalogTopic,
  StudentProgressSummary,
  UserProfile
} from '../types';
import { storageService } from './storageService';

const MIN_EVIDENCE_THRESHOLD = 2; // Minimum questions per subtopic before asserting strength/weakness
const MASTERY_PASS_PERCENTAGE = 75;
const REVISION_THRESHOLD_PERCENTAGE = 70;

export const assessmentService = {
  /**
   * Scores an assessment attempt strictly on the backend/service boundary.
   * Client-submitted scores are ignored; correctOptionIndex is checked against stored questions.
   */
  scoreAttempt(
    student: UserProfile,
    topicId: string,
    topicTitle: string,
    submittedAnswers: Record<string, number>,
    questionBank: AssessmentQuestion[],
    resourceId?: string
  ): AssessmentAttempt {
    const relevantQuestions = questionBank.filter((q) => q.topicId === topicId);
    let totalScore = 0;

    const answerRecords: QuestionAnswerRecord[] = relevantQuestions.map((q) => {
      const selectedOption = submittedAnswers[q.id] ?? -1;
      const isCorrect = selectedOption === q.correctOptionIndex;
      if (isCorrect) {
        totalScore += 1;
      }

      return {
        questionId: q.id,
        subtopic: q.subtopic,
        selectedOption,
        correctOption: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
        citationTitle: q.officialDocCitation.title,
        citationUrl: q.officialDocCitation.url
      };
    });

    const maxScore = relevantQuestions.length;
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const attempt: AssessmentAttempt = {
      id: `att_${Date.now()}`,
      studentId: student.id,
      topicId,
      topicTitle,
      resourceId,
      timestamp: new Date().toISOString(),
      answers: answerRecords,
      totalScore,
      maxScore,
      scorePercentage,
      status: 'completed'
    };

    // Persist attempt through storageService
    storageService.saveAttempt(attempt);
    return attempt;
  },

  /**
   * Evaluates factual subtopic performance from real recorded attempts.
   * Distinguishes potential weakness from 'insufficient_evidence' (when evidence count < 2).
   */
  analyzeSubtopics(
    attempts: AssessmentAttempt[],
    targetTopicId?: string
  ): SubtopicAnalysis[] {
    const subtopicMap: Record<string, { topicId: string; total: number; correct: number }> = {};

    attempts.forEach((att) => {
      if (targetTopicId && targetTopicId !== 'all' && att.topicId !== targetTopicId) {
        return;
      }

      att.answers.forEach((ans) => {
        if (!subtopicMap[ans.subtopic]) {
          subtopicMap[ans.subtopic] = { topicId: att.topicId, total: 0, correct: 0 };
        }
        subtopicMap[ans.subtopic].total += 1;
        if (ans.isCorrect) {
          subtopicMap[ans.subtopic].correct += 1;
        }
      });
    });

    return Object.keys(subtopicMap).map((subtopic) => {
      const data = subtopicMap[subtopic];
      const accuracy = Math.round((data.correct / data.total) * 100);

      let status: 'proficient' | 'needs_revision' | 'insufficient_evidence' = 'proficient';

      if (data.total < MIN_EVIDENCE_THRESHOLD) {
        status = 'insufficient_evidence';
      } else if (accuracy < REVISION_THRESHOLD_PERCENTAGE) {
        status = 'needs_revision';
      } else {
        status = 'proficient';
      }

      return {
        subtopic,
        topicId: data.topicId,
        totalQuestions: data.total,
        correctCount: data.correct,
        accuracyRate: accuracy,
        status,
        evidenceCount: data.total,
        minEvidenceRequired: MIN_EVIDENCE_THRESHOLD
      };
    });
  },

  /**
   * Generates explainable next-step recommendations based on evidence,
   * roadmap prerequisite status, and assessment results.
   */
  generateRecommendation(
    roadmap: RoadmapNode[],
    catalog: CatalogTopic[],
    attempts: AssessmentAttempt[],
    subtopicAnalyses: SubtopicAnalysis[]
  ): LearningRecommendation {
    // 1. Check for genuine weak subtopics with sufficient evidence
    const weakSubtopic = subtopicAnalyses.find(
      (s) => s.status === 'needs_revision' && s.evidenceCount >= MIN_EVIDENCE_THRESHOLD
    );

    if (weakSubtopic) {
      const targetTopic = catalog.find((c) => c.id === weakSubtopic.topicId);
      return {
        type: 'revise_subtopic',
        topicId: weakSubtopic.topicId,
        topicTitle: targetTopic?.title || 'Current Topic',
        subtopicTarget: weakSubtopic.subtopic,
        rationale: `Diagnostic assessment evidence recorded an accuracy rate of ${weakSubtopic.accuracyRate}% across ${weakSubtopic.evidenceCount} questions on "${weakSubtopic.subtopic}". Revisit recommended learning resources and official specifications before advancing.`,
        evidenceSummary: `${weakSubtopic.correctCount}/${weakSubtopic.evidenceCount} correct answers recorded.`,
        suggestedActionLabel: `Revise ${weakSubtopic.subtopic}`
      };
    }

    // 2. Check for topics with insufficient assessment evidence
    const activeNode = roadmap.find((n) => n.status === 'in_progress' || n.status === 'available');
    if (activeNode) {
      const nodeAttempts = attempts.filter((a) => a.topicId === activeNode.topicId);
      if (nodeAttempts.length === 0) {
        return {
          type: 'more_practice_recommended',
          topicId: activeNode.topicId,
          topicTitle: activeNode.title,
          rationale: `You are currently studying "${activeNode.title}". Take the verified diagnostic assessment to record evidence and unlock dependent prerequisite modules.`,
          evidenceSummary: 'No diagnostic attempts recorded yet for this active topic.',
          suggestedActionLabel: 'Start Topic Assessment'
        };
      }
    }

    // 3. Check for topics needing revision (< 70% overall score)
    const revisionNode = roadmap.find((n) => n.status === 'needs_revision');
    if (revisionNode) {
      return {
        type: 'retry_assessment',
        topicId: revisionNode.topicId,
        topicTitle: revisionNode.title,
        rationale: `Latest diagnostic score on "${revisionNode.title}" was ${revisionNode.score}%, which is below the ${MASTERY_PASS_PERCENTAGE}% mastery unlock threshold. Retake the practice quiz to demonstrate competency.`,
        evidenceSummary: `Recorded score: ${revisionNode.score}% (Threshold: ${MASTERY_PASS_PERCENTAGE}%)`,
        suggestedActionLabel: 'Retry Diagnostic Quiz'
      };
    }

    // 4. Advance to next topic if ready
    const readyNode = roadmap.find((n) => n.status === 'available');
    if (readyNode) {
      return {
        type: 'continue_next_topic',
        topicId: readyNode.topicId,
        topicTitle: readyNode.title,
        rationale: `Foundational prerequisites are completed. You are ready to begin "${readyNode.title}".`,
        evidenceSummary: 'All prior required prerequisites satisfied.',
        suggestedActionLabel: `Advance to ${readyNode.title}`
      };
    }

    // Default fallback
    return {
      type: 'continue_next_topic',
      topicId: roadmap[0]?.topicId || 'topic_event_loop',
      topicTitle: roadmap[0]?.title || 'Event Loop Architecture',
      rationale: 'Review foundational event loop concepts to strengthen backend runtime knowledge.',
      evidenceSummary: 'Baseline roadmap sequencing recommendation.',
      suggestedActionLabel: 'Review Foundations'
    };
  },

  /**
   * Computes student progress summary metrics
   */
  getProgressSummary(roadmap: RoadmapNode[], attempts: AssessmentAttempt[]): StudentProgressSummary {
    const totalTopics = roadmap.length;
    const completed = roadmap.filter((n) => n.status === 'completed').length;
    const inProgress = roadmap.filter((n) => n.status === 'in_progress').length;
    const needsRevision = roadmap.filter((n) => n.status === 'needs_revision').length;
    const locked = roadmap.filter((n) => n.status === 'locked').length;

    const masteryPercentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

    let averageScore = 0;
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, a) => acc + a.scorePercentage, 0);
      averageScore = Math.round(sum / attempts.length);
    }

    return {
      topicsCompleted: completed,
      topicsInProgress: inProgress,
      topicsNeedsRevision: needsRevision,
      topicsLocked: locked,
      totalTopics,
      masteryPercentage,
      attemptsCount: attempts.length,
      averageDiagnosticScore: averageScore,
      lastAttemptDate: attempts[0]?.timestamp.split('T')[0]
    };
  }
};
