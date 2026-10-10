import React, { useState, useEffect } from 'react';
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
import { geminiService } from './services/geminiService';
import { Navbar } from './components/Navbar';
import { RoadmapView } from './components/RoadmapView';
import { SyllabusUploader } from './components/SyllabusUploader';
import { ResourceList } from './components/ResourceList';
import { VerificationModal } from './components/VerificationModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AssessmentQuiz } from './components/AssessmentQuiz';
import { WeakTopicAnalysis } from './components/WeakTopicAnalysis';
import { AdminDashboard } from './components/AdminDashboard';
import { DocsViewer } from './components/DocsViewer';
import { Sparkles, Layers, BookOpen, ShieldCheck, Award, Activity } from 'lucide-react';

export default function App() {
  // State Initialization from storageService
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>(() => storageService.getRoadmap());
  const [catalog, setCatalog] = useState<CatalogTopic[]>(() => storageService.getCatalog());
  const [resources, setResources] = useState<LearningResource[]>(() => storageService.getResources());
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() => storageService.getAttempts());

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('roadmap');
  const [activeTopicId, setActiveTopicId] = useState<string>('topic_event_loop');

  // Modals & Drawers
  const [selectedVerificationResource, setSelectedVerificationResource] = useState<LearningResource | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
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

  // Assessment completed
  const handleAssessmentCompleted = (newAttempt: AssessmentAttempt) => {
    setAttempts(storageService.getAttempts());
    setRoadmap(storageService.getRoadmap());
  };

  // Trigger live Gemini verification of a resource against official docs
  const handleTriggerLiveVerification = async (res: LearningResource) => {
    setVerifyingResourceId(res.id);
    try {
      const topicObj = catalog.find((c) => c.id === res.topicId);
      const officialUrl = topicObj?.officialDocSources[0]?.url || 'https://nodejs.org/api/';
      const report = await geminiService.verifyResourceAgainstOfficialDocs(
        res.title,
        res.url,
        topicObj?.title || 'Node.js Backend Architecture',
        officialUrl
      );
      storageService.updateResourceVerification(res.id, report);
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
    if (rec.type === 'revise_subtopic' || rec.type === 'retry_assessment') {
      setActiveTab('assessment');
    } else {
      setActiveTab('resources');
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        userProfile={userProfile}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completedTopicsCount={completedCount}
        totalTopicsCount={roadmap.length}
        onOpenDocs={() => setIsDocsOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userProfile.role === 'student' ? (
          <>
            {activeTab === 'roadmap' && (
              <RoadmapView
                roadmap={roadmap}
                catalog={catalog}
                activeTopicId={activeTopicId}
                onSelectTopic={(tid) => {
                  setActiveTopicId(tid);
                  setActiveTab('resources');
                }}
                onOpenAssistant={(tid) => {
                  setActiveTopicId(tid);
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
                onSelectTopic={setActiveTopicId}
                onInspectVerification={(r) => setSelectedVerificationResource(r)}
                onTriggerLiveVerification={handleTriggerLiveVerification}
                isVerifyingId={verifyingResourceId}
              />
            )}

            {activeTab === 'assessment' && (
              <div className="space-y-10">
                <AssessmentQuiz
                  questions={storageService.getQuestions()}
                  catalog={catalog}
                  selectedTopicId={activeTopicId}
                  onAssessmentCompleted={handleAssessmentCompleted}
                  onNavigateToRoadmap={() => setActiveTab('roadmap')}
                />

                <WeakTopicAnalysis
                  attempts={attempts}
                  onSelectRecommendation={handleSelectRecommendation}
                />
              </div>
            )}
          </>
        ) : (
          /* Admin View */
          <AdminDashboard
            catalog={catalog}
            resources={resources}
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

      {/* Floating AI Doubt Assistant Button */}
      {userProfile.role === 'student' && !isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center space-x-2 font-semibold text-sm transition transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-5 h-5" />
          <span>Ask AI Doubt Solver</span>
        </button>
      )}

      {/* Contextual AI Assistant Drawer */}
      {isAssistantOpen && (
        <AiAssistantDrawer
          activeTopic={activeCatalogTopic}
          onClose={() => setIsAssistantOpen(false)}
        />
      )}

      {/* Official Documentation Verification Report Modal */}
      {selectedVerificationResource && (
        <VerificationModal
          resource={selectedVerificationResource}
          onClose={() => setSelectedVerificationResource(null)}
        />
      )}

      {/* Architecture Documentation Viewer Modal */}
      {isDocsOpen && <DocsViewer onClose={() => setIsDocsOpen(false)} />}
    </div>
  );
}
