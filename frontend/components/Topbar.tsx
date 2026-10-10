import React from 'react';
import { UserProfile } from '../types';
import { ThemeMode } from '../services/themeService';
import {
  Menu,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  userProfile: UserProfile;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  completedTopicsCount: number;
  totalTopicsCount: number;
  onOpenMobileMenu: () => void;
  onResetData: () => void;
  onOpenAssistant: () => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  userProfile,
  currentTheme,
  onToggleTheme,
  completedTopicsCount,
  totalTopicsCount,
  onOpenMobileMenu,
  onResetData,
  onOpenAssistant,
  onLogout
}) => {
  const percentComplete =
    totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const getPageInfo = (tab: string) => {
    switch (tab) {
      case 'roadmap':
        return { title: 'Node.js Backend Developer Path', category: 'Roadmap' };
      case 'syllabus':
        return { title: 'Syllabus Ingestion & Parsing', category: 'Curriculum' };
      case 'resources':
        return { title: 'Verified Resource Directory', category: 'Catalog' };
      case 'assessment':
        return { title: 'Diagnostics & Competency Checks', category: 'Practice' };
      case 'progress':
        return { title: 'Learning History & Attempts', category: 'Progress' };
      default:
        return { title: 'Student Learning Workspace', category: 'CogniPath' };
    }
  };

  const page = getPageInfo(activeTab);

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-slate-925/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-3 sm:px-6 transition-colors">
      {/* Left: Mobile hamburger + Page Breadcrumbs */}
      <div className="flex items-center space-x-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">{page.category}</span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
          <h1 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {page.title}
          </h1>
        </div>
      </div>

      {/* Right Controls (Student Exclusive) */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
        {/* Progress pill on larger screens */}
        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-850 rounded-full border border-slate-200/80 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Roadmap Progress:</span>
          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
            {percentComplete}%
          </span>
        </div>

        {/* Ask AI Doubt Button */}
        <button
          onClick={onOpenAssistant}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/15 dark:hover:bg-indigo-600/25 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 rounded-lg text-xs font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI Doubt</span>
        </button>

        {/* Theme Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Reset Clean Sample State */}
        <button
          onClick={onResetData}
          title="Reset Workspace to Clean Sample State"
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Reset workspace data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Sign Out Action Button */}
        <button
          onClick={onLogout}
          title="Sign out of student account"
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1"
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
