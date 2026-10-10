import React from 'react';
import { CatalogTopic, RoadmapNode, LearningResource, UserProfile } from '../types';
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
  FileText
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

  // Retrieve top recommended resources for this specific topic using baseline engine
  const topicResources = resources.filter((r) => r.topicId === topic.id);
  const topRecommended = resourceService
    .rankResourcesForStudent(topicResources, userProfile, topic.id)
    .slice(0, 2);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-400" />;
      case 'documentation':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Catalog Competency Detail</span>
              <span>•</span>
              <span className="capitalize text-slate-400">{topic.difficulty} Level</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{topic.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{topic.summary}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Student Mastery Status */}
        {roadmapNode && (
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Roadmap Progress:</span>
              <span className="ml-2 font-bold text-white uppercase">{roadmapNode.status.replace(/_/g, ' ')}</span>
            </div>
            {typeof roadmapNode.score === 'number' && (
              <span className="bg-slate-900 px-2.5 py-1 rounded text-cyan-300 font-mono border border-slate-700">
                Latest Quiz: {roadmapNode.score}%
              </span>
            )}
          </div>
        )}

        {/* Top Recommended Learning Resources */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold text-indigo-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Top Recommended Learning Material</span>
            </h3>
            <button
              onClick={() => {
                onClose();
                onExploreResources(topic.id);
              }}
              className="text-[11px] text-cyan-400 hover:underline font-semibold"
            >
              View all ({topicResources.length})
            </button>
          </div>

          {topRecommended.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
              No resources mapped to this topic yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topRecommended.map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-slate-900">{getResourceIcon(res.type)}</div>
                      <span className="font-bold text-white">{res.title}</span>
                      {res.isOfficialSource && (
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 rounded border border-cyan-800 font-semibold">
                          Official
                        </span>
                      )}
                    </div>

                    {res.recommendationReasons && res.recommendationReasons.length > 0 && (
                      <div className="text-[11px] text-indigo-300/90 pl-6">
                        • {res.recommendationReasons[0]}
                      </div>
                    )}
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key Competencies to Master */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold text-slate-300">Expected Technical Competencies</h3>
          <div className="space-y-1.5">
            {topic.keyCompetencies && topic.keyCompetencies.length > 0 ? (
              topic.keyCompetencies.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/80 text-xs text-slate-200 flex items-start space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{comp}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Curriculum competencies mapped to official standards.</p>
            )}
          </div>
        </div>

        {/* Prerequisite Chain */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold text-slate-300">Prerequisite Dependencies</h3>
          {prereqTopics.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
              No prerequisites. This is a foundational topic accessible immediately.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {prereqTopics.map((pt) => (
                <span
                  key={pt.id}
                  className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{pt.title}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Authoritative Official Documentation Sources */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold text-slate-300">Authoritative Official Standards</h3>
          <div className="space-y-1.5">
            {topic.officialDocSources.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500 text-xs text-slate-200 transition group"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold group-hover:text-cyan-300">{doc.title}</span>
                  <span className="text-slate-400">({doc.authorityName})</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenAssistant(topic.id);
              }}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask AI Doubt Solver</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAssessment(topic.id);
              }}
              className="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diagnostic Test</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onExploreResources(topic.id);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <span>Explore All Resources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
