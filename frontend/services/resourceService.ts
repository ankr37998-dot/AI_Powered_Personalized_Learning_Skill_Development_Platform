import {
  LearningResource,
  UserProfile,
  CatalogTopic,
  CheckpointStudyMaterials,
  RoadmapNode
} from '../types';
import { storageService } from './storageService';
import { officialDocsService } from './officialDocsService';

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

const BOOKMARK_STORAGE_KEY = 'cognipath_bookmarked_resources';

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
   * Deterministic explainable multi-factor ranking algorithm
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

        // Unavailable or archived resources are heavily penalized
        if (resource.availabilityStatus === 'archived' || resource.availabilityStatus === 'unavailable') {
          score -= 100;
        }

        // 1. Exact Topic Match
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
          reasons.push('Official documentation (Authoritative specification)');
        }

        // 4. Student Skill Level Match
        if (resource.difficulty && studentProfile.currentSkillLevel) {
          if (resource.difficulty === studentProfile.currentSkillLevel) {
            score += 15;
            reasons.push(`Targeted for your ${resource.difficulty} level`);
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
          }
        }

        // 6. Actual Verification Status
        if (resource.verificationStatus === 'verified_against_cited_references') {
          score += 20;
          reasons.push('Verified against cited official references');
        } else if (resource.verificationStatus === 'potential_mismatch') {
          score -= 25;
          reasons.push('Audit alert: Potential specification mismatch detected');
        }

        // 7. Freshness & Availability
        if (resource.lastCheckedDate && resource.lastCheckedDate !== 'Not yet verified') {
          score += 5;
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
   * Resolves, ranks, and categorizes study materials for a specific checkpoint
   * Implements Layer A (exact curated match), Layer B (semantic keyword match + canonical docs), and Layer C (honest fallback).
   */
  findStudyMaterialsForCheckpoint(
    node: RoadmapNode,
    studentProfile: UserProfile
  ): CheckpointStudyMaterials {
    const allResources = storageService.getResources();
    const bookmarkedIds = this.getBookmarkedIds();

    // Attach bookmark flag
    const annotatedResources = allResources.map((r) => ({
      ...r,
      isBookmarked: bookmarkedIds.has(r.id)
    }));

    // Layer A: Direct match by topicId
    let matched = annotatedResources.filter(
      (r) => r.topicId === node.topicId && r.availabilityStatus !== 'archived'
    );

    // Layer B: If no direct match (e.g. AI-generated skill topics like Android, SQL, React), search by keyword
    if (matched.length === 0) {
      const searchTerms = [
        node.title.toLowerCase(),
        node.unit.toLowerCase(),
        ...(node.keyCompetencies || []).map((k) => k.toLowerCase())
      ];

      matched = annotatedResources.filter((r) => {
        if (r.availabilityStatus === 'archived') return false;
        const resText = `${r.title} ${r.description || ''} ${r.subtopics?.join(' ') || ''}`.toLowerCase();
        return searchTerms.some((term) => {
          const words = term.split(' ').filter((w) => w.length > 3);
          return words.some((w) => resText.includes(w));
        });
      });
    }

    // Layer B (cont.): Discover relevant canonical documentation from officialDocsService
    const canonicalDocs = officialDocsService.getReferencesForTopic(
      node.topicId,
      undefined,
      node.title
    );

    canonicalDocs.forEach((doc) => {
      if (!matched.some((m) => m.url.toLowerCase() === doc.canonicalUrl.toLowerCase())) {
        matched.push({
          id: `canonical_${doc.id}`,
          topicId: node.topicId,
          title: doc.title,
          url: doc.canonicalUrl,
          platform: doc.authorityName,
          type: 'documentation',
          difficulty: 'intermediate',
          durationOrReadTime: 'Official Reference',
          description: doc.canonicalExcerpt.slice(0, 160) + '...',
          isOfficialSource: true,
          availabilityStatus: 'available',
          lastCheckedDate: doc.lastCheckedDate,
          provenance: 'curated',
          verificationStatus: 'verified_against_cited_references',
          isBookmarked: bookmarkedIds.has(`canonical_${doc.id}`)
        });
      }
    });

    // Rank matching resources
    const ranked = this.rankResourcesForStudent(matched, studentProfile, node.topicId);

    // Layer C & Categorization
    const officialDocs: LearningResource[] = [];
    const videos: LearningResource[] = [];
    const articles: LearningResource[] = [];
    const practice: LearningResource[] = [];
    const further: LearningResource[] = [];

    ranked.forEach((r) => {
      if (r.isOfficialSource || r.type === 'documentation') {
        officialDocs.push(r);
      } else if (r.type === 'video') {
        videos.push(r);
      } else if (r.type === 'practice' || r.type === 'mcq') {
        practice.push(r);
      } else if (r.type === 'article') {
        articles.push(r);
      } else {
        further.push(r);
      }
    });

    // Determine "Start Here" resource:
    // If student is beginner, prioritize beginner video or clear introductory article; otherwise best ranked
    let startHere: LearningResource | undefined;
    if (ranked.length > 0) {
      if (studentProfile.currentSkillLevel === 'beginner') {
        startHere =
          videos.find((v) => v.difficulty === 'beginner') ||
          articles.find((a) => a.difficulty === 'beginner') ||
          ranked[0];
      } else {
        startHere = ranked[0];
      }
    }

    return {
      startHere,
      officialDocumentation: officialDocs,
      videoTutorials: videos,
      articlesAndGuides: articles,
      practice,
      furtherLearning: further,
      totalCount: ranked.length
    };
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
    result = result.filter((r) => r.availabilityStatus !== 'archived');

    if (options.topicId && options.topicId !== 'all') {
      result = result.filter((r) => r.topicId === options.topicId);
    }

    if (options.subtopic && options.subtopic !== 'all') {
      result = result.filter((r) => r.subtopics && r.subtopics.includes(options.subtopic!));
    }

    if (options.type && options.type !== 'all') {
      result = result.filter((r) => r.type === options.type);
    }

    if (options.difficulty && options.difficulty !== 'all') {
      result = result.filter((r) => r.difficulty === options.difficulty);
    }

    if (options.language && options.language !== 'all') {
      result = result.filter((r) => r.language === options.language);
    }

    if (options.officialOnly) {
      result = result.filter((r) => r.isOfficialSource);
    }

    if (options.verifiedOnly) {
      result = result.filter((r) => r.verificationStatus === 'verified_against_cited_references');
    }

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

    if (options.sortBy === 'recent') {
      result.sort((a, b) => (b.lastCheckedDate || '').localeCompare(a.lastCheckedDate || ''));
    } else if (options.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
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
   * Bookmarking management (Local student persistence)
   */
  getBookmarkedIds(): Set<string> {
    try {
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  },

  toggleBookmark(resourceId: string): boolean {
    const set = this.getBookmarkedIds();
    const isNowBookmarked = !set.has(resourceId);
    if (isNowBookmarked) {
      set.add(resourceId);
    } else {
      set.delete(resourceId);
    }
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn('Failed to save bookmark:', e);
    }
    return isNowBookmarked;
  }
};
