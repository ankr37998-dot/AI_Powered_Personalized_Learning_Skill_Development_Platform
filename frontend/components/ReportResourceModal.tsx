import React, { useState } from 'react';
import { LearningResource, ReportedResourceIssue } from '../types';
import { storageService } from '../services/storageService';
import { Flag, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ReportResourceModalProps {
  resource: LearningResource | null;
  studentName: string;
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const ReportResourceModal: React.FC<ReportResourceModalProps> = ({
  resource,
  studentName,
  onClose,
  onReportSubmitted
}) => {
  if (!resource) return null;

  const [reason, setReason] = useState<ReportedResourceIssue['reason']>('outdated_api');
  const [studentNotes, setStudentNotes] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issue: ReportedResourceIssue = {
      id: `rep_${Date.now()}`,
      resourceId: resource.id,
      resourceTitle: resource.title,
      reportedBy: studentName || 'Student Learner',
      reportedAt: new Date().toISOString(),
      reason,
      studentNotes: studentNotes.trim() || 'No additional comment provided.',
      status: 'pending_review'
    };

    storageService.addReportedIssue(issue);
    setIsDone(true);
    setTimeout(() => {
      onReportSubmitted();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Report Resource or Broken Link</h2>
              <p className="text-xs text-slate-400">Directly alerts administrators for content audit.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDone ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Report Submitted to Administrator</h3>
            <p className="text-xs text-slate-400">Thank you for keeping CogniPath resources technically accurate.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Target Resource:</span>
              <div className="font-semibold text-white mt-0.5 truncate">{resource.title}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Issue Category</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="broken_link">Broken Link / 404 / Video Removed</option>
                <option value="outdated_api">Outdated API / Teaches Deprecated Code</option>
                <option value="inaccurate_content">Inaccurate Technical Claims</option>
                <option value="misleading_title">Misleading Title or Paywalled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Detailed Feedback / Timecode / Error
              </label>
              <textarea
                rows={3}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Describe what is broken or which modern specification this contradicts..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
