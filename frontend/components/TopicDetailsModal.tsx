import React, { useMemo } from 'react';
import { CatalogTopic, RoadmapNode, LearningResource, UserProfile, CheckpointStudyMaterials } from '../types';
import { resourceService } from '../services/resourceService';
import {
  X,
  BookOpen,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Video,
  FileText,
  Star,
  Bookmark
} from 'lucide-react';

interface TopicDetailsModalProps {
  topic: CatalogTopic | null;
  roadmapNode?: RoadmapNode;
  catalog: CatalogTopic[];
  resources: LearningResource[];
  userProfile: UserProfile;
  onClose: () => void;
  onOpenAssistant: (topicId: string) => void;
  onOpenAssessment: (topicId: string) => void;
  onExploreResources: (topicId: string) => void;
}

export const TopicDetailsModal: React.FC<TopicDetailsModalProps> = ({
  topic,
  roadmapNode,
  catalog,
  resources,
  userProfile,
  onClose,
  onOpenAssistant,
  onOpenAssessment,
  onExploreResources
}) => {
  if (!topic) return null;

  const prereqTopics = topic.prerequisiteIds.map(
    (pid) => catalog.find((c) => c.id === pid) || { id: pid, title: pid }
  );

  // Compute categorized study materials for this topic
  const studyMaterials: CheckpointStudyMaterials = useMemo(() => {
    const mockNode: RoadmapNode = roadmapNode || {
      topicId: topic.id,
      title: topic.title,
      unit: topic.category,
      status: 'available',
      order: 1,
      prerequisitesMet: true,
      learningObjective: topic.summary,
      keyCompetencies: topic.keyCompetencies
    };
    return resourceService.findStudyMaterialsForCheckpoint(mockNode, userProfile);
  }, [topic, roadmapNode, userProfile, resources]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3.5">
          <div className="min-w-0 pr-2">
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span>Checkpoint Learning Space</span>
              <span>•</span>
              <span className="capitalize text-slate-500 dark:text-slate-400">{topic.difficulty} Level</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {topic.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{topic.summary}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Student Mastery Status */}
        {roadmapNode && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Roadmap Progress:</span>
              <span className="ml-2 font-bold text-slate-900 dark:text-white uppercase">
                {roadmapNode.status.replace(/_/g, ' ')}
              </span>
            </div>
            {typeof roadmapNode.score === 'number' && (
              <span className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-indigo-600 dark:text-cyan-300 font-mono font-medium border border-slate-200 dark:border-slate-700">
                Latest Quiz: {roadmapNode.score}%
              </span>
            )}
          </div>
        )}

        {/* SECTION: STUDY MATERIALS FOR THIS CHECKPOINT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Recommended Study Materials ({studyMaterials.totalCount})</span>
            </h3>
            <button
              onClick={() => {
                onClose();
                onExploreResources(topic.id);
              }}
              className="text-[11px] text-indigo-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              Browse in Catalog
            </button>
          </div>

          {studyMaterials.totalCount === 0 ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-1">
              <p>No external catalog materials currently mapped for this topic.</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium text-[11px]">
                Tip: Click "Ask AI Tutor" below to ask questions or review code implementations in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Start Here Card */}
              {studyMaterials.startHere && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      Start Here
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {studyMaterials.startHere.difficulty} · {studyMaterials.startHere.durationOrReadTime}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    {studyMaterials.startHere.title}
                  </h4>
                  {studyMaterials.startHere.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {studyMaterials.startHere.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      {studyMaterials.startHere.recommendationReasons?.[0] || 'Recommended starting resource'}
                    </span>
                    <a
                      href={studyMaterials.startHere.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Supporting Resources List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[
                  ...studyMaterials.officialDocumentation,
                  ...studyMaterials.videoTutorials,
                  ...studyMaterials.articlesAndGuides,
                  ...studyMaterials.practice
                ]
                  .filter((r) => r.id !== studyMaterials.startHere?.id)
                  .map((res) => (
                    <div
                      key={res.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {res.platform}
                          </span>
                          {res.isOfficialSource && (
                            <span className="text-[9px] bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300 px-1 rounded font-semibold">
                              Official
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white truncate mt-0.5">
                          {res.title}
                        </div>
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-md transition flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Expected Competencies */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
            Expected Technical Competencies
          </h3>
          <div className="space-y-1.5">
            {topic.keyCompetencies && topic.keyCompetencies.length > 0 ? (
              topic.keyCompetencies.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 flex items-start space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{comp}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Curriculum competencies mapped to official standards.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenAssistant(topic.id);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ask AI Doubt</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAssessment(topic.id);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-600/20 dark:hover:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Award className="w-3.5 h-3.5 text-cyan-500" />
              <span>Diagnostic Test</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onExploreResources(topic.id);
            }}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
          >
            <span>Explore All Resources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
