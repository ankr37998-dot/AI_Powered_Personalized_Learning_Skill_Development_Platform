export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  targetGoal: string;
  currentSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
  registeredDate: string;
  status: 'active' | 'suspended';
}

export interface ExtractedTopic {
  id: string;
  title: string;
  unitOrModule: string;
  description: string;
  confidence: 'high' | 'medium' | 'uncertain';
  mappedCatalogId?: string;
  prerequisites: string[]; // topic IDs
  order: number;
}

export interface SubjectUnitGroup {
  name: string;
  isExpanded: boolean;
  topics: ExtractedTopic[];
}

export interface SyllabusFileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface SyllabusDraft {
  id: string;
  savedAt: string;
  learningGoal: string;
  sourceType: 'file' | 'manual';
  fileName?: string;
  rawText?: string;
  groups: SubjectUnitGroup[];
}

export interface CatalogTopic {
  id: string;
  slug?: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  prerequisiteIds: string[];
  keyCompetencies: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export type ResourceAvailability = 'available' | 'unavailable' | 'unknown' | 'archived';

export type VerificationStatus =
  | 'verified_against_cited_references'
  | 'potential_mismatch'
  | 'unable_to_verify'
  | 'verification_failed';

export type VerificationErrorCategory =
  | 'none'
  | 'inaccessible_content'
  | 'missing_transcript'
  | 'ssrf_blocked'
  | 'no_canonical_documentation'
  | 'model_quota_timeout'
  | 'invalid_schema';

export interface CanonicalDocReference {
  id: string;
  canonicalUrl: string;
  title: string;
  topicId: string;
  subtopicTag?: string;
  authorityName: string;
  canonicalExcerpt: string;
  lastCheckedDate: string;
}

export interface ResourceClaimComparison {
  claim: string;
  officialDocReference: string;
  officialDocUrl: string;
  matchStatus: 'aligned' | 'deviates' | 'inconclusive';
  explanation: string;
}

export interface VerificationReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceUrl: string;
  topicId: string;
  status: VerificationStatus;
  errorCategory: VerificationErrorCategory;
  checkedAt: string;
  assessedContentScope: string;
  contentAccessMethod: 'public_transcript' | 'official_spec_ingest' | 'article_reader' | 'failed_access';
  officialDocLinks: { title: string; url: string; authority: string }[];
  findings: string[];
  claims: ResourceClaimComparison[];
  limitations: string[];
  modelIdentifier?: string;
}

export interface ResourceReviewStats {
  rating?: number;
  reviewCount?: number;
  sourceLabel?: string;
}

export interface LearningResource {
  id: string;
  topicId: string;
  subtopics?: string[];
  title: string;
  url: string;
  platform: string;
  type: ResourceType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  durationOrReadTime: string;
  description?: string;
  isOfficialSource: boolean;
  availabilityStatus: ResourceAvailability;
  publicationDate?: string;
  lastCheckedDate: string;
  authorOrChannel?: string;
  reviewStats?: ResourceReviewStats;
  provenance: 'curated' | 'admin_entered';
  isReported?: boolean;
  verificationStatus: VerificationStatus;
  verificationReport?: VerificationReport;
  recommendationScore?: number;
  recommendationReasons?: string[];
  isInternalAssessment?: boolean;
}

export interface ReportedResourceIssue {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reportedBy: string;
  reportedAt: string;
  reason: 'broken_link' | 'outdated_api' | 'inaccurate_content' | 'misleading_title';
  studentNotes: string;
  status: 'pending_review' | 'resolved' | 'dismissed';
  adminResolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AssessmentQuestion {
  id: string;
  topicId: string;
  subtopic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  officialDocCitation: {
    title: string;
    url: string;
  };
}

export interface QuestionAnswerRecord {
  questionId: string;
  subtopic: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  citationTitle: string;
  citationUrl: string;
}

export interface AssessmentAttempt {
  id: string;
  studentId: string;
  topicId: string;
  topicTitle: string;
  resourceId?: string;
  timestamp: string;
  answers: QuestionAnswerRecord[];
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  status: 'completed' | 'abandoned';
}

export interface SubtopicAnalysis {
  subtopic: string;
  topicId: string;
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number; // 0 - 100
  status: 'proficient' | 'needs_revision' | 'insufficient_evidence';
  evidenceCount: number;
  minEvidenceRequired: number;
}

export interface LearningRecommendation {
  type:
    | 'continue_next_topic'
    | 'revise_subtopic'
    | 'retry_assessment'
    | 'review_prerequisites'
    | 'more_practice_recommended';
  topicId: string;
  topicTitle: string;
  subtopicTarget?: string;
  rationale: string;
  evidenceSummary: string;
  suggestedActionLabel: string;
  targetPrerequisiteId?: string;
  suggestedResourceId?: string;
}

export interface StudentProgressSummary {
  topicsCompleted: number;
  topicsInProgress: number;
  topicsNeedsRevision: number;
  topicsLocked: number;
  totalTopics: number;
  masteryPercentage: number;
  attemptsCount: number;
  averageDiagnosticScore: number;
  lastAttemptDate?: string;
}

export interface AssistantCitation {
  id: string;
  title: string;
  url: string;
  authorityName?: string;
  provenance: 'canonical_spec' | 'verified_resource_report' | 'general_knowledge';
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'assistant';
  text: string;
  timestamp: string;
  topicContextId?: string;
  resourceContextId?: string;
  citations?: AssistantCitation[];
  isStreaming?: boolean;
  hasError?: boolean;
  groundingStatus?: 'grounded_in_canonical_docs' | 'general_knowledge_fallback' | 'unverified';
}

export interface ChatSessionContext {
  learningGoal?: string;
  currentSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: string;
  activeTopic?: CatalogTopic | null;
  activeSubtopic?: string;
  activeResource?: LearningResource | null;
  prerequisites?: string[];
  verificationReportSummary?: string;
}

export interface PlatformConfig {
  geminiModel: string;
  verificationStrictness: 'conservative' | 'standard' | 'strict';
  allowManualAssessmentOverride: boolean;
  maxDailyDoubtQueriesPerStudent: number;
  maintenanceMode: boolean;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  totalTopics: number;
  activeTopics: number;
  totalResources: number;
  availableResources: number;
  unavailableResources: number;
  archivedResources: number;
  pendingReportsCount: number;
  resolvedReportsCount: number;
  verifiedResourcesCount: number;
  potentialMismatchesCount: number;
}

export interface PrerequisiteCycleCheckResult {
  hasCycle: boolean;
  cyclePath?: string[];
  error?: string;
}

export interface TopicDependencyAudit {
  canDelete: boolean;
  dependentTopics: string[];
  mappedResources: string[];
  blockingReason?: string;
}

export interface AdminSecurityTestResult {
  id: string;
  title: string;
  category: 'authorization' | 'user_management' | 'prerequisite_graph' | 'topic_safety' | 'resource_integrity';
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
}

export interface BackendHealthState {
  isServerReachable: boolean;
  databaseConnected: boolean;
  databaseName: string;
  databaseHost: string;
  aiProviderConfigured: boolean;
  activePort: number;
  mode: 'standalone_express' | 'browser_orchestrated_service';
  latencyMs?: number;
}
