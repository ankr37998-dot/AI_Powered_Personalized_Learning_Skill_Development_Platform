import React from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Menu,
  RefreshCw,
  Layers,
  Sparkles,
  Award,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  userProfile: UserProfile;
  onRoleChange: (newRole: UserRole) => void;
  completedTopicsCount: number;
  totalTopicsCount: number;
  onOpenMobileMenu: () => void;
  onResetData: () => void;
  onOpenAssistant: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  userProfile,
  onRoleChange,
  completedTopicsCount,
  totalTopicsCount,
  onOpenMobileMenu,
  onResetData,
  onOpenAssistant
}) => {
  const percentComplete =
    totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'roadmap':
        return { title: 'Learning Roadmap', category: 'Backend Engineering' };
      case 'syllabus':
        return { title: 'Syllabus Ingestion & Review', category: 'Curriculum' };
      case 'resources':
        return { title: 'Verified Educational Resources', category: 'Catalog' };
      case 'assessment':
        return { title: 'Assessment & Diagnostics', category: 'Competency Checks' };
      case 'progress':
        return { title: 'Progress & Learning History', category: 'Analytics' };
      case 'admin':
        return { title: 'Administrator Governance Console', category: 'Operations' };
      default:
        return { title: 'Learning Platform', category: 'CogniPath AI' };
    }
  };

  const pageInfo = getPageTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Menu button & Title Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <span>Path</span>
            <span>/</span>
            <span className="text-slate-300 font-medium">{pageInfo.category}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Center/Right: Learning Goal & Compact Mastery Tracker */}
      <div className="flex items-center space-x-3">
        {userProfile.role === 'student' && (
          <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-xs">
            <div className="max-w-xs truncate text-slate-300 text-[11px]">
              <span className="text-slate-400 font-semibold mr-1">Goal:</span>
              <span title={userProfile.targetGoal}>{userProfile.targetGoal}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px]">Mastery:</span>
              <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/80">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-indigo-400 font-mono font-bold text-[11px]">
                {percentComplete}%
              </span>
            </div>
          </div>
        )}

        {/* Ask AI Doubt Button inside topbar */}
        {userProfile.role === 'student' && (
          <button
            onClick={onOpenAssistant}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ask AI Doubt</span>
          </button>
        )}

        {/* Role Switcher Pill */}
        <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
          <button
            onClick={() => onRoleChange('student')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              userProfile.role === 'student'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => onRoleChange('admin')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              userProfile.role === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Reset Data Button */}
        <button
          onClick={onResetData}
          title="Reset Workspace to Clean Sample State"
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
