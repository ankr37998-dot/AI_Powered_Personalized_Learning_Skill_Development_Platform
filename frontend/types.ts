export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  targetGoal: string;
  currentSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
}

export interface ExtractedTopic {
  id: string;
  title: string;
  unitOrModule: string;
  description: string;
  confidence: 'high' | 'medium' | 'uncertain';
  mappedCatalogId?: string;
  prerequisites: string[]; // topic IDs
}

export interface CatalogTopic {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  prerequisiteIds: string[];
  officialDocSources: {
    title: string;
    url: string;
    authorityName: string;
  }[];
}

export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'needs_revision';

export interface RoadmapNode {
  topicId: string;
  title: string;
  unit: string;
  status: TopicStatus;
  order: number;
  prerequisitesMet: boolean;
  score?: number;
  lastStudiedAt?: string;
}

export type ResourceType = 'video' | 'documentation' | 'article' | 'mcq' | 'practice';

export type VerificationStatus =
  | 'verified_against_cited_references'
  | 'potential_mismatch'
  | 'unable_to_verify'
  | 'verification_failed';

export interface ResourceClaimComparison {
  claim: string;
  officialDocReference: string;
  officialDocUrl: string;
  matchStatus: 'aligned' | 'deviates' | 'inconclusive';
  explanation: string;
}

export interface VerificationReport {
  resourceId: string;
  status: VerificationStatus;
  checkedAt: string;
  assessedContentSummary: string;
  officialDocLinks: { title: string; url: string; authority: string }[];
  findings: string[];
  claims: ResourceClaimComparison[];
  limitations: string[];
}

export interface LearningResource {
  id: string;
  topicId: string;
  title: string;
  url: string;
  platform: string;
  type: ResourceType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationOrReadTime: string;
  qualityScore: number; // 0-100 based on freshness & relevance
  verificationStatus: VerificationStatus;
  verificationReport?: VerificationReport;
  lastCheckedDate: string;
  authorOrChannel?: string;
}

export interface AssessmentQuestion {
  id: string;
  topicId: string;
  subtopic: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  officialDocCitation: {
    title: string;
    url: string;
  };
}

export interface AssessmentAttempt {
  id: string;
  topicId: string;
  timestamp: string;
  answers: {
    questionId: string;
    subtopic: string;
    selectedOption: number;
    isCorrect: boolean;
  }[];
  totalScore: number;
  maxScore: number;
}

export interface SubtopicAnalysis {
  subtopic: string;
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number; // 0 - 100
  status: 'proficient' | 'needs_revision' | 'insufficient_evidence';
  evidenceCount: number;
}

export interface LearningRecommendation {
  type: 'next_topic' | 'revise_subtopic' | 'review_prerequisite' | 'retry_assessment';
  topicId: string;
  topicTitle: string;
  subtopicTarget?: string;
  rationale: string;
  suggestedActionLabel: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'assistant';
  text: string;
  timestamp: string;
  topicContextId?: string;
  citations?: { title: string; url: string }[];
}
