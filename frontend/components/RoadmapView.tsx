import React, { useState, useMemo } from 'react';
import {
  RoadmapNode,
  CatalogTopic,
  TopicStatus,
  LearningResource,
  SavedRoadmap,
  UserProfile,
  CheckpointStudyMaterials
} from '../types';
import { resourceService } from '../services/resourceService';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Compass,
  Check,
  ChevronRight,
  ShieldCheck,
  Building,
  ExternalLink,
  Info,
  Filter,
  Search,
  RotateCcw,
  Tag,
  Plus,
  Layers,
  FolderGit2,
  Bookmark,
  Video,
  FileText,
  Star
} from 'lucide-react';

interface RoadmapViewProps {
  roadmap: RoadmapNode[];
  activeSavedRoadmap?: SavedRoadmap;
  savedRoadmaps?: SavedRoadmap[];
  catalog: CatalogTopic[];
  resources: LearningResource[];
  userProfile: UserProfile;
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onOpenAssistant: (topicId: string) => void;
  onOpenAssessment: (topicId: string) => void;
  onOpenSyllabus: () => void;
  onExploreResources: (topicId: string) => void;
  onOpenCreateRoadmap: () => void;
  onSwitchRoadmap?: (roadmapId: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  activeSavedRoadmap,
  savedRoadmaps = [],
  catalog,
  resources,
  userProfile,
  activeTopicId,
  onSelectTopic,
  onOpenAssistant,
  onOpenAssessment,
  onOpenSyllabus,
  onExploreResources,
  onOpenCreateRoadmap,
  onSwitchRoadmap
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'docs' | 'videos' | 'practice'>('all');
  const [bookmarkedRefresh, setBookmarkedRefresh] = useState(0);

  // Selected topic node
  const selectedNode = roadmap.find((n) => n.topicId === activeTopicId) || roadmap[0];
  const selectedCatalogItem = catalog.find((c) => c.id === selectedNode?.topicId);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return roadmap.filter((node) => {
      const matchStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'completed'
          ? node.status === 'completed'
          : filterStatus === 'in_progress'
          ? node.status === 'in_progress' || node.status === 'available'
          : filterStatus === 'locked'
          ? node.status === 'locked'
          : true;

      const matchSearch =
        searchQuery.trim().length === 0
          ? true
          : node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.unit.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [roadmap, filterStatus, searchQuery]);

  // Categorized study materials for selected checkpoint (Layer A, B, and C)
  const studyMaterials: CheckpointStudyMaterials = useMemo(() => {
    if (!selectedNode) {
      return {
        officialDocumentation: [],
        videoTutorials: [],
        articlesAndGuides: [],
        practice: [],
        furtherLearning: [],
        totalCount: 0
      };
    }
    return resourceService.findStudyMaterialsForCheckpoint(selectedNode, userProfile);
  }, [selectedNode, userProfile, resources, bookmarkedRefresh]);

  const handleToggleBookmark = (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    resourceService.toggleBookmark(resourceId);
    setBookmarkedRefresh((prev) => prev + 1);
  };

  // Completed metrics
  const completedCount = roadmap.filter((n) => n.status === 'completed').length;
  const progressPct = roadmap.length > 0 ? Math.round((completedCount / roadmap.length) * 100) : 0;

  // Prerequisite resolution
  const prereqObjects = useMemo(() => {
    if (!selectedCatalogItem) return [];
    return selectedCatalogItem.prerequisiteIds.map((pId) => {
      const cat = catalog.find((c) => c.id === pId);
      const node = roadmap.find((r) => r.topicId === pId);
      return {
        id: pId,
        title: cat?.title || pId,
        isCompleted: node?.status === 'completed'
      };
    });
  }, [selectedCatalogItem, catalog, roadmap]);

  const getNodeColor = (status: TopicStatus, isSelected: boolean) => {
    if (status === 'completed') {
      return isSelected
        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
        : 'border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-400';
    }
    if (status === 'in_progress') {
      return isSelected
        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
        : 'border-indigo-300 dark:border-indigo-800/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-indigo-500';
    }
    if (status === 'needs_revision') {
      return isSelected
        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
        : 'border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-rose-400';
    }
    if (status === 'available') {
      return isSelected
        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/30'
        : 'border-cyan-200 dark:border-cyan-800/80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-cyan-400';
    }
    // Locked
    return 'border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-60';
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
      case 'needs_revision':
        return <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'available':
        return <PlayCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />;
      case 'locked':
      default:
        return <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Roadmap Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Personalized Learning Roadmap</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeSavedRoadmap?.title || 'Interactive Learning Roadmap'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {activeSavedRoadmap?.description ||
                'Personalized curriculum with verified prerequisite sequencing. Click any topic to study curated resources.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 self-start md:self-auto">
            <button
              onClick={onOpenCreateRoadmap}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Roadmap</span>
            </button>

            <button
              onClick={onOpenSyllabus}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Ingest Syllabus</span>
            </button>
          </div>
        </div>

        {/* Multi-Roadmaps Switcher */}
        {savedRoadmaps.length > 1 && onSwitchRoadmap && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs py-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center flex-shrink-0">
              <FolderGit2 className="w-3 h-3 mr-1" />
              My Roadmaps:
            </span>
            {savedRoadmaps.map((r) => {
              const isActive = r.id === activeSavedRoadmap?.id;
              const rCompleted = r.nodes.filter((n) => n.status === 'completed').length;
              const rPct = r.nodes.length > 0 ? Math.round((rCompleted / r.nodes.length) * 100) : 0;

              return (
                <button
                  key={r.id}
                  onClick={() => onSwitchRoadmap(r.id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center space-x-1.5 flex-shrink-0 transition ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{r.title}</span>
                  <span className="font-mono text-[10px] opacity-75">{rPct}%</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-lg">
            {['all', 'in_progress', 'completed', 'locked'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded capitalize text-[11px] font-medium transition ${
                  filterStatus === st
                    ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Topics: <span className="font-semibold text-slate-800 dark:text-slate-200">{completedCount}</span> / {roadmap.length}
            </span>
            <span>•</span>
            <span>
              Mastery: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{progressPct}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Roadmap Canvas (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="relative pl-7 sm:pl-9 space-y-4 before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {filteredNodes.map((node, index) => {
                const isSelected = selectedNode?.topicId === node.topicId;
                const catItem = catalog.find((c) => c.id === node.topicId);

                return (
                  <div key={node.topicId} className="relative group">
                    {/* Spine Milestone Pin */}
                    <div
                      className={`absolute -left-7 sm:-left-9 top-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all bg-white dark:bg-slate-900 ${
                        node.status === 'completed'
                          ? 'border-emerald-500 text-emerald-500'
                          : node.status === 'in_progress'
                          ? 'border-indigo-600 text-indigo-600 ring-2 ring-indigo-500/20'
                          : node.status === 'needs_revision'
                          ? 'border-rose-500 text-rose-500'
                          : node.status === 'available'
                          ? 'border-cyan-500 text-cyan-500'
                          : 'border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {node.status === 'completed' ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Topic Node Card */}
                    <div
                      onClick={() => onSelectTopic(node.topicId)}
                      className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${getNodeColor(
                        node.status,
                        isSelected
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-0.5">
                            <span className="truncate">{node.unit}</span>
                            <span>•</span>
                            <span className="capitalize">{catItem?.difficulty || activeSavedRoadmap?.skillLevel || 'Core'}</span>
                            {node.estimatedHours && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-500">~{node.estimatedHours}h</span>
                              </>
                            )}
                            {typeof node.score === 'number' && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-indigo-600 dark:text-cyan-400 font-semibold">
                                  {node.score}% Score
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                            {node.title}
                          </h3>

                          {node.learningObjective && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {node.learningObjective}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {getStatusIcon(node.status)}
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Subtopic Branches */}
                      {node.keyCompetencies && node.keyCompetencies.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1">
                          {node.keyCompetencies.slice(0, 2).map((comp, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 truncate max-w-[200px]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Contextual Topic Details & Study Materials (lg:col-span-6) */}
        <div className="lg:col-span-6">
          {selectedNode ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Topic Header & Objective */}
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center">
                    <Compass className="w-3.5 h-3.5 mr-1" />
                    Checkpoint Learning Space
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      selectedNode.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : selectedNode.status === 'in_progress'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : selectedNode.status === 'needs_revision'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        : selectedNode.status === 'available'
                        ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {selectedNode.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {selectedNode.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {selectedNode.learningObjective || selectedCatalogItem?.summary || 'Master this checkpoint to advance your learning path.'}
                </p>
              </div>

              {/* Status & Next Step Action Guidance */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Next Action Guidance:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {selectedNode.status === 'locked'
                    ? 'Prerequisites pending. Review the required modules below or start with foundational checkpoints.'
                    : selectedNode.status === 'needs_revision'
                    ? 'Latest quiz score was <75%. Revisit the "Start Here" or "Official Documentation" materials below and retake diagnostic.'
                    : selectedNode.status === 'completed'
                    ? 'Checkpoint mastered. Revisit materials anytime for revision or proceed to the next module.'
                    : 'Ready to study! Open the recommended study materials below and test your understanding.'}
                </p>
              </div>

              {/* SECTION: STUDY MATERIALS (MANDATORY REQUIREMENT) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500 mr-1.5" />
                    Personalized Study Materials ({studyMaterials.totalCount})
                  </span>
                  {studyMaterials.totalCount > 0 && (
                    <button
                      onClick={() => onExploreResources(selectedNode.topicId)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      View in Catalog
                    </button>
                  )}
                </div>

                {/* Layer C: Honest Empty State if no materials found */}
                {studyMaterials.totalCount === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      No external catalog materials are currently mapped for "{selectedNode.title}".
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Our system does not fabricate artificial links. You can use the <strong>AI Tutor</strong> for live step-by-step code guidance, or explore official ecosystem documentation.
                    </p>
                    <button
                      onClick={() => onOpenAssistant(selectedNode.topicId)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Ask AI Tutor for this Topic</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 1. START HERE (Top Ranked Introduction) */}
                    {studyMaterials.startHere && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 to-slate-50 dark:from-indigo-950/30 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/60 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            <Star className="w-3 h-3 mr-1 fill-white" />
                            Start Here
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {studyMaterials.startHere.difficulty} · {studyMaterials.startHere.durationOrReadTime}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {studyMaterials.startHere.title}
                          </h4>
                          {studyMaterials.startHere.description && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {studyMaterials.startHere.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {studyMaterials.startHere.recommendationReasons?.[0] || 'Top recommended entry point'}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => handleToggleBookmark(studyMaterials.startHere!.id, e)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white"
                              title={studyMaterials.startHere.isBookmarked ? 'Bookmarked' : 'Save resource'}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  studyMaterials.startHere.isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''
                                }`}
                              />
                            </button>

                            <a
                              href={studyMaterials.startHere.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
                            >
                              <span>Open Resource</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category Tabs: All, Docs, Videos, Practice */}
                    <div className="flex items-center space-x-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 text-xs">
                      {[
                        { id: 'all', label: `All (${studyMaterials.totalCount})` },
                        { id: 'docs', label: `Docs (${studyMaterials.officialDocumentation.length})` },
                        { id: 'videos', label: `Videos (${studyMaterials.videoTutorials.length})` },
                        { id: 'practice', label: `Practice (${studyMaterials.practice.length})` }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCategoryTab(tab.id as any)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                            activeCategoryTab === tab.id
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Categorized Resource List */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {(activeCategoryTab === 'docs'
                        ? studyMaterials.officialDocumentation
                        : activeCategoryTab === 'videos'
                        ? studyMaterials.videoTutorials
                        : activeCategoryTab === 'practice'
                        ? studyMaterials.practice
                        : [
                            ...studyMaterials.officialDocumentation,
                            ...studyMaterials.videoTutorials,
                            ...studyMaterials.articlesAndGuides,
                            ...studyMaterials.practice
                          ].filter((r) => r.id !== studyMaterials.startHere?.id)
                      ).map((res) => (
                        <div
                          key={res.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between transition group"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {res.platform}
                              </span>
                              {res.isOfficialSource && (
                                <span className="bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300 px-1 rounded font-semibold text-[9px]">
                                  Official Spec
                                </span>
                              )}
                              <span>•</span>
                              <span>{res.durationOrReadTime}</span>
                            </div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-0.5">
                              {res.title}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => handleToggleBookmark(res.id, e)}
                              className="p-1 text-slate-400 hover:text-indigo-600"
                              title={res.isBookmarked ? 'Bookmarked' : 'Save'}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  res.isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''
                                }`}
                              />
                            </button>

                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-md transition"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prerequisites Chain */}
              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
                  Prerequisites Required:
                </span>
                {prereqObjects.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">None. Foundational entry point.</p>
                ) : (
                  <div className="space-y-1">
                    {prereqObjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectTopic(p.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 cursor-pointer transition"
                      >
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium truncate">
                          {p.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            p.isCompleted
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-400'
                          }`}
                        >
                          {p.isCompleted ? 'Passed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Cluster */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <button
                  onClick={() => onOpenAssessment(selectedNode.topicId)}
                  disabled={selectedNode.status === 'locked'}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>
                    {selectedNode.status === 'needs_revision'
                      ? 'Retry Diagnostic Quiz'
                      : 'Take Diagnostic Quiz'}
                  </span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenAssistant(selectedNode.topicId)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition border border-slate-200 dark:border-slate-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ask AI Tutor</span>
                  </button>

                  <button
                    onClick={() => onExploreResources(selectedNode.topicId)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition border border-slate-200 dark:border-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                    <span>All Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              Select any topic on the roadmap to inspect details and study materials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
