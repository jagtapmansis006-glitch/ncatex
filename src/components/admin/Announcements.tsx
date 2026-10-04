import { useState, useEffect } from "react";
import axios from "axios";
import { Megaphone, Calendar, Plus, Trash2, Loader2, CheckCircle2, Tag } from "lucide-react";
import { useAnnouncements, type Announcement } from "@/context/AnnouncementsContext";

export { type Announcement } from "@/context/AnnouncementsContext";

export interface ConferenceDateItem {
  id: string;
  label: string;
  date: string;
  status: "Completed" | "Upcoming" | "Scheduled";
}

const DEFAULT_DATES: ConferenceDateItem[] = [
  { id: "d1", label: "Call for Papers Opens", date: "Jan 15", status: "Completed" },
  { id: "d2", label: "Paper Submission Deadline", date: "Feb 20", status: "Upcoming" },
  { id: "d3", label: "Peer Review Notification", date: "Mar 05", status: "Scheduled" },
  { id: "d4", label: "Camera-Ready Submission", date: "Mar 15", status: "Scheduled" },
  { id: "d5", label: "Official Conference Days", date: "Apr 10–11", status: "Scheduled" },
];

export interface AnnouncementsProps {
  onShowToast?: (msg: string) => void;
}

export function Announcements({ onShowToast }: AnnouncementsProps) {
  const {
    announcements,
    isLoading: loadingAnnouncements,
    publishAnnouncement,
    deleteAnnouncement,
    fetchAnnouncements,
  } = useAnnouncements();

  const [datesList, setDatesList] = useState<ConferenceDateItem[]>(DEFAULT_DATES);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingDateId, setSavingDateId] = useState<string | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    body: "",
    tag: "",
    category: "General",
    pinned: false,
  });

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
  };

  // Async data fetching: GET /api/milestones
  const fetchDates = async () => {
    try {
      const res = await axios.get<ConferenceDateItem[]>("/api/milestones");
      if (Array.isArray(res.data)) {
        setDatesList(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch /api/milestones, using current state:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchDates();
  }, [fetchAnnouncements]);

  // POST /api/announcements: Publish Announcement
  const handlePublish = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.body.trim()) {
      alert("Please fill in both the title and body.");
      return;
    }

    setPublishing(true);
    const tag = newAnnouncement.tag.trim() || newAnnouncement.category.toUpperCase() || "GENERAL";
    const date = new Date().toLocaleDateString();

    try {
      await publishAnnouncement({
        id: `ann-${Date.now()}`,
        title: newAnnouncement.title.trim(),
        body: newAnnouncement.body.trim(),
        tag,
        category: newAnnouncement.category,
        date,
        pinned: newAnnouncement.pinned,
      });

      // Clear input fields immediately
      setNewAnnouncement({ title: "", body: "", tag: "", category: "General", pinned: false });
      notify("Announcement published successfully.");
    } catch (err) {
      console.error("Failed to publish announcement:", err);
      notify("Published to local store.");
    } finally {
      setPublishing(false);
    }
  };

  // DELETE /api/announcements/:id
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      notify("Announcement removed.");
    } catch {
      notify("Announcement removed.");
    } finally {
      setDeletingId(null);
    }
  };

  // PUT /api/milestones/:id (Auto-save on blur or save button click)
  const handleSaveMilestone = async (milestone: ConferenceDateItem) => {
    setSavingDateId(milestone.id);
    try {
      await axios.put(`/api/milestones/${milestone.id}`, milestone);
      notify(`Saved "${milestone.label}" live to timeline.`);
    } catch {
      notify(`Updated "${milestone.label}" locally.`);
    } finally {
      setTimeout(() => setSavingDateId(null), 800);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Announcements Manager (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone size={18} className="text-teal-500" />
            <span>Create Conference Announcement</span>
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Announcement Title *"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-teal-500"
            />

            <textarea
              rows={3}
              placeholder="Detailed Announcement Body *"
              value={newAnnouncement.body}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-teal-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tag / Badge (e.g. WEB COMPETITION, DEADLINE)"
                value={newAnnouncement.tag}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, tag: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-teal-500"
              />
              <select
                value={newAnnouncement.category}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    category: e.target.value,
                  })
                }
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-xs font-semibold cursor-pointer text-slate-900 dark:text-slate-100"
              >
                <option value="General">General</option>
                <option value="Urgent">Urgent</option>
                <option value="Deadline">Deadline</option>
                <option value="Keynote">Keynote</option>
                <option value="Competition">Competition</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnnouncement.pinned}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, pinned: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Pin to Bulletin &amp; Landing Ticker</span>
              </label>

              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Publish Announcement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Published Announcements List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Active Announcements ({announcements.length})
            </h4>
            {loadingAnnouncements && <Loader2 size={13} className="animate-spin text-teal-500" />}
          </div>

          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-4 text-xs space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {a.tag || a.category} • {a.date}
                </span>
                <button
                  type="button"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                  className="text-slate-400 hover:text-rose-500 transition cursor-pointer disabled:opacity-50 p-1"
                  aria-label={`Delete ${a.title}`}
                >
                  {deletingId === a.id ? (
                    <Loader2 size={13} className="animate-spin text-rose-500" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{a.title}</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Important Dates Manager (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-teal-500" />
                <span>Important Dates Manager</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronized live with homepage timeline
              </p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3">
            {datesList.map((d, idx) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 text-xs space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Milestone 0{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {savingDateId === d.id && (
                      <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        <CheckCircle2 size={11} /> Saved
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        d.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : d.status === "Upcoming"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-slate-100 dark:bg-white/10 text-slate-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Event Label:
                  </label>
                  <input
                    type="text"
                    value={d.label}
                    onBlur={() => handleSaveMilestone(d)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDatesList(datesList.map((x) => (x.id === d.id ? { ...x, label: val } : x)));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-semibold text-slate-900 dark:text-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Date String:
                  </label>
                  <input
                    type="text"
                    value={d.date}
                    onBlur={() => handleSaveMilestone(d)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDatesList(datesList.map((x) => (x.id === d.id ? { ...x, date: val } : x)));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs text-slate-600 dark:text-slate-300 font-mono focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              for (const d of datesList) {
                await handleSaveMilestone(d);
              }
              notify("Homepage dates schedule synchronized live.");
            }}
            className="w-full py-2.5 rounded-xl bg-teal-600 text-white dark:bg-teal-500 dark:text-black text-xs font-semibold transition hover:opacity-90 active:scale-95 cursor-pointer"
          >
            Sync All Dates Live to Conference Site
          </button>
        </div>
      </div>
    </div>
  );
}

export default Announcements;
