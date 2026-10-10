import React from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Layers,
  BookOpen,
  ShieldCheck,
  Award,
  TrendingUp,
  User,
  ShieldAlert,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode2,
  X
} from 'lucide-react';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile: UserProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  onOpenProfile: () => void;
  onOpenBackendStatus: () => void;
  onOpenDocs: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onTabChange,
  userProfile,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  onOpenProfile,
  onOpenBackendStatus,
  onOpenDocs
}) => {
  const isStudent = userProfile.role === 'student';

  const navSections = isStudent
    ? [
        {
          title: 'LEARN',
          items: [
            { id: 'roadmap', label: 'Learning Roadmap', icon: Layers, badge: 'Core' },
            { id: 'syllabus', label: 'Syllabus Ingestion', icon: BookOpen }
          ]
        },
        {
          title: 'RESOURCES',
          items: [
            { id: 'resources', label: 'Verified Resources', icon: ShieldCheck }
          ]
        },
        {
          title: 'PRACTICE & DIAGNOSTICS',
          items: [
            { id: 'assessment', label: 'Assessment & Diagnostics', icon: Award }
          ]
        },
        {
          title: 'PROGRESS',
          items: [
            { id: 'progress', label: 'Learning History', icon: TrendingUp }
          ]
        }
      ]
    : [
        {
          title: 'GOVERNANCE',
          items: [
            { id: 'admin', label: 'Admin Console', icon: ShieldAlert, badge: 'Admin' }
          ]
        }
      ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div
            onClick={() => handleNavClick('roadmap')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                    CogniPath
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.2 rounded border border-indigo-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Roadmap & Verification</p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggleCollapseDesktop}
            className="hidden lg:flex p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isCollapsedDesktop ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsedDesktop ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {(!isCollapsedDesktop || isOpenMobile) && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-xl font-medium text-xs transition-all ${
                      isCollapsedDesktop && !isOpenMobile
                        ? 'justify-center p-3'
                        : 'space-x-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                    title={isCollapsedDesktop ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    {(!isCollapsedDesktop || isOpenMobile) && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {(!isCollapsedDesktop || isOpenMobile) && item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick Tools & Inspect Modals */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                SYSTEM & TOOLS
              </div>
            )}

            <button
              onClick={onOpenBackendStatus}
              className={`w-full flex items-center rounded-xl text-xs text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60 transition ${
                isCollapsedDesktop && !isOpenMobile
                  ? 'justify-center p-3'
                  : 'space-x-3 px-3 py-2'
              }`}
              title="Database & REST Status"
            >
              <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {(!isCollapsedDesktop || isOpenMobile) && (
                <span className="truncate">Atlas: cognipath_ai</span>
              )}
            </button>

            <button
              onClick={onOpenDocs}
              className={`w-full flex items-center rounded-xl text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition ${
                isCollapsedDesktop && !isOpenMobile
                  ? 'justify-center p-3'
                  : 'space-x-3 px-3 py-2'
              }`}
              title="Architecture Docs"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {(!isCollapsedDesktop || isOpenMobile) && <span>Architecture Specs</span>}
            </button>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div
            onClick={onOpenProfile}
            className={`flex items-center rounded-xl p-2 cursor-pointer hover:bg-slate-800 transition ${
              isCollapsedDesktop && !isOpenMobile ? 'justify-center' : 'space-x-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 text-indigo-300 font-bold text-xs">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{userProfile.name}</div>
                <div className="text-[10px] text-slate-400 truncate capitalize">
                  {userProfile.role} • {userProfile.currentSkillLevel}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
