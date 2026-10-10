import {
  UserProfile,
  RoadmapNode,
  CatalogTopic,
  LearningResource,
  AssessmentQuestion,
  AssessmentAttempt,
  VerificationReport,
  ReportedResourceIssue,
  PlatformConfig
} from '../types';
import {
  CURATED_CATALOG,
  INITIAL_RESOURCES,
  INITIAL_ASSESSMENT_QUESTIONS,
  INITIAL_REPORTED_ISSUES,
  DEFAULT_PLATFORM_CONFIG
} from '../constants';

const STORAGE_KEYS = {
  USER_PROFILE: 'cognipath_user_profile',
  ALL_USERS: 'cognipath_all_users_list',
  ROADMAP: 'cognipath_roadmap_nodes',
  CATALOG: 'cognipath_catalog_topics',
  RESOURCES: 'cognipath_resources',
  QUESTIONS: 'cognipath_questions',
  ATTEMPTS: 'cognipath_assessment_attempts',
  REPORTED_ISSUES: 'cognipath_reported_issues',
  PLATFORM_CONFIG: 'cognipath_platform_config',
  VERIFICATION_HISTORY: 'cognipath_verification_history'
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_student_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  role: 'student',
  targetGoal: 'Master Production Node.js Architecture & Performance Engineering',
  currentSkillLevel: 'intermediate',
  preferredLanguage: 'JavaScript / TypeScript',
  registeredDate: '2025-01-10',
  status: 'active'
};

const SEED_USERS: UserProfile[] = [
  DEFAULT_PROFILE,
  {
    id: 'usr_student_02',
    name: 'Samantha Chen',
    email: 'samantha.chen@techacademy.io',
    role: 'student',
    targetGoal: 'Distributed Systems & Stream Concurrency',
    currentSkillLevel: 'advanced',
    preferredLanguage: 'TypeScript',
    registeredDate: '2025-01-15',
    status: 'active'
  },
  {
    id: 'usr_admin_01',
    name: 'Admin Governance',
    email: 'curriculum.lead@cognipath.ai',
    role: 'admin',
    targetGoal: 'Maintain Catalog Standards & Doc Citations',
    currentSkillLevel: 'advanced',
    preferredLanguage: 'All',
    registeredDate: '2024-12-01',
    status: 'active'
  }
];

