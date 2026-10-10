import {
  UserProfile,
  RoadmapNode,
  CatalogTopic,
  LearningResource,
  AssessmentQuestion,
  AssessmentAttempt,
  VerificationReport
} from '../types';
import { CURATED_CATALOG, INITIAL_RESOURCES, INITIAL_ASSESSMENT_QUESTIONS } from '../constants';

const STORAGE_KEYS = {
  USER_PROFILE: 'cognipath_user_profile',
  ROADMAP: 'cognipath_roadmap_nodes',
  CATALOG: 'cognipath_catalog_topics',
  RESOURCES: 'cognipath_resources',
  QUESTIONS: 'cognipath_questions',
  ATTEMPTS: 'cognipath_assessment_attempts',
  LAST_SYLLABUS: 'cognipath_last_syllabus_raw'
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_student_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  role: 'student',
  targetGoal: 'Master Production Node.js Architecture & Performance Engineering',
  currentSkillLevel: 'intermediate',
  preferredLanguage: 'JavaScript / TypeScript'
};

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

  updateResourceVerification(resourceId: string, report: VerificationReport): void {
    const resources = this.getResources();
    const updated = resources.map((r) => {
      if (r.id === resourceId) {
        return {
          ...r,
          verificationStatus: report.status,
          verificationReport: report,
          lastCheckedDate: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    });
    this.setResources(updated);
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

    // Update topic score and status in roadmap
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

    // Re-evaluate unlock status for dependent topics
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

  resetAllData(): void {
    localStorage.clear();
  }
};
