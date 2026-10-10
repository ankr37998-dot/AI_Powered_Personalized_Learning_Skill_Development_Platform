import React from 'react';
import { LearningResource } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

interface VerificationModalProps {
  resource: LearningResource | null;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ resource, onClose }) => {
  if (!resource || !resource.verificationReport) return null;

  const report = resource.verificationReport;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Documentation Verification Audit</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{resource.title}</h2>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span>Audited on {new Date(report.checkedAt).toLocaleDateString()}</span>
              <span>•</span>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center"
              >
                Source Material <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`p-4 rounded-xl border ${
            report.status === 'verified_against_cited_references'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : report.status === 'potential_mismatch'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold text-sm">
            {report.status === 'verified_against_cited_references' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span className="capitalize">{report.status.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-xs mt-1 text-slate-300">{report.assessedContentSummary}</p>
        </div>

        {/* Cited Official References */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold text-slate-400">Benchmarked Against Official Documentation</h4>
          <div className="space-y-1.5">
            {report.officialDocLinks.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 hover:border-slate-500 transition"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">{doc.title}</span>
                  <span className="text-slate-400">({doc.authority})</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Claim Comparisons */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-400">Claim-Level Verification Evidence</h4>
          {report.claims.length === 0 ? (
            <p className="text-xs text-slate-400">No discrete claim assertions extracted for this record.</p>
          ) : (
            <div className="space-y-2.5">
              {report.claims.map((claim, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white">"{claim.claim}"</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        claim.matchStatus === 'aligned'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : claim.matchStatus === 'deviates'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {claim.matchStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-cyan-400">Official Standard: </span>
                    {claim.officialDocReference}
                  </div>

                  <p className="text-xs text-slate-400">{claim.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Limitations & Verification Scope Disclaimer */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Verification Scope & Audit Limitations</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
            {report.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
            <li>
              "Verified against cited references" certifies that analyzed transcript and documentation segments aligned with official specifications at the time of check; it does not guarantee correctness of every external video minute.
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
