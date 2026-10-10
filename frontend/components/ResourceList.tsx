import React, { useState, useMemo } from 'react';
import { LearningResource, VerificationStatus, CatalogTopic, UserProfile } from '../types';
import { resourceService } from '../services/resourceService';
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
  Filter,
  Flag,
  Info,
  Search,
  Building,
  ArrowUpDown,
  Tag,
  Eye,
  RefreshCw
} from 'lucide-react';

interface ResourceListProps {
  resources: LearningResource[];
  catalog: CatalogTopic[];
  selectedTopicId: string;
  userProfile: UserProfile;
  onSelectTopic: (topicId: string) => void;
  onInspectVerification: (resource: LearningResource) => void;
  onTriggerLiveVerification: (resource: LearningResource) => void;
  onReportResource: (resource: LearningResource) => void;
  onViewResourceDetails: (resource: LearningResource) => void;
  isVerifyingId?: string | null;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  catalog,
  selectedTopicId,
  userProfile,
  onSelectTopic,
  onInspectVerification,
  onTriggerLiveVerification,
  onReportResource,
  onViewResourceDetails,
  isVerifyingId
}) => {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterSubtopic, setFilterSubtopic] = useState<string>('all');
  const [onlyOfficial, setOnlyOfficial] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'recent' | 'title'>('recommended');
  const [isLoading, setIsLoading] = useState(false);

  const currentTopic = catalog.find((c) => c.id === selectedTopicId);

  // Collect available subtopics for the selected topic
  const availableSubtopics = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (selectedTopicId === 'all' || r.topicId === selectedTopicId) {
        if (r.subtopics) {
          r.subtopics.forEach((st) => set.add(st));
        }
      }
    });
    return Array.from(set);
  }, [resources, selectedTopicId]);

  // Filtered & Ranked resources using baseline recommendation engine
  const filteredResources = useMemo(() => {
    return resourceService.filterResources(
      resources,
      {
        topicId: selectedTopicId,
        subtopic: filterSubtopic,
        type: filterType,
        difficulty: filterDifficulty,
        language: filterLanguage,
        officialOnly: onlyOfficial,
        verifiedOnly: onlyVerified,
        searchQuery,
        sortBy
      },
      userProfile
    );
  }, [
    resources,
    selectedTopicId,
    filterSubtopic,
    filterType,
    filterDifficulty,
    filterLanguage,
    onlyOfficial,
    onlyVerified,
    searchQuery,
    sortBy,
    userProfile
  ]);

  const getVerificationBadge = (res: LearningResource) => {
    switch (res.verificationStatus) {
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            {res.verificationReport ? 'Unable to Verify' : 'Pending Verification Audit'}
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
      case 'mcq':
      case 'practice':
        return <Award className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleSimulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="space-y-6">
      {/* Header, Search & Filter Controls */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Curated Resource Directory & Recommendation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {currentTopic ? `Resources for: ${currentTopic.title}` : 'All Catalog Educational Materials'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked with explainable criteria matching your target goal: "{userProfile.targetGoal}".
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

        {/* Search Bar & Secondary Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, or subtopic..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subtopic Filter */}
          <div>
            <select
              value={filterSubtopic}
              onChange={(e) => setFilterSubtopic(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Subtopics</option>
              {availableSubtopics.map((st, idx) => (
                <option key={idx} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="recommended">Sort: Explainable Recommended</option>
              <option value="recent">Sort: Recently Checked</option>
              <option value="title">Sort: Alphabetical Title</option>
            </select>
          </div>
        </div>

        {/* Type Filter Buttons & Checkbox Toggles */}
        <div className="pt-2 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'video', 'documentation', 'article', 'practice'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOfficial}
                onChange={(e) => setOnlyOfficial(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Official Specs Only</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Audited & Verified Only</span>
            </label>
          </div>
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
        {isLoading ? (
          // Skeleton loading states
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-6 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
              <div className="h-8 bg-slate-700 rounded w-full pt-4" />
            </div>
          ))
        ) : filteredResources.length === 0 ? (
          <div className="col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-10 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Matching Resources Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No educational material matches the current filters or search term. Try resetting your filters or selecting "All Available Topics".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterSubtopic('all');
                setOnlyOfficial(false);
                setOnlyVerified(false);
              }}
              className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredResources.map((res) => {
            const isCurrentlyVerifying = isVerifyingId === res.id;
            const hasAuditReport = Boolean(res.verificationReport);

            return (
              <div
                key={res.id}
                className="bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 flex flex-col justify-between transition shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                        {getResourceIcon(res.type)}
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        {res.platform}
                      </span>
                      {res.isOfficialSource && (
                        <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.5 rounded font-semibold">
                          Official
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {res.isReported && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                          Under Audit
                        </span>
                      )}
                      <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                        {res.difficulty || 'All levels'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onViewResourceDetails(res)}
                      className="font-bold text-white text-base leading-snug hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {res.title}
                    </h3>
                    {res.authorOrChannel && (
                      <p className="text-xs text-slate-400 mt-0.5">By {res.authorOrChannel}</p>
                    )}
                    {res.description && (
                      <p className="text-xs text-slate-300/80 mt-1 line-clamp-2">{res.description}</p>
                    )}
                  </div>

                  {/* Explainable Recommendation Badges */}
                  {res.recommendationReasons && res.recommendationReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {res.recommendationReasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-900/60 px-2 py-0.5 rounded-md flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="truncate max-w-[200px]">{reason}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Verification Status Banner */}
                  <div className="flex items-center justify-between pt-1">
                    {getVerificationBadge(res)}
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {res.durationOrReadTime}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewResourceDetails(res)}
                      className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {hasAuditReport ? (
                      <button
                        onClick={() => onInspectVerification(res)}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1.5 rounded-lg transition"
                      >
                        Audit
                      </button>
                    ) : (
                      <button
                        disabled={isCurrentlyVerifying}
                        onClick={() => onTriggerLiveVerification(res)}
                        className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isCurrentlyVerifying ? 'Auditing...' : 'Verify'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReportResource(res)}
                      title="Report broken link or outdated API"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 bg-slate-900 hover:bg-slate-700 border border-slate-700 transition"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-200 hover:text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition shadow-sm"
                  >
                    <span>Open Material</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
