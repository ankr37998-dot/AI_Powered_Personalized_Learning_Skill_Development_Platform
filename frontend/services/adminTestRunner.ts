import { adminService } from './adminService';
import { contentAccessService } from './contentAccessService';
import { AdminSecurityTestResult, CatalogTopic, UserProfile } from '../types';

export const adminTestRunner = {
  /**
   * Executes the comprehensive administrative security and constraint test suite
   */
  async runSuite(
    studentActor: UserProfile,
    adminActor: UserProfile
  ): Promise<{ passed: number; total: number; results: AdminSecurityTestResult[] }> {
    const results: AdminSecurityTestResult[] = [];

    // TEST 1: Unauthenticated request rejection
    const unauthCheck = adminService.assertAdmin(null);
    results.push({
      id: 'test_1_unauth',
      title: 'Reject Unauthenticated Admin Request',
      category: 'authorization',
      expected: 'Status 401 Unauthorized',
      actual: `Status ${unauthCheck.status} (${unauthCheck.error || 'Authorized'})`,
      passed: unauthCheck.status === 401,
      details: 'Confirms that anonymous or unauthenticated requests cannot access admin operations.'
    });

    // TEST 2: Student 403 Forbidden rejection
    const studentCheck = adminService.assertAdmin(studentActor);
    results.push({
      id: 'test_2_student_forbidden',
      title: 'Reject Student Role with 403 Forbidden',
      category: 'authorization',
      expected: 'Status 403 Forbidden',
      actual: `Status ${studentCheck.status} (${studentCheck.error || 'Authorized'})`,
      passed: studentCheck.status === 403,
      details: 'Ensures student role is barred from administrative mutation endpoints.'
    });

    // TEST 3: Admin role authorized
    const adminCheck = adminService.assertAdmin(adminActor);
    results.push({
      id: 'test_3_admin_authorized',
      title: 'Authorize Legitimate Administrator',
      category: 'authorization',
      expected: 'Status 200 Authorized',
      actual: `Status ${adminCheck.status}`,
      passed: adminCheck.status === 200,
      details: 'Ensures valid administrator role is granted execution access.'
    });

    // TEST 4: Protect Last Active Administrator from Demotion
    const lastAdminDemoteCheck = adminService.setUserRole(adminActor, adminActor.id, 'student');
    results.push({
      id: 'test_4_last_admin_demote',
      title: 'Prevent Accidental Last-Admin Demotion',
      category: 'user_management',
      expected: 'Status 400 (Protection rule violation)',
      actual: `Status ${lastAdminDemoteCheck.status} (${lastAdminDemoteCheck.error})`,
      passed: lastAdminDemoteCheck.status === 400,
      details: 'Prevents locking out the platform by blocking demotion of the sole active administrator.'
    });

    // TEST 5: Cycle Detection - Direct Self-Dependency
    const selfDepCheck = adminService.validatePrerequisiteNoCycle(
      'topic_event_loop',
      'topic_event_loop',
      []
    );
    results.push({
      id: 'test_5_self_dep',
      title: 'Prerequisite Graph: Reject Self-Dependency',
      category: 'prerequisite_graph',
      expected: 'hasCycle: true (Self-dependency rejected)',
      actual: `hasCycle: ${selfDepCheck.hasCycle} (${selfDepCheck.error})`,
      passed: selfDepCheck.hasCycle,
      details: 'Ensures topic cannot declare itself as a prerequisite.'
    });

    // TEST 6: Cycle Detection - Multi-Node Circular Chain (A -> B -> C -> A)
    const mockGraph: CatalogTopic[] = [
      {
        id: 'topic_A',
        title: 'Topic A',
        category: 'Test',
        difficulty: 'intermediate',
        summary: '',
        prerequisiteIds: ['topic_B'],
        keyCompetencies: [],
        officialDocSources: []
      },
      {
        id: 'topic_B',
        title: 'Topic B',
        category: 'Test',
        difficulty: 'intermediate',
        summary: '',
        prerequisiteIds: ['topic_C'],
        keyCompetencies: [],
        officialDocSources: []
      },
      {
        id: 'topic_C',
        title: 'Topic C',
        category: 'Test',
        difficulty: 'intermediate',
        summary: '',
        prerequisiteIds: [],
        keyCompetencies: [],
        officialDocSources: []
      }
    ];

    // Attempt to make Topic C depend on Topic A (creates A -> B -> C -> A cycle)
    const cycleCheck = adminService.validatePrerequisiteNoCycle('topic_C', 'topic_A', mockGraph);
    results.push({
      id: 'test_6_indirect_cycle',
      title: 'Prerequisite Graph: Detect & Block Indirect Cycle (A➔B➔C➔A)',
      category: 'prerequisite_graph',
      expected: 'hasCycle: true with full cycle trace',
      actual: `hasCycle: ${cycleCheck.hasCycle} (${cycleCheck.error})`,
      passed: cycleCheck.hasCycle && (cycleCheck.error?.includes('Circular dependency') ?? false),
      details: 'DFS graph traversal detects indirect cycle and returns the explainable cycle path.'
    });

    // TEST 7: Dependent Record Deletion Guard
    const depAudit = adminService.auditTopicDependencies('topic_event_loop');
    results.push({
      id: 'test_7_dependent_delete_guard',
      title: 'Topic Safety: Block Deletion of Topic with Active Prerequisite Links',
      category: 'topic_safety',
      expected: 'canDelete: false (Blocked by dependencies)',
      actual: `canDelete: ${depAudit.canDelete} (${depAudit.blockingReason})`,
      passed: !depAudit.canDelete,
      details: 'Prevents database corruption by rejecting topic deletion when other modules depend on it.'
    });

    // TEST 8: SSRF Security Defense on URL Verification
    const ssrfCheck = contentAccessService.validateUrlSafety('http://127.0.0.1:8080/admin/secrets');
    results.push({
      id: 'test_8_ssrf_safety',
      title: 'Resource Integrity: Block Loopback / SSRF URL Injection',
      category: 'resource_integrity',
      expected: 'isSafe: false (Blocked destination)',
      actual: `isSafe: ${ssrfCheck.isSafe} (${ssrfCheck.reason})`,
      passed: !ssrfCheck.isSafe,
      details: 'Ensures URL checkers cannot be coerced into fetching private network infrastructure.'
    });

    const passedCount = results.filter((r) => r.passed).length;

    return {
      passed: passedCount,
      total: results.length,
      results
    };
  }
};
