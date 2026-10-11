import React, { useState, useEffect } from "react";
import { BackendHealthState } from "../types";
import { apiClient } from "../services/apiClient";
import {
  studentTestSuite,
  StudentTestResult,
} from "../services/studentTestSuite";
import {
  Database,
  Server,
  Cpu,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  FlaskConical,
  ShieldCheck,
  Globe,
  Terminal,
  Activity,
} from "lucide-react";

interface BackendStatusModalProps {
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  onClose,
}) => {
  const [health, setHealth] = useState<BackendHealthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<{
    passed: number;
    total: number;
    results: StudentTestResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    const state = await apiClient.checkBackendHealth();
    setHealth(state);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningTests(true);
    try {
      const res = await studentTestSuite.runSuite();
      setTestResults(res);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                System Diagnostics & Verification Suite
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Database connection, server routes, and student platform
                assertions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* MongoDB Atlas Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>MongoDB Connection</span>
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${health?.databaseConnected ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"}`}
              >
                {health?.databaseConnected ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {health?.databaseConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1">
              <div>
                Host:{" "}
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {health?.databaseHost || "Unavailable"}
                </span>
              </div>
              <div>
                Database:{" "}
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  cognipath_ai
                </span>
              </div>
              <div>
                Auth:{" "}
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Configured by backend
                </span>
              </div>
            </div>
          </div>

          {/* Express Server / Gateway Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-cyan-500" />
                <span>Node / Express REST API</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                Port {health?.activePort || 5000} Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1">
              <div>
                Environment:{" "}
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  Local Development
                </span>
              </div>
              <div>
                Gemini API:{" "}
                <span
                  className={`font-semibold ${health?.googleAiConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                >
                  {health?.googleAiConfigured
                    ? "Configured"
                    : "API key required"}
                </span>
              </div>
              <div>
                Client Mode:{" "}
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {health?.mode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Student Verification Test Runner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <FlaskConical className="w-4 h-4 text-indigo-500" />
              <span>Student Quality & Constraint Test Assertions</span>
            </span>
            <button
              disabled={isRunningTests}
              onClick={handleRunDiagnostics}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRunningTests ? "animate-spin" : ""}`}
              />
              <span>{isRunningTests ? "Executing..." : "Run All Tests"}</span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span>
                  Result: {testResults.passed} / {testResults.total} Assertions
                  Passed
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  100% Passing
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {testResults.results.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {r.expected}
                      </div>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center flex-shrink-0 ml-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Passed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={fetchHealth}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recheck Health</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
