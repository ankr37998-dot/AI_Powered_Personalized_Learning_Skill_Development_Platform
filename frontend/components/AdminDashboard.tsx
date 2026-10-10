import React, { useState } from 'react';
import { CatalogTopic, LearningResource } from '../types';
import {
  ShieldAlert,
  Database,
  Link2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface AdminDashboardProps {
  catalog: CatalogTopic[];
  resources: LearningResource[];
  onUpdateCatalog: (newCatalog: CatalogTopic[]) => void;
  onUpdateResources: (newResources: LearningResource[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  catalog,
  resources,
  onUpdateCatalog,
  onUpdateResources
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'catalog' | 'resources' | 'reports'>('catalog');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSummary, setNewTopicSummary] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const handleAddCatalogTopic = () => {
    if (!newTopicTitle.trim()) return;

    const topicId = `topic_${Date.now()}`;
    const newEntry: CatalogTopic = {
      id: topicId,
      title: newTopicTitle,
      category: 'Backend Architecture',
      difficulty: newTopicDifficulty,
      summary: newTopicSummary || 'Curated catalog module',
      prerequisiteIds: catalog.length > 0 ? [catalog[catalog.length - 1].id] : [],
      officialDocSources: [
        {
          title: 'Node.js Official Documentation',
          url: 'https://nodejs.org/docs/latest/api/',
          authorityName: 'Official Runtime Docs'
        }
      ]
    };

    onUpdateCatalog([...catalog, newEntry]);
    setNewTopicTitle('');
    setNewTopicSummary('');
  };

  const handleRemoveTopic = (id: string) => {
    onUpdateCatalog(catalog.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase">
          <ShieldAlert className="w-4 h-4" />
          <span>Administrator Governance Console</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Catalog, Prerequisite & Metadata Management</h2>
        <p className="text-xs text-slate-300 mt-0.5">
          Manage system of record topics, official documentation authority mappings, and resource verification audits.
        </p>

        {/* Admin Tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-amber-900/40 text-xs">
          <button
            onClick={() => setActiveAdminTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeAdminTab === 'catalog'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Topic & Prerequisite Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeAdminTab === 'resources'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Resource Registry & Reports ({resources.length})
          </button>
        </div>
      </div>

      {activeAdminTab === 'catalog' && (
        <div className="space-y-6">
          {/* Add topic form */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Register New Official Catalog Topic</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-medium">Topic Title</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Worker Threads & CPU Concurrency"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Difficulty Level</label>
                <select
                  value={newTopicDifficulty}
                  onChange={(e) => setNewTopicDifficulty(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs text-slate-400 font-medium">Technical Summary</label>
                <input
                  type="text"
                  value={newTopicSummary}
                  onChange={(e) => setNewTopicSummary(e.target.value)}
                  placeholder="Summary of runtime mechanics and expected competencies..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleAddCatalogTopic}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Curated Catalog</span>
            </button>
          </div>

          {/* Catalog Table */}
          <div className="space-y-3">
            {catalog.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{cat.title}</span>
                    <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                      {cat.id}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded uppercase font-semibold">
                      {cat.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">{cat.summary}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>Prerequisites:</span>
                    {cat.prerequisiteIds.length === 0 ? (
                      <span className="text-slate-500">None (Foundational)</span>
                    ) : (
                      cat.prerequisiteIds.map((p, idx) => (
                        <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded text-[11px] text-cyan-300">
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveTopic(cat.id)}
                  title="Remove catalog entry"
                  className="p-2 text-slate-500 hover:text-rose-400 self-end sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'resources' && (
        <div className="space-y-3">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-sm">{res.title}</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded capitalize">
                    {res.platform}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span>Topic: {res.topicId}</span>
                  <span>•</span>
                  <span>Quality Score: {res.qualityScore}/100</span>
                  <span>•</span>
                  <span>Last Verified: {res.lastCheckedDate}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    res.verificationStatus === 'verified_against_cited_references'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : res.verificationStatus === 'potential_mismatch'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {res.verificationStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
