import React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/context/ThemeContext";

export type AdminTab = "dashboard" | "participants" | "review" | "announcements" | "settings";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  metrics: {
    total: number;
    underReview: number;
  };
  announcementsCount: number;
  onLogout: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  metrics,
  announcementsCount,
  onLogout,
}: AdminSidebarProps) {
  const ESSENTIAL_NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "dashboard", label: "Dashboard & Analytics", icon: LayoutDashboard },
    { id: "participants", label: "Participants & Submissions", icon: Users, count: metrics.total },
    { id: "review", label: "Review & Triage", icon: ShieldCheck, count: metrics.underReview },
    { id: "announcements", label: "Announcements & Dates", icon: Megaphone, count: announcementsCount },
    { id: "settings", label: "Settings & System", icon: Settings },
  ];

  return (
    <aside
      className={`bg-white dark:bg-[#0c0e14] border-r border-slate-200 dark:border-[#1f2430] flex flex-col shrink-0 transition-all duration-300 z-30 sticky top-0 md:h-screen ${
        sidebarCollapsed ? "md:w-20 w-full" : "md:w-72 w-full"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#1f2430] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/assets/ncatex-logo.png"
            alt="NCATEX Logo"
            className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0"
          />
          {!sidebarCollapsed && (
            <div className="truncate">
              <h2 className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                NCATEX ADMIN
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Control Center v2.6
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 active:scale-95 transition-all"
          aria-label="Toggle Sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Sidebar 5 Essential Navigation Items */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {ESSENTIAL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                active
                  ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-black shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              {!sidebarCollapsed && item.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    active
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-black font-bold"
                      : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Back to Public Landing & Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-[#1f2430] space-y-2 bg-slate-50/50 dark:bg-black/20">
        <a
          href="/"
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all active:scale-95 border border-slate-200 dark:border-white/10"
        >
          <ArrowLeft size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Back to Conference</span>}
        </a>

        <div className="flex items-center justify-between pt-1 px-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of administration"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
