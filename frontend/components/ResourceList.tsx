import React, { useState } from 'react';
import { LearningResource, VerificationStatus, CatalogTopic } from '../types';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Video,
  BookOpen,
  FileText,
  Award,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';

interface ResourceListProps {
  resources: LearningResource[];
  catalog: CatalogTopic[];
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onInspectVerification: (resource: LearningResource) => void;
  onTriggerLiveVerification: (resource: LearningResource) => void;
  isVerifyingId?: string | null;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  catalog,
  selectedTopicId,
  onSelectTopic,
  onInspectVerification,
  onTriggerLiveVerification,
  isVerifyingId
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // Filter resources
  const topicResources = resources.filter((r) => {
    const matchTopic = selectedTopicId === 'all' || r.topicId === selectedTopicId;
    const matchType = filterType === 'all' || r.type === filterType;
    const matchVerified = !onlyVerified || r.verificationStatus === 'verified_against_cited_references';
    return matchTopic && matchType && matchVerified;
  });

  const currentTopic = catalog.find((c) => c.id === selectedTopicId);

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified_against_cited_references':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Verified vs Official Docs
          </span>
        );
      case 'potential_mismatch':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Potential Spec Mismatch
          </span>
        );
      case 'verification_failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Verification Failed
          </span>
        );
      case 'unable_to_verify':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Unable to Verify
          </span>
        );
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'documentation':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'article':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'practice':
        return <Award className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Curated Resource Directory</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {currentTopic ? `Resources for: ${currentTopic.title}` : 'All Catalog Learning Materials'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every external tutorial, video, and article is checked against Node.js & WHATWG official standards.
            </p>
          </div>

          {/* Topic selector dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-medium">Topic Filter:</label>
            <select
              value={selectedTopicId}
              onChange={(e) => onSelectTopic(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Available Topics</option>
              {catalog.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter bar by type & verification */}
        <div className="mt-4 pt-4 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            {['all', 'video', 'documentation', 'article', 'practice'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
            />
            <span>Show Only Formally Verified Materials</span>
          </label>
        </div>
      </div>

      {/* Official Documentation Citations Panel for this topic */}
      {currentTopic && currentTopic.officialDocSources.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/40 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Authoritative Official Documentation for this Topic:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentTopic.officialDocSources.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg p-3 text-xs flex items-center justify-between group transition"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{doc.authorityName}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topicResources.length === 0 ? (
          <div className="col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
            No resources match the selected filters.
          </div>
        ) : (
          topicResources.map((res) => {
            const isCurrentlyVerifying = isVerifyingId === res.id;

            return (
              <div
                key={res.id}
                className="bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 flex flex-col justify-between transition shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                        {getResourceIcon(res.type)}
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        {res.platform}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                        Score: {res.qualityScore}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-snug hover:text-indigo-300 transition-colors">
                      {res.title}
                    </h3>
                    {res.authorOrChannel && (
                      <p className="text-xs text-slate-400 mt-0.5">By {res.authorOrChannel}</p>
                    )}
                  </div>

                  {/* Verification Status Banner */}
                  <div className="flex items-center justify-between pt-1">
                    {getVerificationBadge(res.verificationStatus)}
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {res.durationOrReadTime}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {res.verificationReport ? (
                      <button
                        onClick={() => onInspectVerification(res)}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1.5 rounded-lg transition"
                      >
                        View Verification Report
                      </button>
                    ) : (
                      <button
                        disabled={isCurrentlyVerifying}
                        onClick={() => onTriggerLiveVerification(res)}
                        className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isCurrentlyVerifying ? 'Auditing with Gemini...' : 'Verify vs Docs'}</span>
                      </button>
                    )}
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
