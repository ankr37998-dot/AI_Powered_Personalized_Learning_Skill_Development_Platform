import React from 'react';
import { LearningResource, CatalogTopic } from '../types';
import {
  X,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  Video,
  Award,
  Globe,
  Tag,
  Info,
  Building,
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
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'documentation':
        return <BookOpen className="w-5 h-5 text-cyan-400" />;
      case 'article':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'mcq':
      case 'practice':
        return <Award className="w-5 h-5 text-emerald-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 mt-1">
              {getResourceIcon(resource.type)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {resource.platform}
                </span>
                {resource.isOfficialSource && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Building className="w-3 h-3 mr-1" />
                    Official Specification
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    resource.availabilityStatus === 'available'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : resource.availabilityStatus === 'unavailable'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Availability: {resource.availabilityStatus}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 leading-snug">{resource.title}</h2>
              {resource.authorOrChannel && (
                <p className="text-xs text-slate-400 mt-0.5">Author/Publisher: {resource.authorOrChannel}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description / Summary */}
        {resource.description && (
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-200 block mb-1">Resource Overview:</span>
            {resource.description}
          </div>
        )}

        {/* Explainable Recommendation Rationale (if present) */}
        {resource.recommendationReasons && resource.recommendationReasons.length > 0 && (
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Why this is recommended for you:</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300 pl-5 list-disc">
              {resource.recommendationReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Associated Topic</span>
            <span className="font-semibold text-white mt-0.5 block truncate">
              {associatedTopic ? associatedTopic.title : resource.topicId}
            </span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Difficulty Level</span>
            <span className="font-semibold text-white capitalize mt-0.5 block">
              {resource.difficulty || 'Not specified'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Language</span>
            <span className="font-semibold text-white mt-0.5 block">
              {resource.language || 'English'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Length / Duration</span>
            <span className="font-semibold text-white mt-0.5 block">
              {resource.durationOrReadTime || 'Unknown'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Publication Date</span>
            <span className="font-semibold text-white mt-0.5 block">
              {resource.publicationDate || 'Not recorded'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Last Checked</span>
            <span className="font-semibold text-white mt-0.5 block">
              {resource.lastCheckedDate || 'Recent'}
            </span>
          </div>
        </div>

        {/* Subtopics Tagging */}
        {resource.subtopics && resource.subtopics.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Targeted Subtopics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {resource.subtopics.map((st, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 border border-slate-700 flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>{st}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verification Status Banner */}
        <div className="p-3.5 rounded-xl border bg-slate-800/60 border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Official Specification Verification:</span>
            <div className="font-bold text-white mt-0.5 capitalize">
              {resource.verificationStatus.replace(/_/g, ' ')}
            </div>
          </div>

          {resource.verificationReport && onOpenVerificationReport && (
            <button
              onClick={() => onOpenVerificationReport(resource)}
              className="text-xs bg-cyan-950/60 hover:bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold px-3 py-1.5 rounded-lg transition self-start sm:self-auto"
            >
              Inspect Claim Comparisons
            </button>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            {onAskAiAboutResource && (
              <button
                onClick={() => onAskAiAboutResource(resource)}
                className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ask AI About Resource</span>
              </button>
            )}

            {onReportIssue && (
              <button
                onClick={() => onReportIssue(resource)}
                className="text-xs text-slate-400 hover:text-amber-400 transition flex items-center space-x-1 p-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Broken Link</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              Close
            </button>

            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-indigo-600/30"
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
