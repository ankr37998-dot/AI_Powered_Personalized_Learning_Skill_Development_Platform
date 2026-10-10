import React from 'react';
import { RoadmapNode, CatalogTopic, TopicStatus } from '../types';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

interface RoadmapViewProps {
  roadmap: RoadmapNode[];
  catalog: CatalogTopic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onOpenAssistant: (topicId: string) => void;
  onOpenAssessment: (topicId: string) => void;
  onOpenSyllabus: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  catalog,
  activeTopicId,
  onSelectTopic,
  onOpenAssistant,
  onOpenAssessment,
  onOpenSyllabus
}) => {
  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed (Proficient)
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <PlayCircle className="w-3.5 h-3.5 mr-1" /> Active Topic
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Revision Needed (&lt;70%)
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <PlayCircle className="w-3.5 h-3.5 mr-1" /> Ready to Start
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-400 border border-slate-700">
            <Lock className="w-3.5 h-3.5 mr-1" /> Prerequisites Locked
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Header & Explanation */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold">
                Dependency-Engineered Roadmap
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Strict Prerequisite Ordering</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Production Backend Engineering Path
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Constructed from syllabus topics mapped against curated runtime prerequisites. Unlocks systematically as you demonstrate mastery through evidence-based assessments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSyllabus}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-3.5 py-2 rounded-xl border border-slate-600 transition flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ingest / Edit Syllabus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sequential Graph Display */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-cyan-500 before:to-slate-700">
        {roadmap.map((node, index) => {
          const catalogItem = catalog.find((c) => c.id === node.topicId);
          const isSelected = node.topicId === activeTopicId;
          const isLocked = node.status === 'locked';

          // find prerequisite titles
          const prereqTitles = catalogItem
            ? catalogItem.prerequisiteIds.map((pid) => {
                const found = catalog.find((c) => c.id === pid);
                return found ? found.title : pid;
              })
            : [];

          return (
            <div key={node.topicId} className="relative group">
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  node.status === 'completed'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : node.status === 'in_progress'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/20'
                    : node.status === 'needs_revision'
                    ? 'bg-rose-950 border-rose-500 text-rose-400'
                    : node.status === 'available'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-400'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {node.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : node.status === 'locked' ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              {/* Node Card */}
              <div
                onClick={() => !isLocked && onSelectTopic(node.topicId)}
                className={`rounded-2xl p-5 border transition-all ${
                  isLocked
                    ? 'bg-slate-900/60 border-slate-800/80 opacity-70 cursor-not-allowed'
                    : isSelected
                    ? 'bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50 cursor-pointer'
                    : 'bg-slate-800/90 border-slate-700 hover:border-slate-600 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">{node.unit}</span>
                      <span>•</span>
                      <span>Topic #{index + 1}</span>
                      {catalogItem && (
                        <>
                          <span>•</span>
                          <span className="capitalize text-indigo-400">{catalogItem.difficulty}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {node.title}
                    </h3>

                    {catalogItem && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-2xl">
                        {catalogItem.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
                    {getStatusBadge(node.status)}
                    {typeof node.score === 'number' && (
                      <span className="text-xs font-mono font-medium text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                        Diagnostics: {node.score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Prerequisites requirements pill */}
                {prereqTitles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Prerequisites:</span>
                    {prereqTitles.map((p, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-xs border ${
                          node.prerequisitesMet
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons inside card */}
                {!isLocked && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAssistant(node.topicId);
                        }}
                        className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 transition flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ask AI Tutor</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAssessment(node.topicId);
                        }}
                        className="text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-medium px-3 py-1.5 rounded-lg border border-cyan-500/30 transition flex items-center space-x-1"
                      >
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Practice & Diagnostic Quiz</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectTopic(node.topicId)}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1 group/btn"
                    >
                      <span>Explore Verified Resources</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
