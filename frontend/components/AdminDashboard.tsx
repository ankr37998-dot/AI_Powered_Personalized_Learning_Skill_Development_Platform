import React, { useState, useEffect } from 'react';
import {
  CatalogTopic,
  LearningResource,
  ReportedResourceIssue,
  UserProfile,
  PlatformConfig,
  ResourceType,
  ResourceAvailability,
  AdminMetrics,
  AdminSecurityTestResult
} from '../types';
import { storageService } from './../services/storageService';
import { resourceService } from '../services/resourceService';
import { adminService } from '../services/adminService';
import { adminTestRunner } from '../services/adminTestRunner';
import {
  ShieldAlert,
  Database,
  Link2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Users,
  Flag,
  Settings,
  Layers,
  Archive,
  Power,
  ShieldCheck,
  Check,
  X,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  FlaskConical,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdminDashboardProps {
  catalog: CatalogTopic[];
  resources: LearningResource[];
  currentUser: UserProfile;
  onUpdateCatalog: (newCatalog: CatalogTopic[]) => void;
  onUpdateResources: (newResources: LearningResource[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  catalog,
  resources,
  currentUser,
  onUpdateCatalog,
  onUpdateResources
}) => {
  // Navigation tabs
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'users' | 'catalog' | 'prerequisites' | 'resources' | 'reports' | 'security_tests'
  >('overview');

  // Metrics state
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  // User management states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [usersData, setUsersData] = useState<{
    users: UserProfile[];
    total: number;
    page: number;
    totalPages: number;
  }>({ users: [], total: 0, page: 1, totalPages: 1 });

  // Topic catalog form states
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('Backend Core');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [newTopicSummary, setNewTopicSummary] = useState('');
  const [newTopicCompetencies, setNewTopicCompetencies] = useState('');
  const [newTopicDocTitle, setNewTopicDocTitle] = useState('Node.js API Reference');
  const [newTopicDocUrl, setNewTopicDocUrl] = useState('https://nodejs.org/api/');
  const [topicError, setTopicError] = useState<string | null>(null);
  const [topicSuccess, setTopicSuccess] = useState<string | null>(null);

  // Prerequisite relationship management states
  const [selectedTargetTopicId, setSelectedTargetTopicId] = useState(catalog[0]?.id || '');
  const [selectedProposedPrereqId, setSelectedProposedPrereqId] = useState(catalog[1]?.id || '');
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [prereqSuccess, setPrereqSuccess] = useState<string | null>(null);

  // Resource management states
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resPlatform, setResPlatform] = useState('YouTube');
  const [resType, setResType] = useState<ResourceType>('video');
  const [resTopicId, setResTopicId] = useState(catalog[0]?.id || 'topic_event_loop');
  const [resSubtopics, setResSubtopics] = useState('');
  const [resDifficulty, setResDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [resDuration, setResDuration] = useState('15 mins');
  const [resDescription, setResDescription] = useState('');
  const [resIsOfficial, setResIsOfficial] = useState(false);
  const [resAuthor, setResAuthor] = useState('');
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceSuccess, setResourceSuccess] = useState<string | null>(null);

  // Issue reporting states
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [deactivateReportedRes, setDeactivateReportedRes] = useState(false);

  // Security tests state
  const [testResults, setTestResults] = useState<{
    passed: number;
    total: number;
    results: AdminSecurityTestResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Load metrics & users
  const refreshData = () => {
    const mRes = adminService.getDashboardMetrics(currentUser);
    if (mRes.success && mRes.data) {
      setMetrics(mRes.data);
    }
    const uRes = adminService.getUsers(currentUser, userSearch, userRoleFilter, 'all', userPage, 5);
    if (uRes.success && uRes.data) {
      setUsersData(uRes.data);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser, userSearch, userRoleFilter, userPage, catalog, resources]);

  // Authorization check banner
  const authCheck = adminService.assertAdmin(currentUser);
  if (!authCheck.success) {
    return (
      <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">403 Forbidden - Access Denied</h2>
        <p className="text-xs text-rose-300 max-w-md mx-auto">
          {authCheck.error || 'You do not possess the required administrator credentials to view this console.'}
        </p>
      </div>
    );
  }

  // Handle Add Topic
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setTopicError(null);
    setTopicSuccess(null);

    const compList = newTopicCompetencies
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const res = adminService.createTopic(currentUser, {
      title: newTopicTitle,
      category: newTopicCategory,
      difficulty: newTopicDifficulty,
      summary: newTopicSummary,
      prerequisiteIds: [],
      keyCompetencies: compList,
      docTitle: newTopicDocTitle,
      docUrl: newTopicDocUrl
    });

    if (!res.success) {
      setTopicError(res.error || 'Failed to create topic.');
    } else {
      setTopicSuccess(`Topic "${newTopicTitle}" created successfully.`);
      onUpdateCatalog(storageService.getCatalog());
      setNewTopicTitle('');
      setNewTopicSummary('');
      setNewTopicCompetencies('');
    }
  };

  // Handle Delete Topic with Dependency Audit
  const handleDeleteTopic = (topicId: string) => {
    setTopicError(null);
    setTopicSuccess(null);

    const audit = adminService.auditTopicDependencies(topicId);
    if (!audit.canDelete) {
      setTopicError(audit.blockingReason || 'Cannot delete topic due to active dependencies.');
      return;
    }

    if (confirm('Permanently delete this topic from the catalog? This action cannot be undone.')) {
      const res = adminService.deleteTopic(currentUser, topicId);
      if (!res.success) {
        setTopicError(res.error || 'Failed to delete topic.');
      } else {
        setTopicSuccess('Topic removed successfully from catalog.');
        onUpdateCatalog(storageService.getCatalog());
      }
    }
  };

  // Handle Add Prerequisite with Cycle Detection
  const handleAddPrerequisite = () => {
    setPrereqError(null);
    setPrereqSuccess(null);

    const res = adminService.addPrerequisite(currentUser, selectedTargetTopicId, selectedProposedPrereqId);
    if (!res.success) {
      setPrereqError(res.error || 'Failed to link prerequisite.');
    } else {
      setPrereqSuccess('Prerequisite relationship validated and saved.');
      onUpdateCatalog(storageService.getCatalog());
    }
  };

  // Handle Remove Prerequisite
  const handleRemovePrereq = (targetId: string, prereqId: string) => {
    const res = adminService.removePrerequisite(currentUser, targetId, prereqId);
    if (!res.success) {
      setPrereqError(res.error || 'Failed to remove relationship.');
    } else {
      setPrereqSuccess('Prerequisite link removed.');
      onUpdateCatalog(storageService.getCatalog());
    }
  };

  // Handle Add Resource
  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceError(null);
    setResourceSuccess(null);

    const subList = resSubtopics
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const res = resourceService.addResource(
      {
        title: resTitle.trim(),
        url: resUrl.trim(),
        platform: resPlatform.trim(),
        type: resType,
        topicId: resTopicId,
        subtopics: subList,
        difficulty: resDifficulty,
        language: 'English',
        durationOrReadTime: resDuration.trim(),
        description: resDescription.trim(),
        isOfficialSource: resIsOfficial,
        availabilityStatus: 'available',
        authorOrChannel: resAuthor.trim()
      },
      currentUser
    );

    if (!res.success) {
      setResourceError(res.error || 'Failed to create resource.');
    } else {
      setResourceSuccess('Resource registered in catalog.');
      onUpdateResources(storageService.getResources());
      setResTitle('');
      setResUrl('');
      setResDescription('');
      setResSubtopics('');
    }
  };

  // Handle Toggle User Status with Last-Admin Guard
  const handleToggleStatus = (targetUser: UserProfile) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const res = adminService.setUserStatus(currentUser, targetUser.id, nextStatus);
    if (!res.success) {
      alert(res.error);
    } else {
      refreshData();
    }
  };

  // Handle Role Change with Last-Admin Guard
  const handleChangeRole = (targetUser: UserProfile, newRole: 'student' | 'admin') => {
    const res = adminService.setUserRole(currentUser, targetUser.id, newRole);
    if (!res.success) {
      alert(res.error);
    } else {
      refreshData();
    }
  };

  // Handle Issue Resolution
  const handleResolveIssue = (issueId: string, action: 'resolved' | 'dismissed') => {
    const res = adminService.resolveReportedIssue(
      currentUser,
      issueId,
      action,
      resolutionNote,
      deactivateReportedRes
    );
    if (!res.success) {
      alert(res.error);
    } else {
      setSelectedIssueId(null);
      setResolutionNote('');
      setDeactivateReportedRes(false);
      refreshData();
      onUpdateResources(storageService.getResources());
    }
  };

  // Run Test Suite
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const studentMock: UserProfile = {
        id: 'usr_student_mock',
        name: 'Student Learner',
        email: 'student@uni.edu',
        role: 'student',
        targetGoal: 'Study',
        currentSkillLevel: 'beginner',
        preferredLanguage: 'JS',
        registeredDate: '2025-01-01',
        status: 'active'
      };
      const res = await adminTestRunner.runSuite(studentMock, currentUser);
      setTestResults(res);
    } finally {
      setIsRunningTests(false);
    }
  };

  const reports = storageService.getReportedIssues();
  const selectedTargetTopic = catalog.find((c) => c.id === selectedTargetTopicId);

  // Find reverse dependencies ("Topics that depend on selected topic")
  const reverseDependencies = catalog.filter((c) =>
    c.prerequisiteIds.includes(selectedTargetTopicId)
  );

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Administrator Governance Console</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Platform Operations & Security Management</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Role-enforced governance over user accounts, prerequisite dependency graphs, educational resources, and broken links.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-center"
          >
            <FlaskConical className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'Running Security Tests...' : 'Run Security Test Suite'}</span>
          </button>
        </div>

        {/* 7 Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-amber-900/40 text-xs">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'overview' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Platform Metrics</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'users' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts ({metrics?.totalUsers || 0})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'catalog' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Topic Catalog ({catalog.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('prerequisites')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'prerequisites' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Prerequisite Graph & Cycle Guard</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'resources' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Resource Catalog ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'reports' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Reported Links ({metrics?.pendingReportsCount || 0} Pending)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('security_tests')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeAdminTab === 'security_tests' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Security Test Suite</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeAdminTab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[11px] font-medium text-slate-400">Total Users</span>
              <div className="text-2xl font-bold text-white mt-1">{metrics.totalUsers}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">{metrics.activeUsers} active • {metrics.suspendedUsers} suspended</div>
            </div>

            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[11px] font-medium text-slate-400">Curated Topics</span>
              <div className="text-2xl font-bold text-white mt-1">{metrics.totalTopics}</div>
              <div className="text-[11px] text-cyan-400 mt-0.5">{metrics.activeTopics} active in roadmaps</div>
            </div>

            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[11px] font-medium text-slate-400">Total Resources</span>
              <div className="text-2xl font-bold text-white mt-1">{metrics.totalResources}</div>
              <div className="text-[11px] text-indigo-400 mt-0.5">{metrics.availableResources} live • {metrics.unavailableResources} flagged</div>
            </div>

            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[11px] font-medium text-slate-400">Pending Issues</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.pendingReportsCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{metrics.resolvedReportsCount} resolved reports</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Documentation Verification Health</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Verified Against Cited References:</span>
                  <span className="font-bold text-emerald-400">{metrics.verifiedResourcesCount}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Potential Specification Mismatches:</span>
                  <span className="font-bold text-amber-400">{metrics.potentialMismatchesCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Runtime Governance Status</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span>Prerequisite Graph Integrity:</span>
                  <span className="font-bold text-emerald-400">Acyclic (Cycle Guard Enforced)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span>Administrator Account Safeguard:</span>
                  <span className="font-bold text-emerald-400">Last-Admin Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-slate-400 font-medium">Role:</label>
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5">Registered Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No registered users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((u) => {
                      const isSelf = u.id === currentUser.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-750 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">{u.registeredDate}</td>
                          <td className="p-3.5 text-right space-x-2">
                            {/* Role Toggle Button */}
                            <button
                              disabled={isSelf}
                              onClick={() => handleChangeRole(u, u.role === 'admin' ? 'student' : 'admin')}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                              title={isSelf ? 'Cannot demote current active admin session' : 'Change user role'}
                            >
                              {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                            </button>

                            {/* Status Toggle Button */}
                            <button
                              disabled={isSelf}
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition disabled:opacity-40 ${
                                u.status === 'active'
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/60'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-900/80 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing page {usersData.page} of {usersData.totalPages} ({usersData.total} users total)
              </span>
              <div className="flex items-center space-x-1">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => p - 1)}
                  className="p-1 rounded bg-slate-800 disabled:opacity-30 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={userPage >= usersData.totalPages}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="p-1 rounded bg-slate-800 disabled:opacity-30 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPIC CATALOG MANAGEMENT */}
      {activeAdminTab === 'catalog' && (
        <div className="space-y-6">
          {/* Create Topic Form */}
          <form onSubmit={handleCreateTopic} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Supported Learning Topic</span>
            </h3>

            {topicError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            {topicSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{topicSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-medium">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Worker Threads & CPU-Bound Concurrency"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Difficulty Level *</label>
                <select
                  value={newTopicDifficulty}
                  onChange={(e) => setNewTopicDifficulty(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-400 font-medium">Technical Summary / Scope *</label>
                <input
                  type="text"
                  required
                  value={newTopicSummary}
                  onChange={(e) => setNewTopicSummary(e.target.value)}
                  placeholder="Runtime behavior, threading primitives, and memory isolation..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-medium">Canonical Official Doc URL *</label>
                <input
                  type="url"
                  required
                  value={newTopicDocUrl}
                  onChange={(e) => setNewTopicDocUrl(e.target.value)}
                  placeholder="https://nodejs.org/api/worker_threads.html"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Authority Specification Name</label>
                <input
                  type="text"
                  value={newTopicDocTitle}
                  onChange={(e) => setNewTopicDocTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-400 font-medium">Key Competencies (1 per line)</label>
                <textarea
                  rows={2}
                  value={newTopicCompetencies}
                  onChange={(e) => setNewTopicCompetencies(e.target.value)}
                  placeholder="Distinguish worker threads from child processes&#10;Transfer ArrayBuffer without memory copy"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white mt-1 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Topic in Catalog</span>
            </button>
          </form>

          {/* Topic Listing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Catalog Topics ({catalog.length})
            </h4>

            {catalog.map((cat) => {
              const audit = adminService.auditTopicDependencies(cat.id);

              return (
                <div
                  key={cat.id}
                  className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{cat.title}</span>
                      <span className="font-mono text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                        {cat.id}
                      </span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded uppercase font-semibold">
                        {cat.difficulty}
                      </span>
                    </div>

                    <p className="text-slate-300 max-w-2xl">{cat.summary}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>Prerequisites:</span>
                      {cat.prerequisiteIds.length === 0 ? (
                        <span className="text-slate-500">None (Foundational)</span>
                      ) : (
                        cat.prerequisiteIds.map((p, idx) => (
                          <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300 font-mono">
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDeleteTopic(cat.id)}
                      title={audit.canDelete ? 'Delete topic' : audit.blockingReason}
                      className={`p-2 rounded-lg border transition ${
                        audit.canDelete
                          ? 'bg-slate-900 text-slate-400 hover:text-rose-400 border-slate-700'
                          : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PREREQUISITE GRAPH & CYCLE GUARD */}
      {activeAdminTab === 'prerequisites' && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Link Prerequisite Relationship with Cycle Detection (DFS)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Adding prerequisite edges dynamically updates learner roadmap progression. The engine automatically rejects self-dependencies and multi-node circular chains.
              </p>
            </div>

            {prereqError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{prereqError}</span>
              </div>
            )}

            {prereqSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{prereqSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Target Topic (Which topic needs the prereq?)</label>
                <select
                  value={selectedTargetTopicId}
                  onChange={(e) => setSelectedTargetTopicId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Proposed Required Prerequisite</label>
                <select
                  value={selectedProposedPrereqId}
                  onChange={(e) => setSelectedProposedPrereqId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddPrerequisite}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Validate & Link Prerequisite</span>
            </button>
          </div>

          {/* Active Target Topic Graph Inspector */}
          {selectedTargetTopic && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Graph Inspector for: <span className="text-white">{selectedTargetTopic.title}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Outgoing: Prerequisites needed by this topic */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-cyan-400 block">
                    Prerequisites needed by this topic ({selectedTargetTopic.prerequisiteIds.length}):
                  </span>
                  {selectedTargetTopic.prerequisiteIds.length === 0 ? (
                    <p className="text-slate-500 text-[11px] italic">No prerequisites. Accessible immediately.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedTargetTopic.prerequisiteIds.map((pId) => {
                        const prereqObj = catalog.find((c) => c.id === pId);

                        return (
                          <div
                            key={pId}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700"
                          >
                            <span className="text-slate-200">{prereqObj ? prereqObj.title : pId}</span>
                            <button
                              onClick={() => handleRemovePrereq(selectedTargetTopic.id, pId)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remove relationship"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Incoming: Topics that depend on this topic */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-indigo-400 block">
                    Reverse Dependencies ({reverseDependencies.length} topics depend on this):
                  </span>
                  {reverseDependencies.length === 0 ? (
                    <p className="text-slate-500 text-[11px] italic">No topics currently depend on this topic.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reverseDependencies.map((dep) => (
                        <div
                          key={dep.id}
                          className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-between"
                        >
                          <span>{dep.title}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">Dependent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RESOURCE CATALOG MANAGEMENT */}
      {activeAdminTab === 'resources' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateResource} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Curated Educational Resource</span>
            </h3>

            {resourceError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs">
                {resourceError}
              </div>
            )}

            {resourceSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{resourceSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-medium">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Node.js Streams & Backpressure Demystified"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Resource Type *</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as ResourceType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  <option value="video">Video</option>
                  <option value="documentation">Official Documentation</option>
                  <option value="article">Article / Tutorial</option>
                  <option value="mcq">Practice MCQ</option>
                  <option value="practice">Coding Practice</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-medium">External URL (Validated against SSRF) *</label>
                <input
                  type="url"
                  required
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Platform / Host</label>
                <input
                  type="text"
                  value={resPlatform}
                  onChange={(e) => setResPlatform(e.target.value)}
                  placeholder="e.g. YouTube, Node.js Docs"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Associated Topic *</label>
                <select
                  value={resTopicId}
                  onChange={(e) => setResTopicId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  {catalog.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Difficulty Level</label>
                <select
                  value={resDifficulty}
                  onChange={(e) => setResDifficulty(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Duration / Read Time</label>
                <input
                  type="text"
                  value={resDuration}
                  onChange={(e) => setResDuration(e.target.value)}
                  placeholder="e.g. 15 mins"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                />
              </div>

              <div className="sm:col-span-3 flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="officialCheck"
                  checked={resIsOfficial}
                  onChange={(e) => setResIsOfficial(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 w-4 h-4"
                />
                <label htmlFor="officialCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Authoritative Official Specification (Node.js/WHATWG/IETF)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Resource</span>
            </button>
          </form>

          {/* Resources Table */}
          <div className="space-y-3">
            {resources.map((res) => {
              const catTopic = catalog.find((c) => c.id === res.topicId);

              return (
                <div
                  key={res.id}
                  className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-sm">{res.title}</span>
                      <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded capitalize">
                        {res.platform}
                      </span>
                      {res.isOfficialSource && (
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-semibold border border-cyan-800">
                          Official
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          res.availabilityStatus === 'available'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {res.availabilityStatus}
                      </span>
                    </div>

                    <div className="text-slate-400 flex items-center space-x-3 text-[11px]">
                      <span>Topic: {catTopic ? catTopic.title : res.topicId}</span>
                      <span>•</span>
                      <span>Verification: {res.verificationStatus.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() =>
                        resourceService.setResourceAvailability(
                          res.id,
                          res.availabilityStatus === 'available' ? 'unavailable' : 'available',
                          currentUser
                        )
                      }
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300"
                    >
                      {res.availabilityStatus === 'available' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => resourceService.setResourceAvailability(res.id, 'archived', currentUser)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                      title="Archive resource"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: REPORTED BROKEN LINKS & RESOLUTION */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-slate-800/60 p-8 rounded-xl border border-slate-700 text-center text-slate-400 text-xs">
              No reported broken links or discrepancies reported by students.
            </div>
          ) : (
            reports.map((issue) => (
              <div key={issue.id} className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded uppercase">
                      {issue.reason.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{issue.resourceTitle}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Reported by {issue.reportedBy} on {new Date(issue.reportedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-medium text-[10px] uppercase ${
                      issue.status === 'pending_review'
                        ? 'bg-amber-500/20 text-amber-400'
                        : issue.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {issue.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 border border-slate-800">
                  <span className="font-semibold text-cyan-400">Student Feedback: </span>
                  {issue.studentNotes}
                </div>

                {issue.adminResolutionNote && (
                  <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-300 border border-emerald-900/60">
                    <span className="font-semibold text-emerald-400">Resolution Note: </span>
                    {issue.adminResolutionNote} (by {issue.resolvedBy})
                  </div>
                )}

                {issue.status === 'pending_review' && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    {selectedIssueId === issue.id ? (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Administrator Resolution Note:
                        </label>
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="e.g. Verified canonical link replaced; video transcript confirmed live."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                        />

                        <label className="flex items-center space-x-2 text-slate-300 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={deactivateReportedRes}
                            onChange={(e) => setDeactivateReportedRes(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-amber-500"
                          />
                          <span>Deactivate resource immediately</span>
                        </label>

                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            onClick={() => setSelectedIssueId(null)}
                            className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResolveIssue(issue.id, 'dismissed')}
                            className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleResolveIssue(issue.id, 'resolved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                          >
                            Confirm Resolution
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedIssueId(issue.id);
                            setResolutionNote('');
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg"
                        >
                          Review & Resolve
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 7: SECURITY TEST SUITE */}
      {activeAdminTab === 'security_tests' && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>Administrative Authorization & Graph Constraint Suite</span>
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Executes real automated assertions covering: (1) 401 unauthenticated access rejection, (2) 403 student access rejection, (3) Last active admin demotion protection, (4) Self-dependency rejection, (5) DFS Circular chain detection (A➔B➔C➔A), (6) Topic deletion dependency guard, and (7) SSRF loopback protection.
            </p>
            <button
              disabled={isRunningTests}
              onClick={handleRunTests}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Executing 8 Test Cases...' : 'Execute Suite Now'}</span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span>
                  Result Summary: {testResults.passed} / {testResults.total} Assertions Passed
                </span>
                <span className={testResults.passed === testResults.total ? 'text-emerald-400' : 'text-amber-400'}>
                  {Math.round((testResults.passed / testResults.total) * 100)}% Pass Rate
                </span>
              </div>

              <div className="space-y-2">
                {testResults.results.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{res.title}</span>
                      {res.passed ? (
                        <span className="text-emerald-400 flex items-center font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Passed
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                      <span>Expected: <span className="text-slate-200">{res.expected}</span></span>
                      <span>•</span>
                      <span>Actual: <span className="text-slate-200">{res.actual}</span></span>
                    </div>

                    <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded">
                      {res.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
