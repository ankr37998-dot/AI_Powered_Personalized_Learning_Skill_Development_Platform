import React from 'react';
import { RoadmapNode, CatalogTopic, TopicStatus } from '../types';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Layers,
  ChevronRight,
  Clock
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <PlayCircle className="w-3 h-3 mr-1" /> In Progress
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Revision Needed
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <PlayCircle className="w-3 h-3 mr-1" /> Ready
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Lock className="w-3 h-3 mr-1" /> Locked
          </span>
        );
    }
  };

  const completedCount = roadmap.filter((n) => n.status === 'completed').length;
  const progressPct = roadmap.length > 0 ? Math.round((completedCount / roadmap.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Overview (Clean, roadmap.sh style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Structured Developer Path</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Production Node.js Backend Path
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Prerequisite-ordered curriculum mapping syllabus concepts to official runtime standards. Pass diagnostic assessments to unlock subsequent modules.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Path Completion</span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              {completedCount} / {roadmap.length} ({progressPct}%)
            </span>
          </div>

          <button
            onClick={onOpenSyllabus}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Syllabus</span>
          </button>
        </div>
      </div>

      {/* Structured Roadmap Lineage */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
        {roadmap.map((node, index) => {
          const catalogItem = catalog.find((c) => c.id === node.topicId);
          const isSelected = node.topicId === activeTopicId;
          const isLocked = node.status === 'locked';

          const prereqTitles = catalogItem
            ? catalogItem.prerequisiteIds.map((pid) => {
                const found = catalog.find((c) => c.id === pid);
                return found ? found.title : pid;
              })
            : [];

          return (
            <div key={node.topicId} className="relative group">
              {/* Milestone Indicator Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  node.status === 'completed'
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400'
                    : node.status === 'in_progress'
                    ? 'bg-slate-900 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/20'
                    : node.status === 'needs_revision'
                    ? 'bg-slate-900 border-rose-500 text-rose-400'
                    : node.status === 'available'
                    ? 'bg-slate-900 border-cyan-500 text-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {node.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : node.status === 'locked' ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <span className="text-[10px] font-bold font-mono">{index + 1}</span>
                )}
              </div>

              {/* Topic Node Card */}
              <div
                onClick={() => !isLocked && onSelectTopic(node.topicId)}
                className={`rounded-xl p-4 border transition-all ${
                  isLocked
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/40 cursor-pointer shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">{node.unit}</span>
                      <span>·</span>
                      <span className="capitalize">{catalogItem?.difficulty || 'Intermediate'}</span>
                      {typeof node.score === 'number' && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400 font-mono">Score: {node.score}%</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {node.title}
                    </h3>

                    {catalogItem && (
                      <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                        {catalogItem.summary}
                      </p>
                    )}
                  </div>

                  <div className="self-start sm:self-auto flex items-center space-x-2">
                    {getStatusBadge(node.status)}
                  </div>
                </div>

                {/* Prerequisites list */}
                {prereqTitles.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">Requires:</span>
                    {prereqTitles.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700/80"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!isLocked && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAssistant(node.topicId);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-700"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Ask AI</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAssessment(node.topicId);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-700"
                      >
                        <Award className="w-3 h-3 text-cyan-400" />
                        <span>Diagnostic Quiz</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectTopic(node.topicId)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Explore Resources</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