const DEFAULT_ROADMAP_NODES: RoadmapNode[] = [
  {
    topicId: 'topic_event_loop',
    title: 'Node.js Event Loop & Libuv Architecture',
    unit: 'Module 1: Architecture & Asynchronous Runtimes',
    status: 'completed',
    order: 1,
    prerequisitesMet: true,
    score: 85,
    lastStudiedAt: '2025-02-23'
  },
  {
    topicId: 'topic_microtasks',
    title: 'Microtasks: process.nextTick & Promises',
    unit: 'Module 1: Architecture & Asynchronous Runtimes',
    status: 'in_progress',
    order: 2,
    prerequisitesMet: true,
    score: 60,
    lastStudiedAt: '2025-02-24'
  },
  {
    topicId: 'topic_buffers_streams',
    title: 'Buffers, Binary Data & Backpressure',
    unit: 'Module 2: Memory & High-Throughput Streams',
    status: 'needs_revision',
    order: 3,
    prerequisitesMet: true,
    score: 40,
    lastStudiedAt: '2025-02-25'
  },
  {
    topicId: 'topic_cluster_scaling',
    title: 'Process Management, Clustering & IPC',
    unit: 'Module 3: Scalability & Process Management',
    status: 'locked',
    order: 4,
    prerequisitesMet: false
  }
];

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  setUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    const all = this.getAllUsers();
    const updated = all.map((u) => (u.id === profile.id ? profile : u));
    this.setAllUsers(updated);
  },

  getAllUsers(): UserProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      return stored ? JSON.parse(stored) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  },

  setAllUsers(users: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  },

  getRoadmap(): RoadmapNode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROADMAP);
      return stored ? JSON.parse(stored) : DEFAULT_ROADMAP_NODES;
    } catch {
      return DEFAULT_ROADMAP_NODES;
    }
  },

  setRoadmap(nodes: RoadmapNode[]): void {
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(nodes));
  },

  getCatalog(): CatalogTopic[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG);
      return stored ? JSON.parse(stored) : CURATED_CATALOG;
    } catch {
      return CURATED_CATALOG;
    }
  },

  setCatalog(catalog: CatalogTopic[]): void {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
  },

  getResources(): LearningResource[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      return stored ? JSON.parse(stored) : INITIAL_RESOURCES;
    } catch {
      return INITIAL_RESOURCES;
    }
  },

  setResources(resources: LearningResource[]): void {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
  },

  saveVerificationReport(report: VerificationReport): void {
    // 1. Update in resource list
    const resources = this.getResources();
    const updated = resources.map((r) => {
      if (r.id === report.resourceId) {
        return {
          ...r,
          verificationStatus: report.status,
          verificationReport: report,
          lastCheckedDate: report.checkedAt.split('T')[0]
        };
      }
      return r;
    });
    this.setResources(updated);

    // 2. Append to verification history
    const history = this.getVerificationHistory();
    history.unshift(report);
    try {
      localStorage.setItem(STORAGE_KEYS.VERIFICATION_HISTORY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to persist verification history:', e);
    }
  },

  getVerificationHistory(): VerificationReport[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VERIFICATION_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getQuestions(): AssessmentQuestion[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return stored ? JSON.parse(stored) : INITIAL_ASSESSMENT_QUESTIONS;
    } catch {
      return INITIAL_ASSESSMENT_QUESTIONS;
    }
  },

  getAttempts(): AssessmentAttempt[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveAttempt(attempt: AssessmentAttempt): void {
    const attempts = this.getAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

    const roadmap = this.getRoadmap();
    const pct = Math.round((attempt.totalScore / attempt.maxScore) * 100);
    const updated = roadmap.map((node) => {
      if (node.topicId === attempt.topicId) {
        const newStatus = pct >= 75 ? 'completed' : pct >= 50 ? 'in_progress' : 'needs_revision';
        return {
          ...node,
          score: pct,
          status: newStatus,
          lastStudiedAt: new Date().toISOString().split('T')[0]
        };
      }
      return node;
    });

    const catalog = this.getCatalog();
    const completedIds = new Set(
      updated.filter((n) => n.status === 'completed').map((n) => n.topicId)
    );

    const reChecked = updated.map((node) => {
      const catEntry = catalog.find((c) => c.id === node.topicId);
      const prereqs = catEntry ? catEntry.prerequisiteIds : [];
      const met = prereqs.every((p) => completedIds.has(p));
      if (node.status === 'locked' && met) {
        return { ...node, status: 'available' as const, prerequisitesMet: true };
      }
      return { ...node, prerequisitesMet: met };
    });

    this.setRoadmap(reChecked);
  },

  getReportedIssues(): ReportedResourceIssue[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPORTED_ISSUES);
      return stored ? JSON.parse(stored) : INITIAL_REPORTED_ISSUES;
    } catch {
      return INITIAL_REPORTED_ISSUES;
    }
  },

  addReportedIssue(issue: ReportedResourceIssue): void {
    const issues = this.getReportedIssues();
    issues.unshift(issue);
    localStorage.setItem(STORAGE_KEYS.REPORTED_ISSUES, JSON.stringify(issues));

    const resources = this.getResources().map((r) =>
      r.id === issue.resourceId ? { ...r, isReported: true } : r
    );
    this.setResources(resources);
  },

  updateReportedIssueStatus(issueId: string, newStatus: 'resolved' | 'dismissed'): void {
    const issues = this.getReportedIssues().map((i) =>
      i.id === issueId ? { ...i, status: newStatus } : i
    );
    localStorage.setItem(STORAGE_KEYS.REPORTED_ISSUES, JSON.stringify(issues));
  },

  getPlatformConfig(): PlatformConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLATFORM_CONFIG);
      return stored ? JSON.parse(stored) : DEFAULT_PLATFORM_CONFIG;
    } catch {
      return DEFAULT_PLATFORM_CONFIG;
    }
  },

  setPlatformConfig(cfg: PlatformConfig): void {
    localStorage.setItem(STORAGE_KEYS.PLATFORM_CONFIG, JSON.stringify(cfg));
  },

  resetAllData(): void {
    localStorage.clear();
  }
};
