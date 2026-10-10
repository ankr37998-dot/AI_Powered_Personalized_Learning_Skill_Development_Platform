import React from 'react';
import {
  RoadmapNode,
  AssessmentAttempt,
  StudentProgressSummary,
  UserProfile
} from '../types';
import { assessmentService } from '../services/assessmentService';
import {
  Award,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  FileText,
  BookOpen
} from 'lucide-react';

interface ProgressHistoryViewProps {
  roadmap: RoadmapNode[];
  attempts: AssessmentAttempt[];
  userProfile: UserProfile;
  onNavigateToAssessment: () => void;
  onNavigateToRoadmap: () => void;
}

export const ProgressHistoryView: React.FC<ProgressHistoryViewProps> = ({
  roadmap,
  attempts,
  userProfile,
  onNavigateToAssessment,
  onNavigateToRoadmap
}) => {
  const summary: StudentProgressSummary = assessmentService.getProgressSummary(roadmap, attempts);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Progress & Learning History</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Student Mastery & Attempt Records</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              All learning progress is derived strictly from completed diagnostic tests and prerequisite roadmap unlocks.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateToAssessment}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              Take Assessment
            </button>
            <button
              onClick={onNavigateToRoadmap}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl transition border border-slate-700"
            >
              View Roadmap
            </button>
          </div>
        </div>

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Roadmap Mastery</span>
            <div className="text-xl font-bold text-indigo-400 mt-1">{summary.masteryPercentage}%</div>
            <span className="text-[10px] text-slate-500">{summary.topicsCompleted} of {summary.totalTopics} completed</span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Recorded Attempts</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">{summary.attemptsCount}</div>
            <span className="text-[10px] text-slate-500">Persisted diagnostic runs</span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Average Diagnostic</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {summary.attemptsCount > 0 ? `${summary.averageDiagnosticScore}%` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-500">Across all question tags</span>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Active Needs Revision</span>
            <div className="text-xl font-bold text-rose-400 mt-1">{summary.topicsNeedsRevision}</div>
            <span className="text-[10px] text-slate-500">Topics &lt; 70% threshold</span>
          </div>
        </div>
      </div>

      {/* Attempt History Log */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>Diagnostic Attempt History Log ({attempts.length})</span>
        </h3>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
            No diagnostic attempts recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{att.topicTitle}</div>
                  <div className="text-slate-400 flex items-center space-x-3 text-[11px]">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                      {new Date(att.timestamp).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>{att.answers.length} Questions Evaluated</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                      att.scorePercentage >= 75
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : att.scorePercentage >= 50
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {att.totalScore} / {att.maxScore} ({att.scorePercentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
