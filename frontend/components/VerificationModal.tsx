import React, { useState } from "react";
import { LearningResource, VerificationReport } from "../types";
import { verificationService } from "../services/verificationService";
import { verificationQualityEval } from "../services/verificationQualityEval";
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
  Building,
  Info,
} from "lucide-react";

interface VerificationModalProps {
  resource: LearningResource | null;
  onClose: () => void;
  onVerificationUpdated?: (updatedReport: VerificationReport) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  resource,
  onClose,
  onVerificationUpdated,
}) => {
  if (!resource) return null;

  const [activeTab, setActiveTab] = useState<"report" | "eval">("report");
  const [report, setReport] = useState<VerificationReport | null>(
    resource.verificationReport || null,
  );
  const [isReverifying, setIsReverifying] = useState(false);
  const [evalResults, setEvalResults] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleTriggerRecheck = async () => {
    setIsReverifying(true);
    try {
      const newReport = await verificationService.runVerification(resource);
      setReport(newReport);
      if (onVerificationUpdated) {
        onVerificationUpdated(newReport);
      }
    } catch (e: any) {
      console.error("Re-verification failed:", e);
    } finally {
      setIsReverifying(false);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await verificationQualityEval.runEvaluationSuite();
      setEvalResults(res);
    } catch (e: any) {
      console.error("Evaluation suite failed:", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified_against_cited_references":
        return (
          <div className="p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Verified Against Cited References</span>
            </div>
            <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
              Assessed technical claims directly corroborated by canonical
              specifications within inspected scope.
            </p>
          </div>
        );
      case "potential_mismatch":
        return (
          <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Potential Specification Mismatch Detected</span>
            </div>
            <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
              Warning: Accessible content promotes deprecated APIs or
              contradicts modern runtime standards.
            </p>
          </div>
        );
      case "verification_failed":
        return (
          <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>Technical Verification Failure</span>
            </div>
            <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
              Provider timeout or communication failure. Not a content
              contradiction.
            </p>
          </div>
        );
      case "unable_to_verify":
      default:
        return (
          <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200">
              <HelpCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>Unable to Verify</span>
            </div>
            <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
              Material could not be definitively verified. Public captions or
              canonical documentation unavailable.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3.5">
          <div className="min-w-0 pr-2">
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Documentation Verification Engine</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {resource.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Platform: {resource.platform}</span>
              <span>•</span>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                Source <ExternalLink className="w-3 h-3 ml-1" />
              </a>
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

        {/* Tab Selector */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-2 min-h-[36px] rounded-lg font-semibold transition ${
                activeTab === "report"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Audit Evidence
            </button>
            <button
              onClick={() => setActiveTab("eval")}
              className={`px-3 py-2 min-h-[36px] rounded-lg font-semibold transition flex items-center space-x-1 ${
                activeTab === "eval"
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Benchmark Suite</span>
            </button>
          </div>

          {activeTab === "report" && (
            <button
              disabled={isReverifying}
              onClick={handleTriggerRecheck}
              className="px-3 py-2 min-h-[36px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${isReverifying ? "animate-spin" : ""}`}
              />
              <span>{isReverifying ? "Auditing..." : "Recheck vs Docs"}</span>
            </button>
          )}
        </div>

        {activeTab === "report" ? (
          <div className="space-y-4">
            {!report ? (
              <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Verification Run Executed Yet
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Gemini compares accessible resource content with the listed
                  official references. Inaccessible content remains unverified.
                </p>
                <button
                  disabled={isReverifying}
                  onClick={handleTriggerRecheck}
                  className="px-5 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  {isReverifying
                    ? "Comparing content..."
                    : "Run Gemini Verification"}
                </button>
              </div>
            ) : (
              <>
                {getStatusBadge(report.status)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      Scope Assessed:
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200 mt-0.5">
                      {report.assessedContentScope}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      Method & Time:
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200 mt-0.5">
                      {report.contentAccessMethod.replace(/_/g, " ")} ·{" "}
                      {new Date(report.checkedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Claims list */}
                <div className="space-y-2.5">
                  <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    Claim-Level Verification
                  </h4>
                  {report.claims.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      {report.findings.length > 0
                        ? report.findings[0]
                        : "No discrete claims evaluated."}
                    </div>
                  ) : (
                    report.claims.map((claim, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            "{claim.claim}"
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                              claim.matchStatus === "aligned"
                                ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {claim.matchStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            Canonical Standard:{" "}
                          </span>
                          {claim.officialDocReference}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {claim.explanation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Evaluation Suite */
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Quality Evaluation Suite
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Runs 5 representative test cases: accurate materials, deprecated
                APIs, missing captions, SSRF defense, and official documentation
                ingest.
              </p>
              <button
                disabled={isEvaluating}
                onClick={handleRunEvaluation}
                className="px-4 py-2 min-h-[44px] bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`}
                />
                <span>
                  {isEvaluating ? "Executing..." : "Run All Scenarios"}
                </span>
              </button>
            </div>

            {evalResults && (
              <div className="space-y-2">
                {evalResults.results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {res.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {res.reportSummary}
                      </div>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Passed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium rounded-xl text-xs transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
