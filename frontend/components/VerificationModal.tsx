import React, { useState } from 'react';
import { LearningResource, VerificationReport } from '../types';
import { verificationService } from '../services/verificationService';
import { verificationQualityEval } from '../services/verificationQualityEval';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCw,
  FlaskConical,
  CheckCircle,
  XCircle,
  FileText,
  Building,
  Info
} from 'lucide-react';

interface VerificationModalProps {
  resource: LearningResource | null;
  onClose: () => void;
  onVerificationUpdated?: (updatedReport: VerificationReport) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  resource,
  onClose,
  onVerificationUpdated
}) => {
  if (!resource) return null;

  const [activeTab, setActiveTab] = useState<'report' | 'eval'>('report');
  const [report, setReport] = useState<VerificationReport | null>(resource.verificationReport || null);
  const [isReverifying, setIsReverifying] = useState(false);
  const [evalResults, setEvalResults] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Trigger live re-verification
  const handleTriggerRecheck = async () => {
    setIsReverifying(true);
    try {
      const newReport = await verificationService.runVerification(resource);
      setReport(newReport);
      if (onVerificationUpdated) {
        onVerificationUpdated(newReport);
      }
    } catch (e: any) {
      console.error('Re-verification failed:', e);
    } finally {
      setIsReverifying(false);
    }
  };

  // Run the benchmark evaluation suite
  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await verificationQualityEval.runEvaluationSuite();
      setEvalResults(res);
    } catch (e: any) {
      console.error('Evaluation suite failed:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified_against_cited_references':
        return (
          <div className="p-4 rounded-xl border bg-emerald-950/30 border-emerald-500/40 text-emerald-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Verified Against Cited References</span>
            </div>
            <p className="text-xs mt-1 text-slate-300">
              Assessed technical claims directly corroborated by canonical specifications within the inspected content scope.
            </p>
          </div>
        );
      case 'potential_mismatch':
        return (
          <div className="p-4 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Potential Specification Mismatch Detected</span>
            </div>
            <p className="text-xs mt-1 text-slate-300">
              Audit warning: The accessible content promotes deprecated APIs or contradicts modern runtime standards.
            </p>
          </div>
        );
      case 'verification_failed':
        return (
          <div className="p-4 rounded-xl border bg-rose-950/30 border-rose-500/40 text-rose-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Technical Verification Failure</span>
            </div>
            <p className="text-xs mt-1 text-slate-300">
              The verification pipeline encountered a timeout or provider communication error. This is a technical failure, not a content contradiction.
            </p>
          </div>
        );
      case 'unable_to_verify':
      default:
        return (
          <div className="p-4 rounded-xl border bg-slate-800/80 border-slate-700 text-slate-300">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-200">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span>Unable to Verify</span>
            </div>
            <p className="text-xs mt-1 text-slate-400">
              Material could not be definitively verified. Public captions may be missing, external host may restrict access, or canonical docs are pending.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Documentation Verification Engine</span>
              <span>•</span>
              <span className="text-slate-400">Vertex AI / Gemini 2.5 Flash</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 leading-snug">{resource.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Platform: {resource.platform}</span>
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

        {/* Tab Selector: Single Report vs Verification Quality Evaluation Suite */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'report'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Audit Evidence Report
            </button>
            <button
              onClick={() => setActiveTab('eval')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
                activeTab === 'eval'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Quality Benchmark Suite</span>
            </button>
          </div>

          {activeTab === 'report' && (
            <button
              disabled={isReverifying}
              onClick={handleTriggerRecheck}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isReverifying ? 'animate-spin' : ''}`} />
              <span>{isReverifying ? 'Running Vertex AI Check...' : 'Recheck vs Docs'}</span>
            </button>
          )}
        </div>

        {activeTab === 'report' ? (
          /* TAB 1: VERIFICATION EVIDENCE REPORT */
          <div className="space-y-5">
            {!report ? (
              <div className="p-8 text-center space-y-3 bg-slate-800/40 rounded-2xl border border-slate-700">
                <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Verification Run Executed Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This educational resource has not yet been audited against official Node.js documentation.
                  Click below to trigger a live automated verification audit.
                </p>
                <button
                  disabled={isReverifying}
                  onClick={handleTriggerRecheck}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  {isReverifying ? 'Auditing with Gemini 2.5...' : 'Run Verification Audit Now'}
                </button>
              </div>
            ) : (
              <>
                {/* 1. Status Banner */}
                {getStatusBadge(report.status)}

                {/* Scope & Audit Provenance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Material Scope Assessed:</span>
                    <p className="font-medium text-slate-200 mt-0.5">{report.assessedContentScope}</p>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Access Method & Timestamp:</span>
                    <p className="font-medium text-slate-200 mt-0.5">
                      {report.contentAccessMethod.replace(/_/g, ' ')} •{' '}
                      {new Date(report.checkedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 2. Canonical Official Specifications Benchmarked */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Canonical Official Documentation Sources</span>
                  </h4>

                  {report.officialDocLinks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No official references cited for this run.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {report.officialDocLinks.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 hover:border-slate-500 transition group"
                        >
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <div>
                              <span className="font-semibold group-hover:text-cyan-300">{doc.title}</span>
                              <span className="text-slate-400 ml-1.5">({doc.authority})</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Claim Comparisons */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-slate-400">Claim-Level Verification Findings</h4>
                  {report.claims.length === 0 ? (
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700 text-xs text-slate-400">
                      {report.findings.length > 0 ? report.findings[0] : 'No discrete claims evaluated.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {report.claims.map((claim, idx) => (
                        <div key={idx} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-white">"{claim.claim}"</p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                claim.matchStatus === 'aligned'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : claim.matchStatus === 'deviates'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {claim.matchStatus}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="font-semibold text-cyan-400">Canonical Standard: </span>
                            {claim.officialDocReference}
                          </div>

                          <p className="text-xs text-slate-400">{claim.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Verification Limitations & Policy Notice */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
                  <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audit Scope Limitations & Verification Disclaimer</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {report.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : (
          /* TAB 2: VERIFICATION QUALITY EVALUATION SUITE */
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-xs space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                <span>Automated Verification Quality Evaluation Set</span>
              </h3>
              <p className="text-slate-300">
                Tests whether the verification pipeline behaves reliably across representative cases:
                (1) Consistent material, (2) Deliberate technical mismatch (`new Buffer()`), (3) Missing captions,
                (4) SSRF private address defense, and (5) Direct canonical documentation ingest.
              </p>
              <button
                disabled={isEvaluating}
                onClick={handleRunEvaluation}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Running 5 Scenarios...' : 'Execute Evaluation Suite'}</span>
              </button>
            </div>

            {evalResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span>
                    Results: {evalResults.passed} / {evalResults.total} Scenarios Passed
                  </span>
                  <span className={evalResults.passed === evalResults.total ? 'text-emerald-400' : 'text-amber-400'}>
                    {Math.round((evalResults.passed / evalResults.total) * 100)}% Pass Rate
                  </span>
                </div>

                <div className="space-y-2">
                  {evalResults.results.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{res.name}</span>
                        {res.passed ? (
                          <span className="text-emerald-400 flex items-center font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Passed
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                        <span>Expected: <span className="text-slate-200">{res.expected}</span></span>
                        <span>•</span>
                        <span>Actual: <span className="text-slate-200">{res.actual}</span></span>
                      </div>

                      <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded">
                        {res.reportSummary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-500">
            Audit engine: Vertex AI Gemini 2.5 Flash • Node.js Specs
          </div>

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
