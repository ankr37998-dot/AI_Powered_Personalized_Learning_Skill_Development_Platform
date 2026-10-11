import {
  UserProfile,
  RoadmapNode,
  CatalogTopic,
  LearningResource,
  AssessmentQuestion,
  AssessmentAttempt,
  VerificationReport,
  ReportedResourceIssue,
  PlatformConfig,
  SavedRoadmap,
} from "../types";
import {
  CURATED_CATALOG,
  INITIAL_RESOURCES,
  INITIAL_ASSESSMENT_QUESTIONS,
  INITIAL_REPORTED_ISSUES,
  DEFAULT_PLATFORM_CONFIG,
} from "../constants";

const STORAGE_KEYS = {
  USER_PROFILE: "cognipath_user_profile",
  ALL_USERS: "cognipath_all_users_list",
  SAVED_ROADMAPS: "cognipath_saved_roadmaps",
  ACTIVE_ROADMAP_ID: "cognipath_active_roadmap_id",
  CATALOG: "cognipath_catalog_topics",
  RESOURCES: "cognipath_resources",
  QUESTIONS: "cognipath_questions",
  ATTEMPTS: "cognipath_assessment_attempts",
  REPORTED_ISSUES: "cognipath_reported_issues",
  PLATFORM_CONFIG: "cognipath_platform_config",
  VERIFICATION_HISTORY: "cognipath_verification_history",
};

const REMOTE_STATE_FIELDS = {
  savedRoadmaps: STORAGE_KEYS.SAVED_ROADMAPS,
  activeRoadmapId: STORAGE_KEYS.ACTIVE_ROADMAP_ID,
  catalog: STORAGE_KEYS.CATALOG,
  resources: STORAGE_KEYS.RESOURCES,
  questions: STORAGE_KEYS.QUESTIONS,
  attempts: STORAGE_KEYS.ATTEMPTS,
  reportedIssues: STORAGE_KEYS.REPORTED_ISSUES,
  platformConfig: STORAGE_KEYS.PLATFORM_CONFIG,
  verificationHistory: STORAGE_KEYS.VERIFICATION_HISTORY,
} as const;

let remoteSyncTimer: ReturnType<typeof setTimeout> | null = null;
let suppressRemoteSync = false;

function parseStoredValue(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function getRemoteSnapshot(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(REMOTE_STATE_FIELDS).flatMap(([field, key]) => {
      const value = parseStoredValue(key);
      return value === undefined ? [] : [[field, value]];
    }),
  );
}

