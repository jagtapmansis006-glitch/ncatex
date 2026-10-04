import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  Megaphone,
  Settings,
  Calendar,
  FileCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  Printer,
  Copy,
  Check,
  Building2,
  ExternalLink,
  Download,
  X,
  Layers,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Trash2,
  Eye,
  Send,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  AlertTriangle,
  Award,

} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import { supabase, type PaperRecord } from "@/lib/supabase";
import { ThemeToggle } from "@/context/ThemeContext";
import { triageAdminSubmission } from "@/lib/ai-validation-client";
import type { AdminTriageResult } from "@/services/ai-validation/types";
import { AdminSidebar, type AdminTab } from "@/components/admin/AdminSidebar";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { AdminDiagnostics } from "@/components/admin/AdminDiagnostics";
import { Announcements } from "@/components/admin/Announcements";
import { Settings as AdminSettings } from "@/components/admin/Settings";
import { ReviewTriage } from "@/components/admin/ReviewTriage";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "NCATEX – Academic Administration & Manuscript Control Center" },
      {
        name: "description",
        content:
          "Official peer review, participant management, and paper administration control center for NCATEX.",
      },
    ],
  }),
  component: AdminControlCenter,
});

const EASE = [0.16, 1, 0.3, 1] as const;

const TRACK_FILTER_OPTIONS = [
  "All Tracks",
  "Artificial Intelligence & Machine Learning",
  "VLSI & Embedded Systems",
  "5G & Next-Gen Wireless Communications",
  "Internet of Things (IoT) & Smart Sensors",
  "Digital Signal & Image Processing",
];

interface Reviewer {
  id: string;
  name: string;
  email: string;
  track: string;
  assignedCount: number;
  completedCount: number;
  rating: number;
}

const INITIAL_REVIEWERS: Reviewer[] = [
  {
    id: "rev-1",
    name: "Dr. Anand Verma",
    email: "a.verma@ncatex.edu",
    track: "Artificial Intelligence & Machine Learning",
    assignedCount: 14,
    completedCount: 11,
    rating: 4.9,
  },
  {
    id: "rev-2",
    name: "Prof. Sunita Rao",
    email: "s.rao@ncatex.edu",
    track: "VLSI & Embedded Systems",
    assignedCount: 10,
    completedCount: 8,
    rating: 4.8,
  },
  {
    id: "rev-3",
    name: "Dr. Rajesh Iyer",
    email: "r.iyer@ncatex.edu",
    track: "5G & Next-Gen Wireless Communications",
    assignedCount: 9,
    completedCount: 8,
    rating: 4.7,
  },
  {
    id: "rev-4",
    name: "Dr. Meera Deshmukh",
    email: "m.deshmukh@ncatex.edu",
    track: "Internet of Things (IoT) & Smart Sensors",
    assignedCount: 12,
    completedCount: 10,
    rating: 4.9,
  },
  {
    id: "rev-5",
    name: "Prof. Vikram Joshi",
    email: "v.joshi@ncatex.edu",
    track: "Digital Signal & Image Processing",
    assignedCount: 8,
    completedCount: 7,
    rating: 4.8,
  },
];

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: "General" | "Urgent" | "Deadline" | "Keynote";
  date: string;
  pinned: boolean;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "IEEE & Scopus Indexing Agreement Finalized",
    body: "All presented papers will proceed directly into indexed proceedings post-conference presentation.",
    category: "General",
    date: "Feb 02",
    pinned: true,
  },
  {
    id: "ann-2",
    title: "AI Format Audit Active on Manuscript Submissions",
    body: "Authors must ensure their uploaded PDF matches IEEE double-column margins to obtain instant format validation.",
    category: "Urgent",
    date: "Jan 28",
    pinned: true,
  },
];

interface ConferenceDateItem {
  id: string;
  label: string;
  date: string;
  status: "Completed" | "Upcoming" | "Scheduled";
}

const INITIAL_DATES: ConferenceDateItem[] = [
  { id: "d1", label: "Call for Papers Opens", date: "Jan 15", status: "Completed" },
  { id: "d2", label: "Paper Submission Deadline", date: "Feb 20", status: "Upcoming" },
  { id: "d3", label: "Peer Review Notification", date: "Mar 05", status: "Scheduled" },
  { id: "d4", label: "Camera-Ready Submission", date: "Mar 15", status: "Scheduled" },
  { id: "d5", label: "Official Conference Days", date: "Apr 10–11", status: "Scheduled" },
];

