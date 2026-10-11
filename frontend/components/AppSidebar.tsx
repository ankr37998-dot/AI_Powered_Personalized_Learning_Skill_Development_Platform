import React from "react";
import { UserProfile } from "../types";
import {
  Compass,
  FileText,
  ShieldCheck,
  Award,
  TrendingUp,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode2,
  X,
} from "lucide-react";

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
  onOpenDocs,
}) => {
  const studentNavSections = [
    {
      title: "LEARNING PATH",
      items: [
        {
          id: "roadmap",
          label: "Interactive Roadmap",
          icon: Compass,
          badge: "Main",
        },
        { id: "syllabus", label: "Syllabus Ingestion", icon: FileText },
      ],
    },
    {
      title: "CURATED KNOWLEDGE",
      items: [
        { id: "resources", label: "Verified Resources", icon: ShieldCheck },
      ],
    },
    {
      title: "SKILL ASSESSMENT",
      items: [
        { id: "assessment", label: "Diagnostics & Practice", icon: Award },
      ],
    },
    {
      title: "PROGRESSION",
      items: [{ id: "progress", label: "Mastery & History", icon: TrendingUp }],
    },
  ];
  const navSections =
    userProfile.role === "admin"
      ? [
          {
            title: "ADMINISTRATION",
            items: [
              {
                id: "admin",
                label: "Admin Dashboard",
                icon: ShieldCheck,
                badge: "Admin",
              },
            ],
          },
        ]
      : studentNavSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-925 border-r border-slate-200/90 dark:border-slate-800/80 transition-all duration-200 ease-out ${
          isOpenMobile
            ? "translate-x-0 w-[280px] shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsedDesktop ? "lg:w-[72px]" : "lg:w-[260px]"}`}
        aria-label={
          userProfile.role === "admin"
            ? "Administrator Navigation"
            : "Student Navigation"
        }
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
          <div
            onClick={() => handleNavClick("roadmap")}
            className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleNavClick("roadmap")}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30 flex-shrink-0">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    CogniPath AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate -mt-0.5">
                  {userProfile.role === "admin"
                    ? "Platform Administration"
                    : "Student Learning Workspace"}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapseDesktop}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-md transition"
            title={isCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={
              isCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {isCollapsedDesktop ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation Section List */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 overscroll-contain">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              {(!isCollapsedDesktop || isOpenMobile) && (
                <div className="px-2.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
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
                    className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors ${
                      isCollapsedDesktop && !isOpenMobile
                        ? "justify-center p-2.5"
                        : "space-x-2.5 px-2.5 py-2"
                    } ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-850/60"
                    }`}
                    title={isCollapsedDesktop ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-400"
                      }`}
                    />
                    {(!isCollapsedDesktop || isOpenMobile) && (
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
                    )}
                    {(!isCollapsedDesktop || isOpenMobile) && item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* System Status and Architecture Reference */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="px-2.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                SYSTEM & REFS
              </div>
            )}

            <button
              onClick={() => {
                onOpenBackendStatus();
                onCloseMobile();
              }}
              className={`w-full flex items-center rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/70 dark:hover:bg-slate-850/60 transition ${
                isCollapsedDesktop && !isOpenMobile
                  ? "justify-center p-2.5"
                  : "space-x-2.5 px-2.5 py-1.5"
              }`}
              title="MongoDB Atlas Status"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {(!isCollapsedDesktop || isOpenMobile) && (
                <span className="truncate">Atlas: cognipath_ai</span>
              )}
            </button>

            <button
              onClick={() => {
                onOpenDocs();
                onCloseMobile();
              }}
              className={`w-full flex items-center rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100/70 dark:hover:bg-slate-850/60 transition ${
                isCollapsedDesktop && !isOpenMobile
                  ? "justify-center p-2.5"
                  : "space-x-2.5 px-2.5 py-1.5"
              }`}
              title="Architecture Docs"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
              {(!isCollapsedDesktop || isOpenMobile) && (
                <span>Architecture Specs</span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Student Profile */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0">
          <div
            onClick={() => {
              onOpenProfile();
              onCloseMobile();
            }}
            className={`flex items-center rounded-lg p-1.5 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition ${
              isCollapsedDesktop && !isOpenMobile
                ? "justify-center"
                : "space-x-2"
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpenProfile()}
          >
            <div className="w-7 h-7 rounded-md bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            {(!isCollapsedDesktop || isOpenMobile) && (
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {userProfile.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate capitalize">
                  {userProfile.role === "admin"
                    ? "Administrator"
                    : `Student · ${userProfile.currentSkillLevel}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
