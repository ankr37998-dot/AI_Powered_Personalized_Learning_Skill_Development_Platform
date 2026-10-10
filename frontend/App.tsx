import React, { useState } from 'react';
import {
  UserProfile,
  UserRole,
  RoadmapNode,
  CatalogTopic,
  LearningResource,
  AssessmentAttempt,
  LearningRecommendation
} from './types';
import { storageService } from './services/storageService';
import { verificationService } from './services/verificationService';
import { apiClient } from './services/apiClient';
import { AppSidebar } from './components/AppSidebar';
import { Topbar } from './components/Topbar';
import { RoadmapView } from './components/RoadmapView';
import { SyllabusUploader } from './components/SyllabusUploader';
import { ResourceList } from './components/ResourceList';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { VerificationModal } from './components/VerificationModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AssessmentQuiz } from './components/AssessmentQuiz';
import { WeakTopicAnalysis } from './components/WeakTopicAnalysis';
import { ProgressHistoryView } from './components/ProgressHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { DocsViewer } from './components/DocsViewer';
import { TopicDetailsModal } from './components/TopicDetailsModal';
import { ReportResourceModal } from './components/ReportResourceModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { BackendStatusModal } from './components/BackendStatusModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  // State Initialization from storageService
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>(() => storageService.getRoadmap());
  const [catalog, setCatalog] = useState<CatalogTopic[]>(() => storageService.getCatalog());
  const [resources, setResources] = useState<LearningResource[]>(() => storageService.getResources());
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() => storageService.getAttempts());

  // Navigation & Shell state
  const [activeTab, setActiveTab] = useState<string>('roadmap');
  const [activeTopicId, setActiveTopicId] = useState<string>('topic_event_loop');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Modals & Drawers
  const [selectedVerificationResource, setSelectedVerificationResource] = useState<LearningResource | null>(null);
  const [selectedResourceDetail, setSelectedResourceDetail] = useState<LearningResource | null>(null);
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<CatalogTopic | null>(null);
  const [assistantActiveResource, setAssistantActiveResource] = useState<LearningResource | null>(null);
  const [reportingResource, setReportingResource] = useState<LearningResource | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBackendStatusOpen, setIsBackendStatusOpen] = useState(false);
  const [verifyingResourceId, setVerifyingResourceId] = useState<string | null>(null);

  // Sync role switch
  const handleRoleChange = (newRole: UserRole) => {
    const updated = { ...userProfile, role: newRole };
    setUserProfile(updated);
    storageService.setUserProfile(updated);
    if (newRole === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('roadmap');
    }
  };

  // Syllabus completed -> update roadmap
  const handleRoadmapGenerated = (newNodes: RoadmapNode[]) => {
    setRoadmap(newNodes);
    storageService.setRoadmap(newNodes);
    if (newNodes.length > 0) {
      setActiveTopicId(newNodes[0].topicId);
    }
    setActiveTab('roadmap');
  };

  // Assessment completed -> sync with backend
  const handleAssessmentCompleted = async (newAttempt: AssessmentAttempt) => {
    setAttempts(storageService.getAttempts());
    setRoadmap(storageService.getRoadmap());
    apiClient.submitAssessment(newAttempt);
  };

  // Trigger live Vertex AI documentation-based verification
  const handleTriggerLiveVerification = async (res: LearningResource) => {
    setVerifyingResourceId(res.id);
    try {
      const report = await verificationService.runVerification(res);
      setResources(storageService.getResources());
      setSelectedVerificationResource({
        ...res,
        verificationStatus: report.status,
        verificationReport: report
      });
    } finally {
      setVerifyingResourceId(null);
    }
  };

  // Handle explainable recommendation action
  const handleSelectRecommendation = (rec: LearningRecommendation) => {
    setActiveTopicId(rec.topicId);
    if (rec.type === 'retry_assessment' || rec.type === 'more_practice_recommended') {
      setActiveTab('assessment');
    } else if (rec.type === 'revise_subtopic') {
      setActiveTab('resources');
    } else {
      setActiveTab('roadmap');
    }
  };

  const handleResetData = () => {
    if (confirm('Reset workspace data to initial pre-verified state?')) {
      storageService.resetAllData();
      setUserProfile(storageService.getUserProfile());
      setRoadmap(storageService.getRoadmap());
      setCatalog(storageService.getCatalog());
      setResources(storageService.getResources());
      setAttempts(storageService.getAttempts());
      setActiveTopicId('topic_event_loop');
    }
  };

  const completedCount = roadmap.filter((n) => n.status === 'completed').length;
  const activeCatalogTopic = catalog.find((c) => c.id === activeTopicId) || catalog[0] || null;
  const activeRoadmapNode = roadmap.find((n) => n.topicId === activeTopicId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row">
      {/* 1. Modern Collapsible Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userProfile={userProfile}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsedDesktop={isDesktopSidebarCollapsed}
        onToggleCollapseDesktop={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenBackendStatus={() => setIsBackendStatusOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* 2. Main Content Viewport Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isDesktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Compact Topbar */}
        <Topbar
          activeTab={activeTab}
          userProfile={userProfile}
          onRoleChange={handleRoleChange}
          completedTopicsCount={completedCount}
          totalTopicsCount={roadmap.length}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onResetData={handleResetData}
          onOpenAssistant={() => {
            setAssistantActiveResource(null);
            setIsAssistantOpen(true);
          }}
        />

        {/* Core Page Content with respectful bottom padding (pb-28) to eliminate AI button overlap */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          {userProfile.role === 'student' ? (
            <>
              {activeTab === 'roadmap' && (
                <RoadmapView
                  roadmap={roadmap}
                  catalog={catalog}
                  activeTopicId={activeTopicId}
                  onSelectTopic={(tid) => {
                    setActiveTopicId(tid);
                    const found = catalog.find((c) => c.id === tid);
                    if (found) setSelectedTopicDetail(found);
                  }}
                  onOpenAssistant={(tid) => {
                    setActiveTopicId(tid);
                    setAssistantActiveResource(null);
                    setIsAssistantOpen(true);
                  }}
                  onOpenAssessment={(tid) => {
                    setActiveTopicId(tid);
                    setActiveTab('assessment');
                  }}
                  onOpenSyllabus={() => setActiveTab('syllabus')}
                />
              )}

              {activeTab === 'syllabus' && (
                <SyllabusUploader
                  onRoadmapGenerated={handleRoadmapGenerated}
                  onCancel={() => setActiveTab('roadmap')}
                />
              )}

              {activeTab === 'resources' && (
                <ResourceList
                  resources={resources}
                  catalog={catalog}
                  selectedTopicId={activeTopicId}
                  userProfile={userProfile}
                  onSelectTopic={setActiveTopicId}
                  onInspectVerification={(r) => setSelectedVerificationResource(r)}
                  onTriggerLiveVerification={handleTriggerLiveVerification}
                  onReportResource={(r) => setReportingResource(r)}
                  onViewResourceDetails={(r) => setSelectedResourceDetail(r)}
                  isVerifyingId={verifyingResourceId}
                />
              )}

              {activeTab === 'assessment' && (
                <div className="space-y-8">
                  {/* Clean Weak-Topic Analysis Diagnostic (Prioritized at top per screenshot redesign) */}
                  <WeakTopicAnalysis
                    attempts={attempts}
                    roadmap={roadmap}
                    catalog={catalog}
                    onSelectRecommendation={handleSelectRecommendation}
                    onOpenAssistant={(tid) => {
                      setActiveTopicId(tid);
                      setAssistantActiveResource(null);
                      setIsAssistantOpen(true);
                    }}
                  />

                  {/* Diagnostic Quiz Module */}
                  <AssessmentQuiz
                    questions={storageService.getQuestions()}
                    catalog={catalog}
                    resources={resources}
                    selectedTopicId={activeTopicId}
                    userProfile={userProfile}
                    onAssessmentCompleted={handleAssessmentCompleted}
                    onNavigateToRoadmap={() => setActiveTab('roadmap')}
                    onOpenAssistant={(tid) => {
                      setActiveTopicId(tid);
                      setAssistantActiveResource(null);
                      setIsAssistantOpen(true);
                    }}
                  />
                </div>
              )}

              {activeTab === 'progress' && (
                <ProgressHistoryView
                  roadmap={roadmap}
                  attempts={attempts}
                  userProfile={userProfile}
                  onNavigateToAssessment={() => setActiveTab('assessment')}
                  onNavigateToRoadmap={() => setActiveTab('roadmap')}
                />
              )}
            </>
          ) : (
            /* Admin Console View */
            <AdminDashboard
              catalog={catalog}
              resources={resources}
              currentUser={userProfile}
              onUpdateCatalog={(newCat) => {
                setCatalog(newCat);
                storageService.setCatalog(newCat);
              }}
              onUpdateResources={(newRes) => {
                setResources(newRes);
                storageService.setResources(newRes);
              }}
            />
          )}
        </main>
      </div>

      {/* Floating AI Doubt Assistant Button (Discreet, compact, non-intrusive) */}
      {userProfile.role === 'student' && !isAssistantOpen && (
        <div className="fixed bottom-5 right-5 z-20">
          <button
            onClick={() => {
              setAssistantActiveResource(null);
              setIsAssistantOpen(true);
            }}
            className="group flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-indigo-900/40 font-semibold text-xs transition transform hover:-translate-y-0.5 border border-indigo-400/30"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Ask AI Doubt</span>
          </button>
        </div>
      )}

      {/* Contextual Real-Time AI Assistant Drawer */}
      {isAssistantOpen && (
        <AiAssistantDrawer
          activeTopic={activeCatalogTopic}
          activeResource={assistantActiveResource}
          learningGoal={userProfile.targetGoal}
          onClose={() => {
            setIsAssistantOpen(false);
            setAssistantActiveResource(null);
          }}
          onNavigateToTopic={(tid) => {
            setActiveTopicId(tid);
            setIsAssistantOpen(false);
          }}
        />
      )}

      {/* Official Documentation Verification Report Modal */}
      {selectedVerificationResource && (
        <VerificationModal
          resource={selectedVerificationResource}
          onClose={() => setSelectedVerificationResource(null)}
          onVerificationUpdated={(updated) => {
            setResources(storageService.getResources());
            setSelectedVerificationResource((prev) =>
              prev ? { ...prev, verificationStatus: updated.status, verificationReport: updated } : null
            );
          }}
        />
      )}

      {/* Resource Detail Modal */}
      {selectedResourceDetail && (
        <ResourceDetailModal
          resource={selectedResourceDetail}
          catalog={catalog}
          onClose={() => setSelectedResourceDetail(null)}
          onOpenVerificationReport={(res) => {
            setSelectedResourceDetail(null);
            setSelectedVerificationResource(res);
          }}
          onReportIssue={(res) => {
            setSelectedResourceDetail(null);
            setReportingResource(res);
          }}
          onAskAiAboutResource={(res) => {
            setSelectedResourceDetail(null);
            setAssistantActiveResource(res);
            setIsAssistantOpen(true);
          }}
        />
      )}

      {/* Topic Details & Prerequisite Tree Modal */}
      {selectedTopicDetail && (
        <TopicDetailsModal
          topic={selectedTopicDetail}
          roadmapNode={activeRoadmapNode}
          catalog={catalog}
          resources={resources}
          userProfile={userProfile}
          onClose={() => setSelectedTopicDetail(null)}
          onOpenAssistant={(tid) => {
            setActiveTopicId(tid);
            setAssistantActiveResource(null);
            setIsAssistantOpen(true);
          }}
          onOpenAssessment={(tid) => {
            setActiveTopicId(tid);
            setActiveTab('assessment');
          }}
          onExploreResources={(tid) => {
            setActiveTopicId(tid);
            setActiveTab('resources');
          }}
        />
      )}

      {/* Report Broken Resource Modal */}
      {reportingResource && (
        <ReportResourceModal
          resource={reportingResource}
          studentName={userProfile.name}
          onClose={() => setReportingResource(null)}
          onReportSubmitted={() => setResources(storageService.getResources())}
        />
      )}

      {/* Student Profile Modal */}
      {isProfileOpen && (
        <StudentProfileModal
          profile={userProfile}
          onSaveProfile={(updated) => {
            setUserProfile(updated);
            storageService.setUserProfile(updated);
          }}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* Backend & Database Connection Diagnostic Modal */}
      {isBackendStatusOpen && <BackendStatusModal onClose={() => setIsBackendStatusOpen(false)} />}

      {/* Architecture Documentation Viewer Modal */}
      {isDocsOpen && <DocsViewer onClose={() => setIsDocsOpen(false)} />}
    </div>
  );
}
