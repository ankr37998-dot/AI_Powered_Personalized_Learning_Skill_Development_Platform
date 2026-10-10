import { verificationService } from './verificationService';
import { LearningResource } from '../types';

export interface EvaluationScenario {
  id: string;
  name: string;
  category: 'consistent' | 'mismatch' | 'outdated' | 'insufficient_evidence' | 'missing_transcript' | 'ssrf_defense';
  resourceMock: LearningResource;
  expectedStatus: string;
  description: string;
}

export const EVALUATION_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'eval_consistent_event_loop',
    name: '1. Consistent Educational Material (JSConf Event Loop)',
    category: 'consistent',
    description: 'Accurately describes single-threaded V8 execution, call stack, WebAPIs, and task queue. Should match WHATWG & Node.js specs.',
    expectedStatus: 'verified_against_cited_references',
    resourceMock: {
      id: 'res_1',
      topicId: 'topic_event_loop',
      title: 'What the heck is the event loop anyway? (JSConf EU)',
      url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
      platform: 'YouTube',
      type: 'video',
      difficulty: 'beginner',
      durationOrReadTime: '26 mins',
      isOfficialSource: false,
      availabilityStatus: 'available',
      lastCheckedDate: '2025-02-14',
      provenance: 'curated',
      verificationStatus: 'unable_to_verify'
    }
  },
  {
    id: 'eval_mismatch_buffer_alloc',
    name: '2. Deliberate Technical Mismatch (new Buffer() usage)',
    category: 'mismatch',
    description: 'Content advocates calling deprecated new Buffer(size) without zero-filling. Must be flagged as potential mismatch due to DEP0005.',
    expectedStatus: 'potential_mismatch',
    resourceMock: {
      id: 'res_5',
      topicId: 'topic_buffers_streams',
      title: 'Legacy Tutorial: "Buffer(size) is standard for raw memory in Node"',
      url: 'https://example.com/legacy-buffer-guide-2015',
      platform: 'Tech Blog Archive',
      type: 'article',
      difficulty: 'intermediate',
      durationOrReadTime: '8 mins read',
      isOfficialSource: false,
      availabilityStatus: 'available',
      lastCheckedDate: '2025-02-22',
      provenance: 'curated',
      verificationStatus: 'unable_to_verify'
    }
  },
  {
    id: 'eval_missing_transcript',
    name: '3. Missing or Inaccessible Transcript',
    category: 'missing_transcript',
    description: 'A third-party video URL without public captions. Must return "Unable to verify" instead of guessing content.',
    expectedStatus: 'unable_to_verify',
    resourceMock: {
      id: 'eval_no_caps',
      topicId: 'topic_event_loop',
      title: 'Uncaptioned Lecture on Libuv Worker Threads',
      url: 'https://www.youtube.com/watch?v=nonexistent_nocaptions',
      platform: 'YouTube',
      type: 'video',
      difficulty: 'intermediate',
      durationOrReadTime: '45 mins',
      isOfficialSource: false,
      availabilityStatus: 'available',
      lastCheckedDate: '2025-02-24',
      provenance: 'curated',
      verificationStatus: 'unable_to_verify'
    }
  },
  {
    id: 'eval_ssrf_blocked',
    name: '4. SSRF Defense: Private Network Address',
    category: 'ssrf_defense',
    description: 'Resource pointing to internal 192.168.1.1 or localhost. Must be immediately rejected by the security filter.',
    expectedStatus: 'unable_to_verify',
    resourceMock: {
      id: 'eval_ssrf',
      topicId: 'topic_cluster_scaling',
      title: 'Internal Cluster Admin Dashboard Guide',
      url: 'http://192.168.1.50/internal-cluster-guide.html',
      platform: 'Internal Host',
      type: 'article',
      difficulty: 'advanced',
      durationOrReadTime: '5 mins',
      isOfficialSource: false,
      availabilityStatus: 'available',
      lastCheckedDate: '2025-02-25',
      provenance: 'curated',
      verificationStatus: 'unable_to_verify'
    }
  },
  {
    id: 'eval_official_documentation',
    name: '5. Direct Official Documentation Specification',
    category: 'consistent',
    description: 'Primary source Node.js documentation. Serves as ground truth specification.',
    expectedStatus: 'verified_against_cited_references',
    resourceMock: {
      id: 'res_2',
      topicId: 'topic_event_loop',
      title: 'The Node.js Event Loop, Timers, and process.nextTick() Guide',
      url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
      platform: 'Node.js Official Documentation',
      type: 'documentation',
      difficulty: 'intermediate',
      durationOrReadTime: '15 mins read',
      isOfficialSource: true,
      availabilityStatus: 'available',
      lastCheckedDate: '2025-02-20',
      provenance: 'curated',
      verificationStatus: 'unable_to_verify'
    }
  }
];

export const verificationQualityEval = {
  /**
   * Executes the automated benchmark evaluation suite and returns test results
   */
  async runEvaluationSuite(): Promise<{
    total: number;
    passed: number;
    results: {
      scenarioId: string;
      name: string;
      expected: string;
      actual: string;
      passed: boolean;
      reportSummary: string;
    }[];
  }> {
    const results = [];
    let passedCount = 0;

    for (const scenario of EVALUATION_SCENARIOS) {
      try {
        const report = await verificationService.runVerification(scenario.resourceMock);
        const passed = report.status === scenario.expectedStatus;
        if (passed) passedCount++;

        results.push({
          scenarioId: scenario.id,
          name: scenario.name,
          expected: scenario.expectedStatus,
          actual: report.status,
          passed,
          reportSummary: report.findings[0] || report.assessedContentScope
        });
      } catch (err: any) {
        results.push({
          scenarioId: scenario.id,
          name: scenario.name,
          expected: scenario.expectedStatus,
          actual: 'error',
          passed: false,
          reportSummary: err.message || 'Execution error'
        });
      }
    }

    return {
      total: EVALUATION_SCENARIOS.length,
      passed: passedCount,
      results
    };
  }
};
