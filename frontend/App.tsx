import React, { useState, useEffect } from "react";
import {
  UserProfile,
  RoadmapNode,
  CatalogTopic,
  LearningResource,
  AssessmentAttempt,
  LearningRecommendation,
  SavedRoadmap,
} from "./types";
import { storageService } from "./services/storageService";
import { authService } from "./services/authService";
import { verificationService } from "./services/verificationService";
import { apiClient } from "./services/apiClient";
import { themeService, ThemeMode } from "./services/themeService";
import { AuthPage } from "./components/AuthPage";
import { AppSidebar } from "./components/AppSidebar";
import { Topbar } from "./components/Topbar";
import { RoadmapView } from "./components/RoadmapView";
// Fix: Removed import of non-existent './components/RoadmapDirectoryModal' and inlined component below
import { SyllabusUploader } from "./components/SyllabusUploader";
import { CreateRoadmapModal } from "./components/CreateRoadmapModal";
import { ResourceList } from "./components/ResourceList";
import { ResourceDetailModal } from "./components/ResourceDetailModal";
import { VerificationModal } from "./components/VerificationModal";
import { AiAssistantDrawer } from "./components/AiAssistantDrawer";
import { AssessmentQuiz } from "./components/AssessmentQuiz";
import { WeakTopicAnalysis } from "./components/WeakTopicAnalysis";
import { ProgressHistoryView } from "./components/ProgressHistoryView";
import { DocsViewer } from "./components/DocsViewer";
import { TopicDetailsModal } from "./components/TopicDetailsModal";
import { ReportResourceModal } from "./components/ReportResourceModal";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { BackendStatusModal } from "./components/BackendStatusModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { Sparkles, Compass, X, Plus, ArrowRight, Trash2 } from "lucide-react";

// Fix: Inlined RoadmapDirectoryModal component to eliminate module specifier resolution failure
interface RoadmapDirectoryModalProps {
  savedRoadmaps: SavedRoadmap[];
  activeRoadmapId: string;
  onSelectRoadmap: (roadmapId: string) => void;
  onCreateNew: () => void;
  onDeleteRoadmap: (roadmapId: string) => void;
  onClose: () => void;
}