// Color palette for charts adhering to conference theme
const TRACK_COLORS = ["#0D9488", "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1"];
const STATUS_COLORS = {
  Accepted: "#10B981",
  "Under Review": "#F59E0B",
  "Revision Required": "#6366F1",
  Rejected: "#EF4444",
};

function AdminControlCenter() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("All Tracks");

  // Interaction State
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<PaperRecord | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Triage State for Admin Review
  const [triageMap, setTriageMap] = useState<Record<string, AdminTriageResult>>({});
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  // Reviewer and Scoring State
  const [reviewers, setReviewers] = useState<Reviewer[]>(INITIAL_REVIEWERS);
  const [evaluationScores, setEvaluationScores] = useState({
    paperId: "",
    innovation: 80,
    technicalQuality: 85,
    methodology: 80,
    presentation: 75,
    impact: 80,
  });

  // Announcements & Dates State
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    body: "",
    category: "General" as Announcement["category"],
    pinned: false,
  });
  const [datesList, setDatesList] = useState<ConferenceDateItem[]>(INITIAL_DATES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Certificate Preview State
  const [selectedCertificatePaper, setSelectedCertificatePaper] = useState<PaperRecord | null>(null);

  // Website Content State
  const [contentConfig, setContentConfig] = useState({
    heroTitle: "NCATEX",
    heroSubtitle: "National Conference on Advanced Trends in Electronics and Telecommunication Engineering",
    venue: "NCATEX Campus / Hybrid Virtual",
    dates: "April 10–11",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };


  // Fetch papers & profiles from Supabase live
  const fetchSubmissions = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("papers")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setPapers((data as PaperRecord[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load papers from Supabase.";
      setError(msg);
    }

    // Try fetching profiles table if exists
    try {
      const { data: profData, error: profErr } = await supabase.from("profiles").select("*");
      if (!profErr && profData) {
        setProfiles(profData);
      }
    } catch {
      // Gracefully handle if profiles table is not defined
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Update Status in Supabase in Real Time
  const handleUpdateStatus = async (id: string, newStatus: PaperRecord["status"]) => {
    setUpdatingId(id);
    try {
      const { error: err } = await supabase
        .from("papers")
        .update({ status: newStatus })
        .eq("id", id);

      if (err) throw err;

      // Update in local state
      setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));

      if (selectedDossier && selectedDossier.id === id) {
        setSelectedDossier((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      setJustUpdatedId(id);
      showToast(`Status updated to "${newStatus}" for paper #${id.slice(0, 8)}`);
      setTimeout(() => setJustUpdatedId(null), 2500);
    } catch (err: unknown) {
      alert("Failed to update status in Supabase: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  // Automatically fetch AI triage evaluation when a report dossier is opened
  useEffect(() => {
    if (!selectedDossier) {
      setTriageLoading(false);
      setTriageError(null);
      return;
    }

    const paperId = selectedDossier.id;
    if (triageMap[paperId]) return;

    let isMountedLocal = true;
    const fetchTriage = async () => {
      setTriageLoading(true);
      setTriageError(null);
      try {
        const response = await triageAdminSubmission({
          id: selectedDossier.id,
          paper_title: selectedDossier.paper_title,
          author_name: selectedDossier.author_name,
          department: selectedDossier.department,
          track: selectedDossier.track,
          abstract: selectedDossier.abstract,
        });

        if (isMountedLocal && response.result) {
          setTriageMap((prev) => ({
            ...prev,
            [paperId]: response.result,
          }));
        }
      } catch (err) {
        if (isMountedLocal) {
          setTriageError(err instanceof Error ? err.message : "Failed to load AI review triage assessment.");
        }
      } finally {
        if (isMountedLocal) setTriageLoading(false);
      }
    };

    fetchTriage();
    return () => {
      isMountedLocal = false;
    };
  }, [selectedDossier?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast("Copied to clipboard: " + text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics computation dynamically derived from Supabase
  const metrics = useMemo(() => {
    const total = papers.length;
    // Count distinct authors from papers and profiles
    const uniqueEmails = new Set([
      ...papers.map((p) => p.author_email?.toLowerCase()).filter(Boolean),
      ...profiles.map((pr) => pr.email?.toLowerCase()).filter(Boolean),
    ]);
    const registrations = Math.max(uniqueEmails.size, total);

    const underReview = papers.filter(
      (p) => p.status === "Under Review" || p.status === "Submitted",
    ).length;
    const accepted = papers.filter((p) => p.status === "Accepted").length;
    const revision = papers.filter(
      (p) => p.status === "Revision Required" || p.status === "Revision Needed",
    ).length;
    const rejected = papers.filter((p) => p.status === "Rejected").length;

    // Diagnostics / Error bottleneck metrics
    const pendingPdf = papers.filter((p) => !p.file_url && !p.pdf_url).length;
    const revisionDelays = revision;
    const incompleteAbstracts = papers.filter(
      (p) => !p.abstract || p.abstract.trim().length < 120,
    ).length;
    const aiFlagged = papers.filter(
      (p) =>
        p.abstract?.toLowerCase().includes("ai review") ||
        p.abstract?.toLowerCase().includes("failed") ||
        p.abstract?.toLowerCase().includes("format error"),
    ).length;

    return {
      total,
      registrations,
      underReview,
      accepted,
      revision,
      rejected,
      pendingPdf,
      revisionDelays,
      incompleteAbstracts,
      aiFlagged,
    };
  }, [papers, profiles]);

  // Dynamic Chart Dataset 1: Submissions by Track
  const trackChartData = useMemo(() => {
    return TRACK_FILTER_OPTIONS.filter((t) => t !== "All Tracks").map((trackName, idx) => {
      const count = papers.filter((p) => {
        const pTrack = (p.track || "").toLowerCase().trim();
        const tTrack = trackName.toLowerCase().trim();
        return pTrack === tTrack || pTrack.includes(tTrack.slice(0, 10));
      }).length;

      // Abbreviate track name for clean axis labels
      const shortName =
        trackName === "Artificial Intelligence & Machine Learning"
          ? "AI / ML"
          : trackName === "VLSI & Embedded Systems"
            ? "VLSI"
            : trackName === "5G & Next-Gen Wireless Communications"
              ? "5G Comms"
              : trackName === "Internet of Things (IoT) & Smart Sensors"
                ? "IoT & Sensors"
                : "Signal / DSP";

      return {
        name: shortName,
        fullName: trackName,
        count,
        fill: TRACK_COLORS[idx % TRACK_COLORS.length] ?? "#3B82F6",
      };
    });
  }, [papers]);

  // Dynamic Chart Dataset 2: Status Breakdown Donut
  const statusChartData = useMemo(() => {
    return [
      { name: "Approved / Accepted", value: metrics.accepted, color: STATUS_COLORS.Accepted },
      { name: "Pending / Review", value: metrics.underReview, color: STATUS_COLORS["Under Review"] },
      { name: "Revision Required", value: metrics.revision, color: STATUS_COLORS["Revision Required"] },
      { name: "Rejected", value: metrics.rejected, color: STATUS_COLORS.Rejected },
    ].filter((item) => item.value > 0 || papers.length === 0);
  }, [metrics, papers.length]);

  // Dynamic Chart Dataset 3: Diagnostic / Error Bottlenecks
  const diagnosticChartData = useMemo(() => {
    return [
      { name: "Pending PDF Uploads", count: metrics.pendingPdf, color: "#F59E0B" },
      { name: "Revision Delays", count: metrics.revisionDelays, color: "#6366F1" },
      { name: "Incomplete Abstracts", count: metrics.incompleteAbstracts, color: "#EC4899" },
      { name: "Format Audit Flags", count: metrics.aiFlagged, color: "#EF4444" },
    ];
  }, [metrics]);

  // Filtered papers list
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      if (selectedStatusFilter === "SUBMITTED") {
        if (paper.status !== "Submitted") return false;
      } else if (selectedStatusFilter === "UNDER_REVIEW") {
        if (paper.status !== "Under Review" && paper.status !== "Submitted") return false;
      } else if (selectedStatusFilter === "ACCEPTED") {
        if (paper.status !== "Accepted") return false;
      } else if (selectedStatusFilter === "REVISION") {
        if (paper.status !== "Revision Required" && paper.status !== "Revision Needed") return false;
      } else if (selectedStatusFilter === "REJECTED") {
        if (paper.status !== "Rejected") return false;
      }

      if (selectedTrackFilter !== "All Tracks") {
        const pTrack = (paper.track || "").toLowerCase().trim();
        const fTrack = selectedTrackFilter.toLowerCase().trim();
        const matchesExact = pTrack === fTrack;
        const matchesFuzzy =
          (fTrack.includes("artificial") && (pTrack.includes("ai/ml") || pTrack.includes("intelligence"))) ||
          (fTrack.includes("vlsi") && pTrack.includes("vlsi")) ||
          (fTrack.includes("5g") && (pTrack.includes("5g") || pTrack.includes("wireless"))) ||
          (fTrack.includes("iot") && (pTrack.includes("iot") || pTrack.includes("sensor"))) ||
          (fTrack.includes("signal") && (pTrack.includes("signal") || pTrack.includes("image") || pTrack.includes("dsp")));
        if (!matchesExact && !matchesFuzzy) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = paper.author_name?.toLowerCase().includes(query);
        const matchesEmail = paper.author_email?.toLowerCase().includes(query);
        const matchesTitle = paper.paper_title?.toLowerCase().includes(query);
        const matchesId = paper.id?.toLowerCase().includes(query);
        const matchesTrack = paper.track?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTitle && !matchesId && !matchesTrack) {
          return false;
        }
      }

      return true;
    });
  }, [papers, selectedStatusFilter, selectedTrackFilter, searchQuery]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  // Export CSV
  const handleExportCSV = (dataset: PaperRecord[], filename = "ncatex-submissions.csv") => {
    if (!dataset.length) {
      alert("No data available to export.");
      return;
    }
    const headers = [
      "ID",
      "Paper Title",
      "Author Name",
      "Author Email",
      "Department",
      "Track",
      "Status",
      "Submission Date",
      "PDF URL",
    ];
    const rows = dataset.map((p) => [
      `"${p.id}"`,
      `"${(p.paper_title || "").replace(/"/g, '""')}"`,
      `"${(p.author_name || "").replace(/"/g, '""')}"`,
      `"${p.author_email || ""}"`,
      `"${p.department || "Electronics & Telecommunication Engineering"}"`,
      `"${p.track || ""}"`,
      `"${p.status || "Under Review"}"`,
      `"${formatDate(p.created_at)}"`,
      `"${p.pdf_url || p.file_url || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${dataset.length} records to ${filename}`);
  };

  // Calculate Weighted Evaluation Score:
  // Innovation 25%, Technical Quality 25%, Methodology 20%, Presentation 20%, Impact 10%
  const computedEvaluationScore = useMemo(() => {
    const s = evaluationScores;
    const total =
      s.innovation * 0.25 +
      s.technicalQuality * 0.25 +
      s.methodology * 0.2 +
      s.presentation * 0.2 +
      s.impact * 0.1;
    return Math.round(total * 10) / 10;
  }, [evaluationScores]);

  // Essential 5 Tabs configuration per Requirement 3
  const ESSENTIAL_NAV_ITEMS: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: "dashboard", label: "Dashboard & Analytics", icon: LayoutDashboard },
    { id: "participants", label: "Participants & Submissions", icon: Users, count: metrics.total },
    { id: "review", label: "Review & Triage", icon: ShieldCheck, count: metrics.underReview },
    { id: "announcements", label: "Announcements & Dates", icon: Megaphone, count: announcements.length },
    { id: "settings", label: "Settings & System", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090d] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* =========================================================================
          ESSENTIAL 5-TAB COLLAPSIBLE CONTROL CENTER SIDEBAR
          ========================================================================= */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        metrics={{ total: metrics.total, underReview: metrics.underReview }}
        announcementsCount={announcements.length}
        onLogout={() => {
          logout();
          window.location.href = "/";
        }}
      />


      {/* =========================================================================
          MAIN CONTROL CENTER VIEW AREA
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-[#08090d]/85 backdrop-blur-md border-b border-slate-200 dark:border-[#1f2430] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
              NCATEX ADMIN /
            </span>
            <h1 className="text-base font-bold tracking-tight font-display text-slate-900 dark:text-white capitalize">
              {ESSENTIAL_NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
            >
              <span>Public Preview</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={() => fetchSubmissions(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Syncing..." : "Sync Live"}</span>
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 right-6 z-50 rounded-xl bg-teal-600 text-white px-4 py-2.5 text-xs font-semibold shadow-xl flex items-center gap-2 border border-teal-400/40"
            >
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Router */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-8">
          {/* =====================================================================
              TAB 1: 🏠 DASHBOARD & ANALYTICS (Live Supabase Charts & Diagnostics)
              ===================================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Key Overview Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { label: "Total Registrations", value: metrics.registrations, icon: Users, color: "text-blue-500" },
                  { label: "Total Manuscripts", value: metrics.total, icon: FileText, color: "text-teal-500" },
                  { label: "Pending Reviews", value: metrics.underReview, icon: Clock, color: "text-amber-500" },
                  { label: "Approved / Accepted", value: metrics.accepted, icon: CheckCircle2, color: "text-emerald-500" },
                  { label: "Revision Required", value: metrics.revision, icon: AlertCircle, color: "text-indigo-500" },
                  { label: "Rejected Papers", value: metrics.rejected, icon: XCircle, color: "text-rose-500" },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-4 shadow-sm hover:border-teal-500/40 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 truncate">
                          {m.label}
                        </span>
                        <Icon size={15} className={m.color} />
                      </div>
                      <p className="text-2xl font-bold tracking-tight font-display text-slate-900 dark:text-white">
                        {m.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Charts Row: Distribution & Progress Breakdown */}
              <AdminCharts
                trackChartData={trackChartData}
                statusChartData={statusChartData}
                papersCount={papers.length}
                isMounted={isMounted}
              />

              {/* 3. Diagnostic / Error Analysis Panel (Live Backend-Connected) */}
              <AdminDiagnostics
                metrics={metrics}
                diagnosticChartData={diagnosticChartData}
                totalPapers={papers.length}
                onViewAllProblemSubmissions={() => setActiveTab("participants")}
              />

            </div>
          )}

          {/* =====================================================================
              TAB 2: 👥 PARTICIPANTS & SUBMISSIONS (Table, Filters, Search, PDF Review)
              ===================================================================== */}
          {activeTab === "participants" && (
            <div className="space-y-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by author, title, email, or track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-teal-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Track Filter */}
                  <select
                    value={selectedTrackFilter}
                    onChange={(e) => setSelectedTrackFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {TRACK_FILTER_OPTIONS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UNDER_REVIEW">Under Review / Submitted</option>
                    <option value="ACCEPTED">Accepted / Approved</option>
                    <option value="REVISION">Revision Required</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleExportCSV(filteredPapers)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Submissions & Participants Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-[#1f2430] text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4">Author &amp; Scholar</th>
                        <th className="py-3.5 px-4">Paper Title &amp; ID</th>
                        <th className="py-3.5 px-4">Track</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Submitted</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredPapers.length > 0 ? (
                        filteredPapers.map((paper) => {
                          const isUpdating = updatingId === paper.id;
                          const hasPdf = !!(paper.pdf_url || paper.file_url);

                          return (
                            <tr
                              key={paper.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Author & Email */}
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {paper.author_name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  {paper.author_email}
                                </p>
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 truncate max-w-[180px]">
                                  {paper.department || "Electronics & Telecommunication"}
                                </p>
                              </td>

                              {/* Title & ID */}
                              <td className="py-3.5 px-4 max-w-xs">
                                <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                  {paper.paper_title}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(paper.id)}
                                  className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white mt-0.5"
                                >
                                  {copiedId === paper.id ? (
                                    <Check size={10} className="text-teal-500" />
                                  ) : (
                                    <Copy size={10} />
                                  )}
                                  <span>ID: {paper.id.slice(0, 10)}...</span>
                                </button>
                              </td>

                              {/* Track Badge */}
                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                                  {paper.track}
                                </span>
                              </td>

                              {/* Status Chip */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                    paper.status === "Accepted"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300"
                                      : paper.status === "Revision Required" || paper.status === "Revision Needed"
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300"
                                        : paper.status === "Rejected"
                                          ? "bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300"
                                          : "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300"
                                  }`}
                                >
                                  {paper.status || "Under Review"}
                                </span>
                              </td>

                              {/* Date */}
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {formatDate(paper.created_at)}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* PDF Preview Modal Trigger */}
                                  {hasPdf ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPdfUrl(paper.pdf_url || paper.file_url || null)}
                                      title="Preview submitted manuscript PDF"
                                      className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition cursor-pointer"
                                    >
                                      <FileText size={14} />
                                    </button>
                                  ) : (
                                    <span
                                      title="No PDF uploaded for this paper"
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-slate-300 dark:text-white/20 cursor-not-allowed"
                                    >
                                      <FileText size={14} />
                                    </span>
                                  )}

                                  {/* AI Triage Report Dossier Trigger */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDossier(paper)}
                                    title="View AI triage & evaluation dossier"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-teal-500/50 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
                                  >
                                    <Sparkles size={14} />
                                  </button>

                                  {/* Quick Status Dropdown */}
                                  <select
                                    disabled={isUpdating}
                                    value={paper.status}
                                    onChange={(e) =>
                                      handleUpdateStatus(paper.id, e.target.value as PaperRecord["status"])
                                    }
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                                  >
                                    <option value="Under Review">Under Review</option>
                                    <option value="Accepted">Approved</option>
                                    <option value="Revision Required">Revision</option>
                                    <option value="Rejected">Rejected</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            No manuscript records match your active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: 📝 REVIEW & TRIAGE (Reviewers, Weighted Scoring, Status Updates)
              ===================================================================== */}
          {activeTab === "review" && (
            <ReviewTriage onShowToast={showToast} />
          )}

          {/* =====================================================================
              TAB 4: 📢 ANNOUNCEMENTS & DATES (Manager & Live Homepage Sync)
              ===================================================================== */}
          {activeTab === "announcements" && (
            <Announcements onShowToast={showToast} />
          )}

          {/* =====================================================================
              TAB 5: ⚙️ SETTINGS & SYSTEM (CSV/Excel Compendium, Certificates, Content)
              ===================================================================== */}
          {activeTab === "settings" && (
            <AdminSettings
              papers={papers}
              acceptedCount={metrics.accepted}
              onShowToast={showToast}
              onExportCSV={handleExportCSV}
            />
          )}
        </main>
      </div>

      {/* =========================================================================
          PDF PREVIEW MODAL (Full In-App Viewer with Download & Print)
          ========================================================================= */}
      <AnimatePresence>
        {previewPdfUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPdfUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-[#1f2430] flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <FileText className="text-teal-600 dark:text-teal-400" size={18} />
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Manuscript PDF Preview
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <ExternalLink size={12} />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewPdfUrl(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-black/50">
                <iframe
                  src={previewPdfUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          AI REVIEW TRIAGE & DOSSIER MODAL (Gemini 2.5 Flash Evaluation)
          ========================================================================= */}
      <AnimatePresence>
        {selectedDossier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDossier(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] shadow-2xl flex flex-col overflow-hidden text-xs"
            >
              <div className="p-5 border-b border-slate-200 dark:border-[#1f2430] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <Sparkles size={11} /> Gemini 2.5 Flash Triage Dossier
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    {selectedDossier.paper_title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Author: {selectedDossier.author_name} ({selectedDossier.author_email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {triageLoading ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                    <RefreshCw size={24} className="animate-spin mx-auto text-teal-500" />
                    <p className="font-medium">Evaluating manuscript with Gemini 2.5 Flash...</p>
                  </div>
                ) : triageMap[selectedDossier.id] ? (() => {
                  const triage = triageMap[selectedDossier.id]!;
                  return (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-teal-900 dark:text-teal-200">
                            Overall Recommendation: {triage.recommendedAction}
                          </span>
                          <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-teal-800 dark:text-teal-200">
                            Score: {triage.scores?.overallAssessmentScore ?? 0}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-700 dark:text-teal-300/90 leading-relaxed">
                          {triage.executiveSummary}
                        </p>
                      </div>

                      {/* Key Strengths & Weaknesses */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 space-y-1.5">
                          <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                            Key Strengths
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-emerald-700 dark:text-emerald-300/90 text-[11px]">
                            {triage.analysis?.strengths?.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 space-y-1.5">
                          <h5 className="font-bold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                            Areas for Revision
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-rose-700 dark:text-rose-300/90 text-[11px]">
                            {triage.analysis?.weaknesses?.map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Abstract Submission</h5>
                    <p className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedDossier.abstract}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline PDF preview */}
      <AnimatePresence>
        {pdfPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPdfPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#1f2430] bg-[#0f1117]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#1f2430] px-5 py-3">
                <p className="truncate text-sm font-semibold">{pdfPreview.title}</p>
                <div className="flex items-center gap-2">
                  <a href={pdfPreview.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/5">
                    <ExternalLink size={12} /> New tab
                  </a>
                  <button type="button" aria-label="Close preview" onClick={() => setPdfPreview(null)} className="rounded-lg p-1.5 hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <iframe src={pdfPreview.url} title={pdfPreview.title} className="h-full w-full flex-1 bg-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminControlCenter;

