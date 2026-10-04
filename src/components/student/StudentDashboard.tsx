import React, { useState } from "react";
import {
  Megaphone,
  Bell,
  Sparkles,
  Calendar,
  FileText,
  Upload,
  Search,
  ExternalLink,
  Tag,
  RefreshCw,
  Award,
  AlertCircle,
  Pin,
} from "lucide-react";
import { useAnnouncements, type Announcement } from "@/context/AnnouncementsContext";
import { useAuth } from "@/lib/auth";

export interface StudentDashboardProps {
  onOpenSubmit?: () => void;
  onOpenTrack?: () => void;
}

export function StudentDashboard({ onOpenSubmit, onOpenTrack }: StudentDashboardProps) {
  const { user } = useAuth();
  const { announcements, isLoading, fetchAnnouncements } = useAnnouncements();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = ["ALL", ...Array.from(new Set(announcements.map((a) => a.tag || a.category || "GENERAL")))];

  const filteredAnnouncements = selectedCategory === "ALL"
    ? announcements
    : announcements.filter((a) => (a.tag || a.category) === selectedCategory);

  const getTagColorClass = (tag?: string) => {
    const t = (tag || "").toUpperCase();
    if (t.includes("COMPETITION") || t.includes("WEB")) {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    }
    if (t.includes("URGENT") || t.includes("DEADLINE")) {
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    }
    if (t.includes("SCOPUS") || t.includes("IEEE") || t.includes("KEYNOTE")) {
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
    }
    if (t.includes("AI") || t.includes("AUDIT")) {
      return "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30";
    }
    return "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Student Welcome Header & Quick Action Row */}
      <div className="rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <Sparkles size={13} />
              <span>Student Scholar Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Welcome{user?.name ? `, ${user.name}` : " Scholar"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Manage your IEEE-format manuscript submissions, view live review stages, and stay updated with conference bulletins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSubmit && (
              <button
                type="button"
                onClick={onOpenSubmit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Upload size={14} />
                <span>Submit Manuscript</span>
              </button>
            )}
            {onOpenTrack && (
              <button
                type="button"
                onClick={onOpenTrack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-800 dark:text-white font-semibold text-xs shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <Search size={14} />
                <span>Track My Papers</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          OFFICIAL ANNOUNCEMENTS BULLETIN CARD SECTION
          ========================================================================= */}
      <section id="official-announcements" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#1f2430]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display flex items-center gap-2">
                <span>Official Announcements</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-sans border border-teal-500/20">
                  Live Bulletin
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time official notices, deadlines, and competitive opportunities from the technical committee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fetchAnnouncements()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Announcement Badge Cards Grid */}
        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-8 text-center text-slate-500">
            <Bell size={28} className="mx-auto mb-2 opacity-40 text-teal-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No announcements posted yet</p>
            <p className="text-xs text-slate-500 mt-1">Check back shortly for upcoming conference updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnnouncements.map((ann) => {
              const tagText = ann.tag || ann.category || "GENERAL";
              const colorClass = getTagColorClass(tagText);

              return (
                <div
                  key={ann.id}
                  className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-5 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Decorative corner glow */}
                  <div className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full bg-teal-500/5 blur-xl group-hover:bg-teal-500/10 transition-colors" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${colorClass}`}>
                        <Tag size={10} />
                        <span>{tagText}</span>
                      </span>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-400">
                        {ann.pinned && (
                          <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400 font-semibold" title="Pinned Announcement">
                            <Pin size={11} className="rotate-45" />
                          </span>
                        )}
                        <span>{ann.date}</span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {ann.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ann.body}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium text-teal-600 dark:text-teal-400">Official Notice</span>
                    <span className="text-[10px] font-mono text-slate-400">{ann.id.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default StudentDashboard;
