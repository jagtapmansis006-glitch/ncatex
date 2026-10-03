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
<<<<<<< HEAD
  ExternalLink,
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardCheck,
  Award,
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  LogOut,
=======
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
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)
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

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "NCATEX 2026 – Academic Administration & Manuscript Control Center" },
      {
        name: "description",
        content:
          "Official peer review, participant management, and paper administration control center for NCATEX 2026.",
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
    date: "Feb 02, 2026",
    pinned: true,
  },
  {
    id: "ann-2",
    title: "AI Format Audit Active on Manuscript Submissions",
    body: "Authors must ensure their uploaded PDF matches IEEE double-column margins to obtain instant format validation.",
    category: "Urgent",
    date: "Jan 28, 2026",
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
  { id: "d1", label: "Call for Papers Opens", date: "Jan 15, 2026", status: "Completed" },
  { id: "d2", label: "Paper Submission Deadline", date: "Feb 20, 2026", status: "Upcoming" },
  { id: "d3", label: "Peer Review Notification", date: "Mar 05, 2026", status: "Scheduled" },
  { id: "d4", label: "Camera-Ready Submission", date: "Mar 15, 2026", status: "Scheduled" },
  { id: "d5", label: "Official Conference Days", date: "Apr 10–11, 2026", status: "Scheduled" },
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
    heroTitle: "NCATEX 2026",
    heroSubtitle: "National Conference on Advanced Trends in Electronics and Telecommunication Engineering",
    venue: "NCATEX Campus / Hybrid Virtual",
    dates: "April 10–11, 2026",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

<<<<<<< HEAD
  // Dropdown navigation state
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);
=======
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)

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
        fill: TRACK_COLORS[idx % TRACK_COLORS.length],
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
<<<<<<< HEAD
    <div className="dark flex min-h-screen bg-[#090D16] text-[#f1f5f9] font-sans antialiased">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className="min-w-0 flex-1">
      {/* Top Admin Navbar with Sticky Glass Blur */}
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 backdrop-blur-xl ${
          isScrolled
            ? "border-slate-200/90 dark:border-[#1f2430] bg-white/90 dark:bg-[#0b0d14]/90 shadow-sm dark:shadow-black/20"
            : "border-slate-200/60 dark:border-[#1f2430] bg-white/80 dark:bg-[#0b0d14]/80"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 transition-all hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white active:scale-95"
            >
              <ArrowLeft size={13} />
              <span>Back to Conference</span>
            </Link>
=======
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
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)

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
<<<<<<< HEAD
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Track Filter Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-white/50 whitespace-nowrap hidden sm:inline font-medium">
                Track:
              </span>
              <select
                value={selectedTrackFilter}
                onChange={(e) => setSelectedTrackFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141721] px-3.5 py-2.5 text-xs text-slate-800 dark:text-white/90 outline-none transition-colors hover:border-slate-300 dark:hover:border-white/20 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {TRACK_FILTER_OPTIONS.map((track) => (
                  <option
                    key={track}
                    value={track}
                    className="bg-white dark:bg-[#141721] text-slate-900 dark:text-white"
                  >
                    {track}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <span className="text-[11px] text-slate-400 dark:text-white/40 mr-1.5 flex items-center gap-1 font-medium">
              <SlidersHorizontal size={11} /> Filter:
            </span>
            {[
              { id: "ALL", label: `All (${papers.length})` },
              { id: "UNDER_REVIEW", label: `Under Review (${metrics.underReview})` },
              { id: "ACCEPTED", label: `Accepted (${metrics.accepted})` },
              { id: "REVISION", label: `Revision (${metrics.revision})` },
              { id: "REJECTED", label: `Rejected (${metrics.rejected})` },
            ].map((tab) => {
              const active = selectedStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-sm font-semibold dark:bg-white dark:text-[#0b0c10]"
                      : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Papers Table Card */}
        <section className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] shadow-sm dark:shadow-lg overflow-hidden transition-colors duration-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <RefreshCw size={26} className="animate-spin text-teal-600 dark:text-teal-400 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-white/70">
                Connecting to Supabase registry...
              </p>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                Retrieving author manuscripts and review states
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <AlertCircle size={32} className="text-rose-500 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Database Query Failed
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/60 max-w-md mt-1 mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchSubmissions()}
                className="rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <FileText size={32} className="text-slate-300 dark:text-white/20 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No Manuscripts Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 max-w-sm mt-1 mb-4">
                {searchQuery ||
                selectedStatusFilter !== "ALL" ||
                selectedTrackFilter !== "All Tracks"
                  ? "No submissions matched your active search or filters. Try adjusting your query."
                  : "No submissions have been indexed yet."}
              </p>
              {(searchQuery ||
                selectedStatusFilter !== "ALL" ||
                selectedTrackFilter !== "All Tracks") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatusFilter("ALL");
                    setSelectedTrackFilter("All Tracks");
                  }}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-1.5 text-xs text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
                    <th className="py-3.5 px-4 sm:px-6">Student / Author</th>
                    <th className="py-3.5 px-4">Paper Title &amp; ID</th>
                    <th className="py-3.5 px-4">Track</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4">Review State</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {filteredPapers.map((paper, index) => {
                    const isUpdating = updatingId === paper.id;
                    const justUpdated = justUpdatedId === paper.id;

                    return (
                      <motion.tr
                        key={paper.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] group"
                      >
                        {/* Student / Author Column */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                            {paper.author_name}
                          </div>
                          <div className="mt-0.5 text-slate-500 dark:text-white/50 text-[11px] flex items-center gap-1 font-mono">
                            <Mail size={10} className="opacity-60" />
                            <span>{paper.author_email}</span>
                          </div>
                          {paper.department && (
                            <div className="mt-1 text-[10px] text-slate-400 dark:text-white/40 truncate max-w-[200px]">
                              {paper.department}
                            </div>
                          )}
                        </td>

                        {/* Paper Title & ID */}
                        <td className="py-4 px-4 align-top max-w-[320px]">
                          <div className="font-medium text-slate-800 dark:text-white/90 line-clamp-2 leading-relaxed">
                            {paper.paper_title}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-400/10 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-400/20">
                              {paper.id.slice(0, 8)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paper.id)}
                              className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors"
                              title="Copy full UUID"
                            >
                              {copiedId === paper.id ? (
                                <Check size={11} className="text-teal-600 dark:text-teal-400" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Track Badge */}
                        <td className="py-4 px-4 align-top">
                          <span className="inline-block rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-white/80 max-w-[180px] truncate">
                            {paper.track}
                          </span>
                        </td>

                        {/* Submission Date */}
                        <td className="py-4 px-4 align-top whitespace-nowrap text-slate-500 dark:text-white/60 font-mono text-[11px]">
                          {formatDate(paper.created_at)}
                        </td>

                        {/* Real-time Status Dropdown */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="relative inline-flex items-center gap-1.5">
                            <select
                              value={paper.status}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleUpdateStatus(
                                  paper.id,
                                  e.target.value as PaperRecord["status"],
                                )
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold outline-none transition-all cursor-pointer shadow-sm ${
                                paper.status === "Accepted"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/25"
                                  : paper.status === "Under Review" || paper.status === "Submitted"
                                    ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-500/25"
                                    : paper.status === "Revision Required" ||
                                        paper.status === "Revision Needed"
                                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-500/25"
                                      : "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-500/25"
                              }`}
                            >
                              <option
                                value="Under Review"
                                className="bg-white dark:bg-[#141721] text-amber-700 dark:text-amber-300"
                              >
                                Under Review
                              </option>
                              <option
                                value="Accepted"
                                className="bg-white dark:bg-[#141721] text-emerald-700 dark:text-emerald-300"
                              >
                                Accepted
                              </option>
                              <option
                                value="Revision Required"
                                className="bg-white dark:bg-[#141721] text-indigo-700 dark:text-indigo-300"
                              >
                                Revision Required
                              </option>
                              <option
                                value="Rejected"
                                className="bg-white dark:bg-[#141721] text-rose-700 dark:text-rose-300"
                              >
                                Rejected
                              </option>
                            </select>

                            {isUpdating && (
                              <RefreshCw
                                size={12}
                                className="animate-spin text-slate-400 dark:text-white/60"
                              />
                            )}
                            {justUpdated && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-teal-600 dark:text-teal-400 text-[10px] font-semibold flex items-center gap-0.5"
                              >
                                <Check size={11} /> Saved
                              </motion.span>
                            )}
                          </div>
                        </td>

                        {/* View PDF / Report Action */}
                        <td className="py-4 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(() => {
                              const pt = triageMap[paper.id];
                              if (!pt) return null;
                              return (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider border ${
                                    pt.condition === "EXCELLENT"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300"
                                      : pt.condition === "ACCEPTABLE"
                                        ? "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300"
                                        : pt.condition === "NEEDS_REVISION"
                                          ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300"
                                          : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300"
                                  }`}
                                >
                                  {pt.condition.replace("_", " ")}
                                </span>
                              );
                            })()}
                            {Boolean(paper.pdf_url || paper.file_url) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPdfPreview({
                                    url: (paper.pdf_url || paper.file_url)!,
                                    title: paper.paper_title,
                                  })
                                }
                                title="Preview PDF inline"
                                className="inline-flex items-center gap-1 rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors shadow-sm"
                              >
                                <ExternalLink size={11} />
                                <span>PDF</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedDossier(paper)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-[#0b0c10] shadow-sm active:scale-95"
                            >
                              <FileText size={12} />
                              <span>View PDF / Report</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
=======
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)
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
            <div className="space-y-6">
              {/* Top Overview: Weighted Criteria Scoring System */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">
                      Standardized Evaluation Matrix
                    </span>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-0.5">
                      Weighted Peer Review &amp; Scoring Calculator
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Innovation (25%) • Technical Quality (25%) • Methodology (20%) • Presentation (20%) • Impact (10%)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Weighted Score</span>
                      <p className="text-3xl font-bold font-display text-teal-600 dark:text-teal-400">
                        {computedEvaluationScore}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        computedEvaluationScore >= 75
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : computedEvaluationScore >= 60
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {computedEvaluationScore >= 75
                        ? "Recommendation: Accept"
                        : computedEvaluationScore >= 60
                          ? "Recommendation: Revision"
                          : "Recommendation: Reject"}
                    </span>
                  </div>
                </div>

                {/* Interactive Criteria Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 pt-5">
                  {[
                    { key: "innovation", label: "Innovation (25%)", weight: 0.25 },
                    { key: "technicalQuality", label: "Tech Quality (25%)", weight: 0.25 },
                    { key: "methodology", label: "Methodology (20%)", weight: 0.2 },
                    { key: "presentation", label: "Presentation (20%)", weight: 0.2 },
                    { key: "impact", label: "Impact (10%)", weight: 0.1 },
                  ].map((crit) => {
                    const val = (evaluationScores as any)[crit.key];
                    return (
                      <div key={crit.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{crit.label}</span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">{val}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) =>
                            setEvaluationScores((prev) => ({
                              ...prev,
                              [crit.key]: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-teal-500 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviewer Committee Directory */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Technical Review Committee
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Track reviewer assignments, double-blind progress, and peer evaluation completion
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    {reviewers.length} Active Reviewers
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviewers.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-2 hover:border-teal-500/40 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{rev.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{rev.email}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          ⭐ {rev.rating}
                        </span>
                      </div>

                      <p className="text-[11px] text-teal-700 dark:text-teal-300 truncate font-medium">
                        {rev.track}
                      </p>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 text-[11px]">
                          Assigned: <strong>{rev.assignedCount}</strong>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                          Done: {rev.completedCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: 📢 ANNOUNCEMENTS & DATES (Manager & Live Homepage Sync)
              ===================================================================== */}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Announcements Manager */}
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

                    <div className="flex items-center justify-between pt-1">
                      <select
                        value={newAnnouncement.category}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            category: e.target.value as Announcement["category"],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-xs font-semibold cursor-pointer"
                      >
                        <option value="General">General</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Deadline">Deadline</option>
                        <option value="Keynote">Keynote</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newAnnouncement.title.trim() || !newAnnouncement.body.trim()) {
                            alert("Please fill in title and body.");
                            return;
                          }
                          const item: Announcement = {
                            id: `ann-${Date.now()}`,
                            title: newAnnouncement.title.trim(),
                            body: newAnnouncement.body.trim(),
                            category: newAnnouncement.category,
                            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                            pinned: newAnnouncement.pinned,
                          };
                          setAnnouncements([item, ...announcements]);
                          setNewAnnouncement({ title: "", body: "", category: "General", pinned: false });
                          showToast("Announcement published successfully.");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Publish Announcement</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Published Announcements List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Active Announcements ({announcements.length})
                  </h4>
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-4 text-xs space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          {a.category} • {a.date}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnnouncements(announcements.filter((x) => x.id !== a.id))}
                          className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{a.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{a.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Important Dates Manager */}
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
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            Milestone 0{idx + 1}
                          </span>
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

                        <input
                          type="text"
                          value={d.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDatesList(datesList.map((x) => (x.id === d.id ? { ...x, label: val } : x)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-semibold text-slate-900 dark:text-white"
                        />

                        <input
                          type="text"
                          value={d.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDatesList(datesList.map((x) => (x.id === d.id ? { ...x, date: val } : x)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs text-slate-600 dark:text-slate-300 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast("Homepage dates schedule synchronized.")}
                    className="w-full py-2.5 rounded-xl bg-teal-600 text-white dark:bg-teal-500 dark:text-black text-xs font-semibold transition hover:opacity-90 active:scale-95 cursor-pointer"
                  >
                    Sync Dates Live to Conference Site
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: ⚙️ SETTINGS & SYSTEM (CSV/Excel Compendium, Certificates, Content)
              ===================================================================== */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Data Export & Reports */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Download size={18} className="text-teal-500" />
                    <span>Comprehensive Data Export</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Generate instant export compendiums for institutional indexing, IEEE proceedings, and conference secretariat records.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExportCSV(papers, "ncatex-all-papers-compendium.csv")}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1f2430] hover:border-teal-500/50 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-teal-500" />
                        <span>Export All Submitted Papers ({papers.length})</span>
                      </div>
                      <Download size={14} className="text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleExportCSV(
                          papers.filter((p) => p.status === "Accepted"),
                          "ncatex-accepted-for-proceedings.csv",
                        )
                      }
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1f2430] hover:border-teal-500/50 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <span>Export Accepted Papers for Proceedings ({metrics.accepted})</span>
                      </div>
                      <Download size={14} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Certificate Verification System */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck size={18} className="text-teal-500" />
                    <span>Certificate Management &amp; Verification</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatic verification ID generator for presentation and acceptance certificates.
                  </p>

                  <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-teal-800 dark:text-teal-300">
                        Verification ID Pattern:
                      </span>
                      <span className="font-mono text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded">
                        NCATEX-2026-CERT-XXXXX
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300/80">
                      Eligible accepted papers: {metrics.accepted}. Authors can verify authenticity directly through the public tracking portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Website Content Settings */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings size={18} className="text-teal-500" />
                    <span>Website Content &amp; Meta Settings</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hero Main Title:
                      </label>
                      <input
                        type="text"
                        value={contentConfig.heroTitle}
                        onChange={(e) => setContentConfig({ ...contentConfig, heroTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hero Subtitle:
                      </label>
                      <textarea
                        rows={2}
                        value={contentConfig.heroSubtitle}
                        onChange={(e) => setContentConfig({ ...contentConfig, heroSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Dates:
                        </label>
                        <input
                          type="text"
                          value={contentConfig.dates}
                          onChange={(e) => setContentConfig({ ...contentConfig, dates: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Venue:
                        </label>
                        <input
                          type="text"
                          value={contentConfig.venue}
                          onChange={(e) => setContentConfig({ ...contentConfig, venue: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast("Website content configuration updated.")}
                      className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      Save Website Content Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
                ) : triageMap[selectedDossier.id] ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-teal-900 dark:text-teal-200">
                          Overall Recommendation: {triageMap[selectedDossier.id].recommendation}
                        </span>
                        <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-teal-800 dark:text-teal-200">
                          Score: {triageMap[selectedDossier.id].overallScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-700 dark:text-teal-300/90 leading-relaxed">
                        {triageMap[selectedDossier.id].summary}
                      </p>
                    </div>

                    {/* Key Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 space-y-1.5">
                        <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                          Key Strengths
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-emerald-700 dark:text-emerald-300/90 text-[11px]">
                          {triageMap[selectedDossier.id].strengths?.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 space-y-1.5">
                        <h5 className="font-bold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                          Areas for Revision
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-rose-700 dark:text-rose-300/90 text-[11px]">
                          {triageMap[selectedDossier.id].weaknesses?.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
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
    </div>
  );
}

<<<<<<< HEAD
const SIDEBAR_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Participants", icon: Users },
  { label: "Paper Triage", icon: FileText },
  { label: "Reviewers", icon: UserCheck },
  { label: "Evaluation", icon: ClipboardCheck },
  { label: "Certificates", icon: Award },
  { label: "Settings", icon: Settings },
] as const;

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [active, setActive] = useState<string>("Paper Triage");
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#1f2430] bg-[#0b0d14] transition-[width] duration-300 md:flex ${
        collapsed ? "w-[72px]" : "w-60"
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-[#1f2430] px-4">
        {!collapsed && <span className="text-sm font-bold tracking-tight">NCATEX Admin</span>}
        <button type="button" onClick={onToggle} aria-label="Toggle sidebar" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {SIDEBAR_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={() => {
              setActive(label);
              if (label === "Paper Triage" || label === "Overview") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active === label ? "bg-teal-500/15 text-teal-300" : "text-slate-400 hover:bg-white/5 hover:text-white"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-[#1f2430] p-3">
        <Link to="/login" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={18} />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
=======
export default AdminControlCenter;
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)