function scheduleRemoteSync(): void {
  if (suppressRemoteSync || typeof window === "undefined") return;
  if (remoteSyncTimer) clearTimeout(remoteSyncTimer);
  remoteSyncTimer = setTimeout(async () => {
    try {
      const session = parseStoredValue("cognipath_auth_session") as
        | { token?: string }
        | undefined;
      if (!session?.token) return;
      await fetch("http://localhost:5000/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ state: getRemoteSnapshot() }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Keep local data usable when the backend is temporarily unavailable.
    }
  }, 350);
}

const DEFAULT_PROFILE: UserProfile = {
  id: "usr_student_01",
  name: "Alex Rivera",
  email: "alex.rivera@university.edu",
  role: "student",
  targetGoal:
    "Master Production Node.js Architecture & Performance Engineering",
  currentSkillLevel: "intermediate",
  preferredLanguage: "JavaScript / TypeScript",
  registeredDate: "2025-01-10",
  status: "active",
};

const DEFAULT_NODEJS_ROADMAP: SavedRoadmap = {
  id: "roadmap_default_nodejs",
  studentId: "usr_student_01",
  title: "Production Node.js Architecture & Internals",
  category: "career",
  description:
    "Structured backend engineering path covering event loop phases, microtasks, binary streams, and cluster scaling.",
  targetFocus: "comprehensive",
  skillLevel: "intermediate",
  weeklyHours: 10,
  totalEstimatedHours: 48,
  createdAt: "2025-02-01T00:00:00Z",
  updatedAt: "2025-02-23T00:00:00Z",
  phases: [
    {
      id: "phase_runtimes",
      title: "Phase 1: Architecture & Asynchronous Runtimes",
      description:
        "Single-threaded event loop, 6 distinct phases, and libuv thread pool offloading.",
      order: 1,
      estimatedWeeks: 2,
      milestoneProject:
        "Build a low-overhead HTTP performance profiler measuring event-loop lag",
      topicIds: ["topic_event_loop", "topic_microtasks"],
    },
    {
      id: "phase_memory_streams",
      title: "Phase 2: Memory & High-Throughput Streams",
      description:
        "Buffer allocations outside V8 heap, zero-fill guarantees, and stream backpressure.",
      order: 2,
      estimatedWeeks: 2,
      milestoneProject:
        "Implement a zero-copy streaming file transformer with drain event backpressure handling",
      topicIds: ["topic_buffers_streams"],
    },
    {
      id: "phase_scaling_ipc",
      title: "Phase 3: Scalability & Process Management",
      description:
        "Multi-core clustering, round-robin socket delegation, and graceful shutdown.",
      order: 3,
      estimatedWeeks: 2,
      milestoneProject:
        "Deploy a zero-downtime rolling restart cluster server with health checks",
      topicIds: ["topic_cluster_scaling"],
    },
  ],
  nodes: [
    {
      topicId: "topic_event_loop",
      title: "Node.js Event Loop & Libuv Architecture",
      unit: "Phase 1: Architecture & Asynchronous Runtimes",
      phaseId: "phase_runtimes",
      status: "completed",
      order: 1,
      prerequisitesMet: true,
      score: 85,
      lastStudiedAt: "2025-02-23",
      estimatedHours: 8,
      learningObjective:
        "Master the 6 event loop phases, libuv OS abstraction, and call stack timing.",
      keyCompetencies: [
        "Identify phase execution order",
        "Diagnose event loop latency with perf_hooks",
      ],
    },
    {
      topicId: "topic_microtasks",
      title: "Microtasks: process.nextTick & Promises",
      unit: "Phase 1: Architecture & Asynchronous Runtimes",
      phaseId: "phase_runtimes",
      status: "in_progress",
      order: 2,
      prerequisitesMet: true,
      score: 60,
      lastStudiedAt: "2025-02-24",
      estimatedHours: 6,
      learningObjective:
        "Understand nextTickQueue execution priority over standard ECMAScript microtasks.",
      keyCompetencies: [
        "Predict microtask checkpoint timing",
        "Prevent recursive nextTick starvation",
      ],
    },
    {
      topicId: "topic_buffers_streams",
      title: "Buffers, Binary Data & Backpressure",
      unit: "Phase 2: Memory & High-Throughput Streams",
      phaseId: "phase_memory_streams",
      status: "needs_revision",
      order: 3,
      prerequisitesMet: true,
      score: 40,
      lastStudiedAt: "2025-02-25",
      estimatedHours: 12,
      learningObjective:
        "Allocate safe zero-filled buffers and handle backpressure using stream.pipeline and drain.",
      keyCompetencies: [
        "Audit insecure new Buffer() usage",
        "Implement highWaterMark backpressure throttling",
      ],
    },
    {
      topicId: "topic_cluster_scaling",
      title: "Process Management, Clustering & IPC",
      unit: "Phase 3: Scalability & Process Management",
      phaseId: "phase_scaling_ipc",
      status: "locked",
      order: 4,
      prerequisitesMet: false,
      estimatedHours: 14,
      learningObjective:
        "Scale backend throughput across CPU cores using master-worker socket delegation and IPC.",
      keyCompetencies: [
        "Design rolling restart zero-downtime architectures",
        "Coordinate inter-process communication",
      ],
    },
  ],
};

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  setUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // ----------------------------------------------------------------
  // Multiple Roadmaps Management
  // ----------------------------------------------------------------
  getSavedRoadmaps(): SavedRoadmap[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_ROADMAPS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Seed initial default roadmap
      this.setSavedRoadmaps([DEFAULT_NODEJS_ROADMAP]);
      return [DEFAULT_NODEJS_ROADMAP];
    } catch {
      return [DEFAULT_NODEJS_ROADMAP];
    }
  },

  setSavedRoadmaps(roadmaps: SavedRoadmap[]): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SAVED_ROADMAPS,
        JSON.stringify(roadmaps),
      );
      scheduleRemoteSync();
    } catch (e) {
      console.warn("Failed to save roadmaps in localStorage:", e);
    }
  },

  getActiveRoadmapId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROADMAP_ID);
      if (stored) return stored;
      return DEFAULT_NODEJS_ROADMAP.id;
    } catch {
      return DEFAULT_NODEJS_ROADMAP.id;
    }
  },

  setActiveRoadmapId(roadmapId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROADMAP_ID, roadmapId);
    scheduleRemoteSync();
  },

  getActiveRoadmap(): SavedRoadmap {
    const roadmaps = this.getSavedRoadmaps();
    const activeId = this.getActiveRoadmapId();
    const found = roadmaps.find((r) => r.id === activeId);
    return found || roadmaps[0] || DEFAULT_NODEJS_ROADMAP;
  },

  saveRoadmap(roadmap: SavedRoadmap): void {
    const current = this.getSavedRoadmaps();
    const existingIdx = current.findIndex((r) => r.id === roadmap.id);

    // Auto-register topics from this roadmap into curated catalog so catalog inspector has full context
    const catalog = this.getCatalog();
    const updatedCatalog = [...catalog];

    roadmap.nodes.forEach((node) => {
      if (!updatedCatalog.some((c) => c.id === node.topicId)) {
        updatedCatalog.push({
          id: node.topicId,
          title: node.title,
          category: roadmap.title,
          difficulty: roadmap.skillLevel,
          summary:
            node.learningObjective ||
            `${node.title} competency in ${roadmap.title}.`,
          prerequisiteIds: roadmap.nodes
            .filter((n) => n.order < node.order && n.topicId !== node.topicId)
            .map((n) => n.topicId)
            .slice(0, 1),
          keyCompetencies: node.keyCompetencies || [node.title],
          isActive: true,
          officialDocSources: [],
        });
      }
    });
    this.setCatalog(updatedCatalog);

    let updatedList: SavedRoadmap[];
    if (existingIdx >= 0) {
      updatedList = [...current];
      updatedList[existingIdx] = roadmap;
    } else {
      updatedList = [roadmap, ...current];
    }

    this.setSavedRoadmaps(updatedList);
    this.setActiveRoadmapId(roadmap.id);
  },

  deleteRoadmap(roadmapId: string): void {
    const current = this.getSavedRoadmaps();
    if (current.length <= 1) return; // Keep at least one roadmap
    const filtered = current.filter((r) => r.id !== roadmapId);
    this.setSavedRoadmaps(filtered);
    if (this.getActiveRoadmapId() === roadmapId) {
      this.setActiveRoadmapId(filtered[0].id);
    }
  },

  // Active Roadmap Nodes for compatibility with previous features
  getRoadmap(): RoadmapNode[] {
    const active = this.getActiveRoadmap();
    return active.nodes || [];
  },

  setRoadmap(nodes: RoadmapNode[]): void {
    const active = this.getActiveRoadmap();
    const updatedRoadmap: SavedRoadmap = {
      ...active,
      nodes,
      updatedAt: new Date().toISOString(),
    };
    this.saveRoadmap(updatedRoadmap);
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
    scheduleRemoteSync();
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
    scheduleRemoteSync();
  },

  saveVerificationReport(report: VerificationReport): void {
    const resources = this.getResources();
    const updated = resources.map((r) => {
      if (r.id === report.resourceId) {
        return {
          ...r,
          verificationStatus: report.status,
          verificationReport: report,
          lastCheckedDate: report.checkedAt.split("T")[0],
        };
      }
      return r;
    });
    this.setResources(updated);

    const history = this.getVerificationHistory();
    history.unshift(report);
    try {
      localStorage.setItem(
        STORAGE_KEYS.VERIFICATION_HISTORY,
        JSON.stringify(history.slice(0, 50)),
      );
      scheduleRemoteSync();
    } catch (e) {
      console.warn("Failed to persist verification history:", e);
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
    scheduleRemoteSync();

    const roadmap = this.getRoadmap();
    const pct = Math.round((attempt.totalScore / attempt.maxScore) * 100);
    const updated = roadmap.map((node) => {
      if (node.topicId === attempt.topicId) {
        const newStatus =
          pct >= 75
            ? "completed"
            : pct >= 50
              ? "in_progress"
              : "needs_revision";
        return {
          ...node,
          score: pct,
          status: newStatus,
          lastStudiedAt: new Date().toISOString().split("T")[0],
        };
      }
      return node;
    });

    const catalog = this.getCatalog();
    const completedIds = new Set(
      updated.filter((n) => n.status === "completed").map((n) => n.topicId),
    );

    const reChecked = updated.map((node) => {
      const catEntry = catalog.find((c) => c.id === node.topicId);
      const prereqs = catEntry ? catEntry.prerequisiteIds : [];
      const met = prereqs.every((p) => completedIds.has(p));
      if (node.status === "locked" && met) {
        return {
          ...node,
          status: "available" as const,
          prerequisitesMet: true,
        };
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
    scheduleRemoteSync();

    const resources = this.getResources().map((r) =>
      r.id === issue.resourceId ? { ...r, isReported: true } : r,
    );
    this.setResources(resources);
  },

  updateReportedIssueStatus(
    issueId: string,
    newStatus: "resolved" | "dismissed",
  ): void {
    const issues = this.getReportedIssues().map((i) =>
      i.id === issueId ? { ...i, status: newStatus } : i,
    );
    localStorage.setItem(STORAGE_KEYS.REPORTED_ISSUES, JSON.stringify(issues));
    scheduleRemoteSync();
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
    scheduleRemoteSync();
  },

  getAllUsers(): UserProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      return stored ? JSON.parse(stored) : [DEFAULT_PROFILE];
    } catch {
      return [DEFAULT_PROFILE];
    }
  },

  setAllUsers(users: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  },

  getRemoteSnapshot(): Record<string, unknown> {
    return getRemoteSnapshot();
  },

  applyRemoteSnapshot(state: Record<string, unknown>): void {
    suppressRemoteSync = true;
    try {
      for (const [field, key] of Object.entries(REMOTE_STATE_FIELDS)) {
        if (Object.prototype.hasOwnProperty.call(state, field)) {
          localStorage.setItem(key, JSON.stringify(state[field]));
        }
      }
    } finally {
      suppressRemoteSync = false;
    }
  },

  resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    scheduleRemoteSync();
  },
};