const RoadmapDirectoryModal: React.FC<RoadmapDirectoryModalProps> = ({
  savedRoadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onCreateNew,
  onDeleteRoadmap,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5 my-auto transition-colors">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Developer Roadmaps Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch between your active learning tracks or generate a new
                AI-powered developer roadmap.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-cyan-50/40 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/60">
          <div>
            <span className="font-semibold text-xs text-slate-900 dark:text-white block">
              Want to master a different technical competency?
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Generate a custom roadmap for Android, React, Java, DSA, SQL, ML,
              or your university syllabus.
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition flex-shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Roadmap</span>
          </button>
        </div>

        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Your Active & Saved Roadmaps ({savedRoadmaps.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedRoadmaps.map((r) => {
              const isActive = r.id === activeRoadmapId;
              const completedCount = r.nodes.filter(
                (n) => n.status === "completed",
              ).length;
              const pct =
                r.nodes.length > 0
                  ? Math.round((completedCount / r.nodes.length) * 100)
                  : 0;

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    onSelectRoadmap(r.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    isActive
                      ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {r.category || "Skill Path"}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          Active Track
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {completedCount} of {r.nodes.length} Topics
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        ~{r.totalEstimatedHours || r.nodes.length * 4}h
                        estimated
                      </span>

                      <div className="flex items-center space-x-2">
                        {savedRoadmaps.length > 1 && !isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${r.title}" roadmap?`)) {
                                onDeleteRoadmap(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Delete roadmap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-0.5">
                          <span>{isActive ? "Continue" : "Switch"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() =>
    themeService.getInitialTheme(),
  );

  useEffect(() => {
    themeService.applyTheme(currentTheme);
  }, [currentTheme]);

  const handleToggleTheme = () => {
    setCurrentTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Authentication & Session Guard State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const session = authService.getCurrentSession();
    return session?.user || null;
  });

  useEffect(() => {
    if (!currentUser) return;
    let isCurrent = true;
    authService.validateSession().then((user) => {
      if (!isCurrent) return;
      if (!user) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(user);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let isCurrent = true;
    const hydrateStudentState = async () => {
      try {
        const remote = await apiClient.getStudentState();
        if (!isCurrent) return;
        if (remote.hasStudentState) {
          storageService.applyRemoteSnapshot(remote.state || {});
        } else {
          storageService.resetAllData();
          if (remote.state) storageService.applyRemoteSnapshot(remote.state);
          storageService.setUserProfile(currentUser);
          await apiClient.saveStudentState(storageService.getRemoteSnapshot());
        }
        if (!isCurrent) return;
        setSavedRoadmaps(storageService.getSavedRoadmaps());
        setActiveRoadmap(storageService.getActiveRoadmap());
        setCatalog(storageService.getCatalog());
        setResources(storageService.getResources());
        setAttempts(storageService.getAttempts());
      } catch (error) {
        console.error("Could not sync student data with backend:", error);
      }
    };
    void hydrateStudentState();
    return () => {
      isCurrent = false;
    };
  }, [currentUser?.id]);

  // Workspace Data States
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>(() =>
    storageService.getSavedRoadmaps(),
  );
  const [activeRoadmap, setActiveRoadmap] = useState<SavedRoadmap>(() =>
    storageService.getActiveRoadmap(),
  );
  const [catalog, setCatalog] = useState<CatalogTopic[]>(() =>
    storageService.getCatalog(),
  );
  const [resources, setResources] = useState<LearningResource[]>(() =>
    storageService.getResources(),
  );
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() =>
    storageService.getAttempts(),
  );

  // Navigation state (Student Only)
  const [activeTab, setActiveTab] = useState<string>(() =>
    currentUser?.role === "admin" ? "admin" : "roadmap",
  );
  const [activeTopicId, setActiveTopicId] = useState<string>(() => {
    const active = storageService.getActiveRoadmap();
    return active.nodes[0]?.topicId || "topic_event_loop";
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  // Modals & Drawers
  const [isCreateRoadmapOpen, setIsCreateRoadmapOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [selectedVerificationResource, setSelectedVerificationResource] =
    useState<LearningResource | null>(null);
  const [selectedResourceDetail, setSelectedResourceDetail] =
    useState<LearningResource | null>(null);
  const [selectedTopicDetail, setSelectedTopicDetail] =
    useState<CatalogTopic | null>(null);
  const [assistantActiveResource, setAssistantActiveResource] =
    useState<LearningResource | null>(null);
  const [reportingResource, setReportingResource] =
    useState<LearningResource | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBackendStatusOpen, setIsBackendStatusOpen] = useState(false);
  const [verifyingResourceId, setVerifyingResourceId] = useState<string | null>(
    null,
  );

  // Authentication Handlers
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveTab(user.role === "admin" ? "admin" : "roadmap");
    storageService.setUserProfile(user);
    const roadmaps = storageService.getSavedRoadmaps();
    setSavedRoadmaps(roadmaps);
    const active = storageService.getActiveRoadmap();
    setActiveRoadmap(active);
    if (active.nodes.length > 0) {
      setActiveTopicId(active.nodes[0].topicId);
    }
  };

  const handleLogout = () => {
    void authService.logout();
    setCurrentUser(null);
  };

  // Switch Active Roadmap
  const handleSwitchRoadmap = (roadmapId: string) => {
    storageService.setActiveRoadmapId(roadmapId);
    const newActive = storageService.getActiveRoadmap();
    setActiveRoadmap(newActive);
    if (newActive.nodes.length > 0) {
      setActiveTopicId(newActive.nodes[0].topicId);
    }
    if (currentUser) {
      const updatedProfile = { ...currentUser, targetGoal: newActive.title };
      setCurrentUser(updatedProfile);
      storageService.setUserProfile(updatedProfile);
    }
  };

  // Delete Roadmap from directory
  const handleDeleteRoadmap = (roadmapId: string) => {
    storageService.deleteRoadmap(roadmapId);
    setSavedRoadmaps(storageService.getSavedRoadmaps());
    setActiveRoadmap(storageService.getActiveRoadmap());
  };

  // New AI Roadmap Confirmed
  const handleRoadmapConfirmed = (newRoadmap: SavedRoadmap) => {
    storageService.saveRoadmap(newRoadmap);
    const all = storageService.getSavedRoadmaps();
    setSavedRoadmaps(all);
    setActiveRoadmap(newRoadmap);
    setCatalog(storageService.getCatalog());
    if (newRoadmap.nodes.length > 0) {
      setActiveTopicId(newRoadmap.nodes[0].topicId);
    }
    if (currentUser) {
      const updated = { ...currentUser, targetGoal: newRoadmap.title };
      setCurrentUser(updated);
      storageService.setUserProfile(updated);
    }
    setActiveTab("roadmap");
  };

  // Syllabus completed -> update roadmap
  const handleRoadmapGenerated = (newNodes: RoadmapNode[]) => {
    storageService.setRoadmap(newNodes);
    const updatedActive = storageService.getActiveRoadmap();
    setActiveRoadmap(updatedActive);
    setSavedRoadmaps(storageService.getSavedRoadmaps());
    if (newNodes.length > 0) {
      setActiveTopicId(newNodes[0].topicId);
    }
    setActiveTab("roadmap");
  };

  // Assessment completed -> sync with backend
  const handleAssessmentCompleted = async (
    newAttempt: AssessmentAttempt,
  ): Promise<AssessmentAttempt> => {
    const response = await apiClient.submitAssessment(newAttempt);
    if (!response.success || !response.data) {
      throw new Error(
        response.error || "Assessment could not be saved to the server.",
      );
    }
    const authoritativeAttempt = response.data as AssessmentAttempt;
    storageService.saveAttempt(authoritativeAttempt);
    setAttempts(storageService.getAttempts());
    const updatedActive = storageService.getActiveRoadmap();
    setActiveRoadmap(updatedActive);
    setSavedRoadmaps(storageService.getSavedRoadmaps());
    return authoritativeAttempt;
  };

  // Verify resource content through the configured NVIDIA provider
  const handleTriggerLiveVerification = async (res: LearningResource) => {
    setVerifyingResourceId(res.id);
    try {
      const report = await verificationService.runVerification(res);
      setResources(storageService.getResources());
      setSelectedVerificationResource({
        ...res,
        verificationStatus: report.status,
        verificationReport: report,
      });
    } finally {
      setVerifyingResourceId(null);
    }
  };

  // Handle explainable recommendation action
  const handleSelectRecommendation = (rec: LearningRecommendation) => {
    setActiveTopicId(rec.topicId);
    if (
      rec.type === "retry_assessment" ||
      rec.type === "more_practice_recommended"
    ) {
      setActiveTab("assessment");
    } else if (rec.type === "revise_subtopic") {
      setActiveTab("resources");
    } else {
      setActiveTab("roadmap");
    }
  };

  const handleResetData = () => {
    if (confirm("Reset workspace data to initial pre-verified state?")) {
      storageService.resetAllData();
      if (currentUser) {
        storageService.setUserProfile(currentUser);
      }
      setSavedRoadmaps(storageService.getSavedRoadmaps());
      const active = storageService.getActiveRoadmap();
      setActiveRoadmap(active);
      setCatalog(storageService.getCatalog());
      setResources(storageService.getResources());
      setAttempts(storageService.getAttempts());
      setActiveTopicId(active.nodes[0]?.topicId || "topic_event_loop");
    }
  };

  // -------------------------------------------------------------
  // GUARD: If Unauthenticated, Render Login / Registration Page
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  const currentNodes = activeRoadmap.nodes || [];
  const completedCount = currentNodes.filter(
    (n) => n.status === "completed",
  ).length;
  const activeCatalogTopic =
    catalog.find((c) => c.id === activeTopicId) || catalog[0] || null;
  const activeRoadmapNode = currentNodes.find(
    (n) => n.topicId === activeTopicId,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100 flex flex-row transition-colors duration-150">
      {/* 1. Student Collapsible Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userProfile={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsedDesktop={isDesktopSidebarCollapsed}
        onToggleCollapseDesktop={() =>
          setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)
        }
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenBackendStatus={() => setIsBackendStatusOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          isDesktopSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Compact Topbar with Logout Action */}
        <Topbar
          activeTab={activeTab}
          userProfile={currentUser}
          currentTheme={currentTheme}
          onToggleTheme={handleToggleTheme}
          completedTopicsCount={completedCount}
          totalTopicsCount={currentNodes.length}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onResetData={handleResetData}
          onOpenAssistant={() => {
            setAssistantActiveResource(null);
            setIsAssistantOpen(true);
          }}
          onLogout={handleLogout}
        />

        {/* Core Workspace Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 pb-28">
          {activeTab === "roadmap" && (
            <RoadmapView
              roadmap={currentNodes}
              activeSavedRoadmap={activeRoadmap}
              savedRoadmaps={savedRoadmaps}
              catalog={catalog}
              resources={resources}
              userProfile={currentUser}
              activeTopicId={activeTopicId}
              onSelectTopic={(tid) => {
                setActiveTopicId(tid);
              }}
              onOpenAssistant={(tid) => {
                setActiveTopicId(tid);
                setAssistantActiveResource(null);
                setIsAssistantOpen(true);
              }}
              onOpenAssessment={(tid) => {
                setActiveTopicId(tid);
                setActiveTab("assessment");
              }}
              onOpenSyllabus={() => setActiveTab("syllabus")}
              onExploreResources={(tid) => {
                setActiveTopicId(tid);
                setActiveTab("resources");
              }}
              onOpenCreateRoadmap={() => setIsCreateRoadmapOpen(true)}
              onSwitchRoadmap={handleSwitchRoadmap}
              onOpenDirectory={() => setIsDirectoryOpen(true)}
            />
          )}

          {activeTab === "syllabus" && (
            <SyllabusUploader
              onRoadmapGenerated={handleRoadmapGenerated}
              onCancel={() => setActiveTab("roadmap")}
            />
          )}

          {activeTab === "resources" && (
            <ResourceList
              resources={resources}
              catalog={catalog}
              selectedTopicId={activeTopicId}
              userProfile={currentUser}
              onSelectTopic={setActiveTopicId}
              onInspectVerification={(r) => setSelectedVerificationResource(r)}
              onTriggerLiveVerification={handleTriggerLiveVerification}
              onReportResource={(r) => setReportingResource(r)}
              onViewResourceDetails={(r) => setSelectedResourceDetail(r)}
              isVerifyingId={verifyingResourceId}
            />
          )}

          {activeTab === "assessment" && (
            <div className="space-y-6">
              <WeakTopicAnalysis
                attempts={attempts}
                roadmap={currentNodes}
                catalog={catalog}
                onSelectRecommendation={handleSelectRecommendation}
                onOpenAssistant={(tid) => {
                  setActiveTopicId(tid);
                  setAssistantActiveResource(null);
                  setIsAssistantOpen(true);
                }}
              />

              <AssessmentQuiz
                questions={storageService.getQuestions()}
                catalog={catalog}
                resources={resources}
                selectedTopicId={activeTopicId}
                userProfile={currentUser}
                onAssessmentCompleted={handleAssessmentCompleted}
                onNavigateToRoadmap={() => setActiveTab("roadmap")}
                onOpenAssistant={(tid) => {
                  setActiveTopicId(tid);
                  setAssistantActiveResource(null);
                  setIsAssistantOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === "progress" && (
            <ProgressHistoryView
              roadmap={currentNodes}
              attempts={attempts}
              userProfile={currentUser}
              onNavigateToAssessment={() => setActiveTab("assessment")}
              onNavigateToRoadmap={() => setActiveTab("roadmap")}
            />
          )}

          {activeTab === "admin" && currentUser.role === "admin" && (
            <AdminDashboard
              catalog={catalog}
              resources={resources}
              currentUser={currentUser}
              onUpdateCatalog={(nextCatalog) => {
                storageService.setCatalog(nextCatalog);
                setCatalog(nextCatalog);
              }}
              onUpdateResources={(nextResources) => {
                storageService.setResources(nextResources);
                setResources(nextResources);
              }}
            />
          )}
        </main>
      </div>

      {/* Floating AI Doubt Assistant Button */}
      {!isAssistantOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-20">
          <button
            onClick={() => {
              setAssistantActiveResource(null);
              setIsAssistantOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 sm:px-3.5 sm:py-2 rounded-full shadow-lg shadow-indigo-600/30 font-semibold text-xs transition transform hover:-translate-y-0.5 border border-indigo-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden sm:inline">Ask AI Tutor</span>
          </button>
        </div>
      )}

      {/* Create Personalized Roadmap Modal */}
      {isCreateRoadmapOpen && (
        <CreateRoadmapModal
          onClose={() => setIsCreateRoadmapOpen(false)}
          onRoadmapConfirmed={handleRoadmapConfirmed}
        />
      )}

      {/* Roadmaps Directory Modal */}
      {isDirectoryOpen && (
        <RoadmapDirectoryModal
          savedRoadmaps={savedRoadmaps}
          activeRoadmapId={activeRoadmap.id}
          onSelectRoadmap={handleSwitchRoadmap}
          onCreateNew={() => setIsCreateRoadmapOpen(true)}
          onDeleteRoadmap={handleDeleteRoadmap}
          onClose={() => setIsDirectoryOpen(false)}
        />
      )}

      {/* Contextual Real-Time AI Assistant Drawer */}
      {isAssistantOpen && (
        <AiAssistantDrawer
          activeTopic={activeCatalogTopic}
          activeResource={assistantActiveResource}
          learningGoal={currentUser.targetGoal}
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
              prev
                ? {
                    ...prev,
                    verificationStatus: updated.status,
                    verificationReport: updated,
                  }
                : null,
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
          userProfile={currentUser}
          onClose={() => setSelectedTopicDetail(null)}
          onOpenAssistant={(tid) => {
            setActiveTopicId(tid);
            setAssistantActiveResource(null);
            setIsAssistantOpen(true);
          }}
          onOpenAssessment={(tid) => {
            setActiveTopicId(tid);
            setActiveTab("assessment");
          }}
          onExploreResources={(tid) => {
            setActiveTopicId(tid);
            setActiveTab("resources");
          }}
        />
      )}

      {/* Report Broken Resource Modal */}
      {reportingResource && (
        <ReportResourceModal
          resource={reportingResource}
          studentName={currentUser.name}
          onClose={() => setReportingResource(null)}
          onReportSubmitted={async (report) => {
            const savedReport = await apiClient.submitResourceReport(report);
            storageService.addReportedIssue(savedReport);
            setResources(storageService.getResources());
          }}
        />
      )}

      {/* Student Profile Modal */}
      {isProfileOpen && (
        <StudentProfileModal
          profile={currentUser}
          onSaveProfile={(updated) => {
            setCurrentUser(updated);
            storageService.setUserProfile(updated);
            void apiClient
              .updateProfile(updated)
              .then((profile) => {
                setCurrentUser(profile);
                storageService.setUserProfile(profile);
                const session = authService.getCurrentSession();
                if (session)
                  authService.saveSession({ ...session, user: profile });
              })
              .catch((error) => {
                console.error("Profile update failed:", error);
              });
          }}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* Backend & Database Connection Diagnostic Modal */}
      {isBackendStatusOpen && (
        <BackendStatusModal onClose={() => setIsBackendStatusOpen(false)} />
      )}

      {/* Architecture Documentation Viewer Modal */}
      {isDocsOpen && <DocsViewer onClose={() => setIsDocsOpen(false)} />}
    </div>
  );
}
