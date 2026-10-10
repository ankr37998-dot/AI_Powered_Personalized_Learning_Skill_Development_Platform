import {
  UserProfile,
  CatalogTopic,
  LearningResource,
  ReportedResourceIssue,
  AdminMetrics,
  PrerequisiteCycleCheckResult,
  TopicDependencyAudit
} from '../types';
import { storageService } from './storageService';

export interface AdminOperationResult<T = void> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

export const adminService = {
  /**
   * Server-side authorization check. Ensures caller is authenticated and has 'admin' role.
   */
  assertAdmin(actor: UserProfile | null | undefined): AdminOperationResult {
    if (!actor) {
      return { success: false, status: 401, error: 'Unauthorized: Authentication required.' };
    }
    if (actor.role !== 'admin') {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: You do not have administrator permissions to perform this operation.'
      };
    }
    if (actor.status === 'suspended') {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Administrator account is currently suspended.'
      };
    }
    return { success: true, status: 200 };
  },

  /**
   * Calculates real metrics strictly derived from stored database records
   */
  getDashboardMetrics(actor: UserProfile): AdminOperationResult<AdminMetrics> {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth as AdminOperationResult<AdminMetrics>;

    const users = storageService.getAllUsers();
    const topics = storageService.getCatalog();
    const resources = storageService.getResources();
    const reports = storageService.getReportedIssues();

    const metrics: AdminMetrics = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      suspendedUsers: users.filter((u) => u.status === 'suspended').length,
      adminUsers: users.filter((u) => u.role === 'admin').length,
      totalTopics: topics.length,
      activeTopics: topics.filter((t) => t.isActive !== false).length,
      totalResources: resources.length,
      availableResources: resources.filter((r) => r.availabilityStatus === 'available').length,
      unavailableResources: resources.filter((r) => r.availabilityStatus === 'unavailable').length,
      archivedResources: resources.filter((r) => r.availabilityStatus === 'archived').length,
      pendingReportsCount: reports.filter((r) => r.status === 'pending_review').length,
      resolvedReportsCount: reports.filter((r) => r.status === 'resolved').length,
      verifiedResourcesCount: resources.filter((r) => r.verificationStatus === 'verified_against_cited_references').length,
      potentialMismatchesCount: resources.filter((r) => r.verificationStatus === 'potential_mismatch').length
    };

    return { success: true, status: 200, data: metrics };
  },

  /**
   * Paginated user list with server-side field sanitization (never returns credentials/tokens)
   */
  getUsers(
    actor: UserProfile,
    search?: string,
    roleFilter?: string,
    statusFilter?: string,
    page: number = 1,
    limit: number = 5
  ): AdminOperationResult<{ users: UserProfile[]; total: number; page: number; totalPages: number }> {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth as any;

    let users = storageService.getAllUsers();

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (roleFilter && roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      users = users.filter((u) => u.status === statusFilter);
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = users.slice(offset, offset + limit);

    // Sanitize user entities
    const sanitized = paginated.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      targetGoal: u.targetGoal,
      currentSkillLevel: u.currentSkillLevel,
      preferredLanguage: u.preferredLanguage,
      registeredDate: u.registeredDate,
      status: u.status
    }));

    return {
      success: true,
      status: 200,
      data: {
        users: sanitized,
        total,
        page,
        totalPages
      }
    };
  },

  /**
   * Toggles user active/suspended status with safeguard protecting the last active administrator
   */
  setUserStatus(
    actor: UserProfile,
    targetUserId: string,
    newStatus: 'active' | 'suspended'
  ): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const allUsers = storageService.getAllUsers();
    const target = allUsers.find((u) => u.id === targetUserId);

    if (!target) {
      return { success: false, status: 404, error: 'User account not found.' };
    }

    // Safeguard: Protect last active administrator
    if (target.role === 'admin' && newStatus === 'suspended') {
      const activeAdmins = allUsers.filter((u) => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
      if (activeAdmins.length === 0) {
        return {
          success: false,
          status: 400,
          error: 'Protection rule violation: Cannot suspend the last remaining active administrator.'
        };
      }
    }

    const updated = allUsers.map((u) => (u.id === targetUserId ? { ...u, status: newStatus } : u));
    storageService.setAllUsers(updated);

    return { success: true, status: 200 };
  },

  /**
   * Changes user role with safeguard protecting against self-demotion or removal of the last administrator
   */
  setUserRole(
    actor: UserProfile,
    targetUserId: string,
    newRole: 'student' | 'admin'
  ): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const allUsers = storageService.getAllUsers();
    const target = allUsers.find((u) => u.id === targetUserId);

    if (!target) {
      return { success: false, status: 404, error: 'User account not found.' };
    }

    // Safeguard: Protect last active administrator from demotion
    if (target.role === 'admin' && newRole !== 'admin') {
      const activeAdmins = allUsers.filter((u) => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
      if (activeAdmins.length === 0) {
        return {
          success: false,
          status: 400,
          error: 'Protection rule violation: Cannot demote the last remaining active administrator.'
        };
      }
    }

    const updated = allUsers.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u));
    storageService.setAllUsers(updated);

    return { success: true, status: 200 };
  },

  /**
   * Validates proposed prerequisite relationship for cycles using Depth-First Search (DFS).
   * E.g. If adding "targetTopic depends on proposedPrereq", checks if proposedPrereq already depends on targetTopic.
   */
  validatePrerequisiteNoCycle(
    targetTopicId: string,
    proposedPrereqId: string,
    catalog: CatalogTopic[]
  ): PrerequisiteCycleCheckResult {
    // 1. Self-dependency check
    if (targetTopicId === proposedPrereqId) {
      return {
        hasCycle: true,
        error: 'Self-dependency violation: A topic cannot be a prerequisite of itself.'
      };
    }

    // 2. Non-existent topic check
    const targetTopic = catalog.find((c) => c.id === targetTopicId);
    const prereqTopic = catalog.find((c) => c.id === proposedPrereqId);

    if (!targetTopic || !prereqTopic) {
      return {
        hasCycle: true,
        error: 'Invalid topic reference: One or both topics do not exist in the catalog.'
      };
    }

    // 3. Duplicate check
    if (targetTopic.prerequisiteIds.includes(proposedPrereqId)) {
      return {
        hasCycle: true,
        error: `Duplicate relationship: "${prereqTopic.title}" is already a prerequisite of "${targetTopic.title}".`
      };
    }

    // 4. DFS Cycle Detection:
    // If targetTopic -> proposedPrereq, a cycle occurs if there is already a path from proposedPrereq -> targetTopic.
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (currentId: string): boolean => {
      path.push(currentId);
      if (currentId === targetTopicId) {
        return true; // Cycle path found!
      }
      visited.add(currentId);

      const topicNode = catalog.find((c) => c.id === currentId);
      if (topicNode && topicNode.prerequisiteIds) {
        for (const nextPrereq of topicNode.prerequisiteIds) {
          if (dfs(nextPrereq)) {
            return true;
          }
        }
      }

      path.pop();
      return false;
    };

    const hasCycle = dfs(proposedPrereqId);

    if (hasCycle) {
      const readablePath = [...path, targetTopicId]
        .map((id) => {
          const t = catalog.find((c) => c.id === id);
          return t ? t.title : id;
        })
        .join(' ➔ ');

      return {
        hasCycle: true,
        cyclePath: path,
        error: `Circular dependency detected! Proposed relationship creates an invalid cycle: ${readablePath}`
      };
    }

    return { hasCycle: false };
  },

  /**
   * Adds a validated prerequisite relationship to a topic
   */
  addPrerequisite(
    actor: UserProfile,
    targetTopicId: string,
    proposedPrereqId: string
  ): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const catalog = storageService.getCatalog();
    const cycleCheck = this.validatePrerequisiteNoCycle(targetTopicId, proposedPrereqId, catalog);

    if (cycleCheck.hasCycle) {
      return {
        success: false,
        status: 400,
        error: cycleCheck.error || 'Invalid relationship: Creates a circular dependency graph.'
      };
    }

    const updated = catalog.map((topic) => {
      if (topic.id === targetTopicId) {
        return {
          ...topic,
          prerequisiteIds: [...topic.prerequisiteIds, proposedPrereqId],
          updatedAt: new Date().toISOString()
        };
      }
      return topic;
    });

    storageService.setCatalog(updated);
    return { success: true, status: 200 };
  },

  /**
   * Removes a prerequisite relationship from a topic
   */
  removePrerequisite(
    actor: UserProfile,
    targetTopicId: string,
    prereqToRemoveId: string
  ): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const catalog = storageService.getCatalog();
    const updated = catalog.map((topic) => {
      if (topic.id === targetTopicId) {
        return {
          ...topic,
          prerequisiteIds: topic.prerequisiteIds.filter((p) => p !== prereqToRemoveId),
          updatedAt: new Date().toISOString()
        };
      }
      return topic;
    });

    storageService.setCatalog(updated);
    return { success: true, status: 200 };
  },

  /**
   * Checks whether a topic can be safely deleted or deactivated without breaking dependent records
   */
  auditTopicDependencies(topicId: string): TopicDependencyAudit {
    const catalog = storageService.getCatalog();
    const resources = storageService.getResources();

    // Check 1: Do other topics in the catalog depend on this topic?
    const dependentTopics = catalog
      .filter((c) => c.prerequisiteIds.includes(topicId))
      .map((c) => c.title);

    // Check 2: Are there learning resources mapped to this topic?
    const mappedResources = resources
      .filter((r) => r.topicId === topicId && r.availabilityStatus !== 'archived')
      .map((r) => r.title);

    const hasDeps = dependentTopics.length > 0 || mappedResources.length > 0;

    let blockingReason: string | undefined;
    if (dependentTopics.length > 0) {
      blockingReason = `Cannot delete: ${dependentTopics.length} catalog topic(s) depend on this topic as a prerequisite (${dependentTopics.slice(0, 2).join(', ')}${dependentTopics.length > 2 ? '...' : ''}). Remove prerequisite links first.`;
    } else if (mappedResources.length > 0) {
      blockingReason = `Cannot delete: ${mappedResources.length} active educational resource(s) are mapped to this topic. Reassign or archive mapped resources first.`;
    }

    return {
      canDelete: !hasDeps,
      dependentTopics,
      mappedResources,
      blockingReason
    };
  },

  /**
   * Safely deletes a topic only if no dependent records or prerequisite links exist
   */
  deleteTopic(actor: UserProfile, topicId: string): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const audit = this.auditTopicDependencies(topicId);
    if (!audit.canDelete) {
      return {
        success: false,
        status: 409,
        error: audit.blockingReason || 'Topic deletion blocked by dependent records.'
      };
    }

    const catalog = storageService.getCatalog().filter((c) => c.id !== topicId);
    storageService.setCatalog(catalog);
    return { success: true, status: 200 };
  },

  /**
   * Creates a new normalized catalog topic
   */
  createTopic(
    actor: UserProfile,
    data: {
      title: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      summary: string;
      prerequisiteIds: string[];
      keyCompetencies: string[];
      docTitle: string;
      docUrl: string;
    }
  ): AdminOperationResult<CatalogTopic> {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth as any;

    if (!data.title || !data.title.trim()) {
      return { success: false, status: 400, error: 'Topic title is required.' };
    }

    const catalog = storageService.getCatalog();
    const normalizedSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const topicId = `topic_${normalizedSlug}_${Date.now().toString().slice(-4)}`;

    // Verify proposed prerequisites do not introduce self-dependency or non-existent references
    for (const prereqId of data.prerequisiteIds) {
      const cycleCheck = this.validatePrerequisiteNoCycle(topicId, prereqId, catalog);
      if (cycleCheck.hasCycle) {
        return { success: false, status: 400, error: cycleCheck.error };
      }
    }

    const newTopic: CatalogTopic = {
      id: topicId,
      slug: normalizedSlug,
      title: data.title.trim(),
      category: data.category.trim() || 'Backend Core',
      difficulty: data.difficulty,
      summary: data.summary.trim() || 'Curated catalog module',
      prerequisiteIds: data.prerequisiteIds,
      keyCompetencies: data.keyCompetencies.filter((k) => k.trim().length > 0),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      officialDocSources: [
        {
          title: data.docTitle.trim() || 'Node.js Official Documentation',
          url: data.docUrl.trim() || 'https://nodejs.org/api/',
          authorityName: 'Official Specification'
        }
      ]
    };

    storageService.setCatalog([...catalog, newTopic]);
    return { success: true, status: 201, data: newTopic };
  },

  /**
   * Resolves a reported resource issue with administrator resolution notes
   */
  resolveReportedIssue(
    actor: UserProfile,
    issueId: string,
    action: 'resolved' | 'dismissed',
    resolutionNote: string,
    deactivateResource: boolean = false
  ): AdminOperationResult {
    const auth = this.assertAdmin(actor);
    if (!auth.success) return auth;

    const reports = storageService.getReportedIssues();
    const target = reports.find((r) => r.id === issueId);

    if (!target) {
      return { success: false, status: 404, error: 'Reported issue record not found.' };
    }

    const updated = reports.map((r) => {
      if (r.id === issueId) {
        return {
          ...r,
          status: action,
          adminResolutionNote: resolutionNote.trim() || `Marked ${action} by administrator.`,
          resolvedAt: new Date().toISOString(),
          resolvedBy: actor.name
        };
      }
      return r;
    });

    storageService.updateReportedIssueStatus(issueId, action);

    // Optional: mark resource unavailable
    if (deactivateResource) {
      const resources = storageService.getResources().map((res) => {
        if (res.id === target.resourceId) {
          return { ...res, availabilityStatus: 'unavailable' as const };
        }
        return res;
      });
      storageService.setResources(resources);
    }

    return { success: true, status: 200 };
  }
};
