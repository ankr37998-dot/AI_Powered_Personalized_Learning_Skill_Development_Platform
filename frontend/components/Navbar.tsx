import React from "react";
import { UserProfile } from "../types";
import {
  BookOpen,
  ShieldCheck,
  User,
  Cpu,
  FileCode2,
  RefreshCw,
  Award,
  Layers,
  TrendingUp,
} from "lucide-react";

interface NavbarProps {
  userProfile: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
  completedTopicsCount: number;
  totalTopicsCount: number;
  onOpenDocs: () => void;
  onResetData: () => void;
  onOpenProfile: () => void;
  onOpenBackendStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  activeTab,
  onTabChange,
  completedTopicsCount,
  totalTopicsCount,
  onOpenDocs,
  onResetData,
  onOpenProfile,
  onOpenBackendStatus,
}) => {
  const percentComplete =
    totalTopicsCount > 0
      ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
      : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onTabChange("roadmap")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  CogniPath
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  MERN + MongoDB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Roadmap & Doc-Verification Platform
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onTabChange("roadmap")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "roadmap"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Learning Roadmap</span>
              </span>
            </button>

            <button
              onClick={() => onTabChange("syllabus")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "syllabus"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Syllabus Ingestion</span>
              </span>
            </button>

            <button
              onClick={() => onTabChange("resources")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "resources"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Resources</span>
              </span>
            </button>

            <button
              onClick={() => onTabChange("assessment")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "assessment"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Award className="w-4 h-4" />
                <span>Assessment & Diagnostics</span>
              </span>
            </button>

            <button
              onClick={() => onTabChange("progress")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "progress"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Learning History</span>
              </span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenProfile}
              title="Manage Learning Preferences & Goal"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <button
              onClick={onOpenDocs}
              title="View Architecture & Implementation Plan Docs"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Spec Docs</span>
            </button>

            <div className="bg-slate-800/70 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              Student Workspace
            </div>

            <button
              onClick={onResetData}
              title="Reset to Verified Sample Data"
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pb-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">
              {userProfile.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="truncate max-w-xs sm:max-w-md">
              {userProfile.targetGoal}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Roadmap Mastery:</span>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-indigo-400 font-semibold">
              {percentComplete}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
