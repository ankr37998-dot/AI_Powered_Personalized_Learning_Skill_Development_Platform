import { LearningResource, UserProfile, CatalogTopic } from '../types';
import { storageService } from './storageService';

export interface ResourceFilterOptions {
  topicId?: string;
  subtopic?: string;
  type?: string;
  difficulty?: string;
  language?: string;
  officialOnly?: boolean;
  verifiedOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'recommended' | 'recent' | 'title';
}

export const resourceService = {
  /**
   * Validates external URL format
   */
  isValidUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * Baseline explainable recommendation engine
   * Ranks resources deterministically based on topic, subtopic, student skill level,
   * language preference, official source authority, and actual verification status.
   */
  rankResourcesForStudent(
    resources: LearningResource[],
    studentProfile: UserProfile,
    targetTopicId?: string,
    targetSubtopic?: string
  ): LearningResource[] {
    return resources
      .map((resource) => {
        let score = 0;
        const reasons: string[] = [];

        // Unavailable or archived resources are deprioritized
        if (resource.availabilityStatus === 'archived' || resource.availabilityStatus === 'unavailable') {
          score -= 100;
        }

        // 1. Topic Match
        if (targetTopicId && resource.topicId === targetTopicId) {
          score += 40;
          reasons.push('Directly matches the active learning topic');
        }

        // 2. Subtopic Match
        if (targetSubtopic && resource.subtopics && resource.subtopics.includes(targetSubtopic)) {
          score += 25;
          reasons.push(`Covers specific subtopic: "${targetSubtopic}"`);
        }

        // 3. Official Documentation Authority
        if (resource.isOfficialSource) {
          score += 30;
          reasons.push('Official documentation reference (Authoritative runtime spec)');
        }

        // 4. Student Skill Level Match
        if (resource.difficulty && studentProfile.currentSkillLevel) {
          if (resource.difficulty === studentProfile.currentSkillLevel) {
            score += 15;
            reasons.push(`Targeted for your current level (${resource.difficulty})`);
          } else if (
            studentProfile.currentSkillLevel === 'beginner' &&
            resource.difficulty === 'intermediate'
          ) {
            score += 5;
          }
        }

        // 5. Preferred Language Match
        if (resource.language && studentProfile.preferredLanguage) {
          if (
            studentProfile.preferredLanguage.toLowerCase().includes(resource.language.toLowerCase()) ||
            resource.language.toLowerCase() === 'english'
          ) {
            score += 10;
            reasons.push(`Available in preferred dialect (${resource.language})`);
          }
        }

        // 6. Actual Verification Status (only when genuine verification exists)
        if (resource.verificationStatus === 'verified_against_cited_references') {
          score += 20;
          reasons.push('Verified against cited official references');
        } else if (resource.verificationStatus === 'potential_mismatch') {
          score -= 25;
          reasons.push('Audit warning: Potential specification mismatch detected');
        }

        // 7. Freshness & Availability Check
        if (resource.lastCheckedDate && resource.lastCheckedDate !== 'Not yet verified') {
          score += 5;
          reasons.push('Recently checked for availability');
        }

        return {
          ...resource,
          recommendationScore: score,
          recommendationReasons: reasons
        };
      })
      .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  },

  /**
   * Filters and sorts resources according to user criteria
   */
  filterResources(
    resources: LearningResource[],
    options: ResourceFilterOptions,
    studentProfile?: UserProfile
  ): LearningResource[] {
    let result = [...resources];

    // Exclude archived by default unless specifically requested
    result = result.filter((r) => r.availabilityStatus !== 'archived');

    // Topic Filter
    if (options.topicId && options.topicId !== 'all') {
      result = result.filter((r) => r.topicId === options.topicId);
    }

    // Subtopic Filter
    if (options.subtopic && options.subtopic !== 'all') {
      result = result.filter((r) => r.subtopics && r.subtopics.includes(options.subtopic!));
    }

    // Type Filter
    if (options.type && options.type !== 'all') {
      result = result.filter((r) => r.type === options.type);
    }

    // Difficulty Filter
    if (options.difficulty && options.difficulty !== 'all') {
      result = result.filter((r) => r.difficulty === options.difficulty);
    }

    // Language Filter
    if (options.language && options.language !== 'all') {
      result = result.filter((r) => r.language === options.language);
    }

    // Official Only Filter
    if (options.officialOnly) {
      result = result.filter((r) => r.isOfficialSource);
    }

    // Verified Only Filter
    if (options.verifiedOnly) {
      result = result.filter((r) => r.verificationStatus === 'verified_against_cited_references');
    }

    // Search Query
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.platform.toLowerCase().includes(q) ||
          (r.authorOrChannel && r.authorOrChannel.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.subtopics && r.subtopics.some((st) => st.toLowerCase().includes(q)))
      );
    }

    // Sort Ordering
    if (options.sortBy === 'recent') {
      result.sort((a, b) => (b.lastCheckedDate || '').localeCompare(a.lastCheckedDate || ''));
    } else if (options.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: Recommended
      if (studentProfile) {
        result = this.rankResourcesForStudent(
          result,
          studentProfile,
          options.topicId !== 'all' ? options.topicId : undefined,
          options.subtopic !== 'all' ? options.subtopic : undefined
        );
      }
    }

    return result;
  },

  /**
   * Adds a new curated resource (Admin only)
   */
  addResource(
    resourceData: Omit<LearningResource, 'id' | 'provenance' | 'lastCheckedDate' | 'verificationStatus'>,
    adminProfile: UserProfile
  ): { success: boolean; resource?: LearningResource; error?: string } {
    if (adminProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin privileges required to add resources.' };
    }

    if (!resourceData.title || resourceData.title.trim().length === 0) {
      return { success: false, error: 'Resource title is required.' };
    }

    if (!this.isValidUrl(resourceData.url)) {
      return { success: false, error: 'Valid HTTP/HTTPS URL is required.' };
    }

    if (!resourceData.topicId) {
      return { success: false, error: 'Associated topic selection is required.' };
    }

    const newResource: LearningResource = {
      ...resourceData,
      id: `res_${Date.now()}`,
      provenance: 'admin_entered',
      lastCheckedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'unable_to_verify',
      availabilityStatus: resourceData.availabilityStatus || 'available'
    };

    const currentList = storageService.getResources();
    const updated = [newResource, ...currentList];
    storageService.setResources(updated);

    return { success: true, resource: newResource };
  },

  /**
   * Updates an existing resource's metadata (Admin only)
   */
  updateResource(
    resourceId: string,
    updatedData: Partial<LearningResource>,
    adminProfile: UserProfile
  ): { success: boolean; error?: string } {
    if (adminProfile.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin privileges required.' };
    }

    if (updatedData.url && !this.isValidUrl(updatedData.url)) {
      return { success: false, error: 'Valid HTTP/HTTPS URL is required.' };
    }

    const currentList = storageService.getResources();
    const index = currentList.findIndex((r) => r.id === resourceId);
    if (index === -1) {
      return { success: false, error: 'Resource not found.' };
    }

    currentList[index] = {
      ...currentList[index],
      ...updatedData,
      lastCheckedDate: new Date().toISOString().split('T')[0]
    };

    storageService.setResources(currentList);
    return { success: true };
  },

  /**
   * Toggles availability or archives a resource
   */
  setResourceAvailability(
    resourceId: string,
    status: LearningResource['availabilityStatus'],
    adminProfile: UserProfile
  ): { success: boolean; error?: string } {
    return this.updateResource(resourceId, { availabilityStatus: status }, adminProfile);
  }
};
