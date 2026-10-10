import React from 'react';
import { LearningResource, CatalogTopic } from '../types';
import {
  X,
  ExternalLink,
  BookOpen,
  Building,
  CheckCircle2,
  FileText,
  Video,
  Award,
  Tag,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface ResourceDetailModalProps {
  resource: LearningResource | null;
  catalog: CatalogTopic[];
  onClose: () => void;
  onOpenVerificationReport?: (resource: LearningResource) => void;
  onReportIssue?: (resource: LearningResource) => void;
  onAskAiAboutResource?: (resource: LearningResource) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  catalog,
  onClose,
  onOpenVerificationReport,
  onReportIssue,
  onAskAiAboutResource
}) => {
  if (!resource) return null;

  const associatedTopic = catalog.find((c) => c.id === resource.topicId);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'documentation':
        return <BookOpen className="w-5 h-5 text-cyan-500" />;
      case 'article':
        return <FileText className="w-5 h-5 text-amber-500" />;
      case 'mcq':
      case 'practice':
        return <Award className="w-5 h-5 text-emerald-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3.5">
          <div className="flex items-start space-x-3 min-w-0 pr-2">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-1 flex-shrink-0">
              {getResourceIcon(resource.type)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  {resource.platform}
                </span>
                {resource.isOfficialSource && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    <Building className="w-3 h-3 mr-1" />
                    Official Spec
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    resource.availabilityStatus === 'available'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {resource.availabilityStatus}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                {resource.title}
              </h2>
              {resource.authorOrChannel && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Author: {resource.authorOrChannel}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview */}
        {resource.description && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Overview:</span>
            {resource.description}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Topic</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate block">
              {associatedTopic ? associatedTopic.title : resource.topicId}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Difficulty</span>
            <span className="font-semibold text-slate-900 dark:text-white capitalize block">
              {resource.difficulty || 'All Levels'}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Duration</span>
            <span className="font-semibold text-slate-900 dark:text-white block">
              {resource.durationOrReadTime || 'N/A'}
            </span>
          </div>
        </div>

        {/* Subtopics */}
        {resource.subtopics && resource.subtopics.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Targeted Subtopics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {resource.subtopics.map((st, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-cyan-500" />
                  <span>{st}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Documentation Audit Status:</span>
            <div className="font-bold text-slate-900 dark:text-white capitalize">
              {resource.verificationStatus.replace(/_/g, ' ')}
            </div>
          </div>

          {resource.verificationReport && onOpenVerificationReport && (
            <button
              onClick={() => onOpenVerificationReport(resource)}
              className="text-xs bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 font-semibold px-3 py-2 min-h-[36px] rounded-lg transition border border-cyan-200 dark:border-cyan-800 self-start sm:self-auto"
            >
              Inspect Audit Evidence
            </button>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 gap-2.5">
          <div className="flex items-center space-x-2">
            {onAskAiAboutResource && (
              <button
                onClick={() => onAskAiAboutResource(resource)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ask AI About Resource</span>
              </button>
            )}

            {onReportIssue && (
              <button
                onClick={() => onReportIssue(resource)}
                className="px-2.5 py-2.5 min-h-[44px] text-xs text-slate-500 hover:text-amber-500 transition flex items-center justify-center"
                title="Report broken resource"
                aria-label="Report broken resource"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Close
            </button>

            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-5 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <span>Open on {resource.platform}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
