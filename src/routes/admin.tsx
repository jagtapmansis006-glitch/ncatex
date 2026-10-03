import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
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
  Mail,
  User,
  SlidersHorizontal,
  X,
  Layers,
  BookOpen,
  ArrowUpRight,
  Sparkles,
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
} from "lucide-react";
import { supabase, type PaperRecord } from "@/lib/supabase";
import { ThemeToggle } from "@/context/ThemeContext";
import { triageAdminSubmission } from "@/lib/ai-validation-client";
import type { AdminTriageResult } from "@/services/ai-validation/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "NCATEX 2026 – Academic Administration & Manuscript Review Portal" },
      {
        name: "description",
        content:
          "Official peer review and paper submissions administration portal for the 2nd National Conference on Advanced Trends in Engineering.",
      },
    ],
  }),
  component: AdminPortal,
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

function AdminPortal() {
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("All Tracks");

  // Interaction State
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<PaperRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Triage State for Admin Review
  const [triageMap, setTriageMap] = useState<Record<string, AdminTriageResult>>({});
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  // Scroll detection for header blur & elevation
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dropdown navigation state
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);

  // Fetch papers from Supabase
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

      // If active in dossier modal, update there too
      if (selectedDossier && selectedDossier.id === id) {
        setSelectedDossier((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      setJustUpdatedId(id);
      setTimeout(() => setJustUpdatedId(null), 2500);
    } catch (err: unknown) {
      alert(
        "Failed to update status in Supabase: " +
          (err instanceof Error ? err.message : String(err)),
      );
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
    if (triageMap[paperId]) {
      return;
    }

    let isMounted = true;
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

        if (isMounted && response.result) {
          setTriageMap((prev) => ({
            ...prev,
            [paperId]: response.result,
          }));
        }
      } catch (err) {
        if (isMounted) {
          setTriageError(
            err instanceof Error ? err.message : "Failed to load AI review triage assessment.",
          );
        }
      } finally {
        if (isMounted) {
          setTriageLoading(false);
        }
      }
    };

    fetchTriage();

    return () => {
      isMounted = false;
    };
  }, [selectedDossier?.id]);

  const handleRefreshTriage = async () => {
    if (!selectedDossier) return;
    const paperId = selectedDossier.id;
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

      if (response.result) {
        setTriageMap((prev) => ({
          ...prev,
          [paperId]: response.result,
        }));
      }
    } catch (err) {
      setTriageError(
        err instanceof Error ? err.message : "Failed to re-evaluate AI review triage.",
      );
    } finally {
      setTriageLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = papers.length;
    const underReview = papers.filter(
      (p) => p.status === "Under Review" || p.status === "Submitted",
    ).length;
    const accepted = papers.filter((p) => p.status === "Accepted").length;
    const revision = papers.filter(
      (p) => p.status === "Revision Required" || p.status === "Revision Needed",
    ).length;
    const rejected = papers.filter((p) => p.status === "Rejected").length;
    return { total, underReview, accepted, revision, rejected };
  }, [papers]);

  // Filtered papers list
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Status filter
      if (selectedStatusFilter === "UNDER_REVIEW") {
        if (paper.status !== "Under Review" && paper.status !== "Submitted") return false;
      } else if (selectedStatusFilter === "ACCEPTED") {
        if (paper.status !== "Accepted") return false;
      } else if (selectedStatusFilter === "REVISION") {
        if (paper.status !== "Revision Required" && paper.status !== "Revision Needed")
          return false;
      } else if (selectedStatusFilter === "REJECTED") {
        if (paper.status !== "Rejected") return false;
      }

      // Track filter
      if (selectedTrackFilter !== "All Tracks") {
        if (paper.track !== selectedTrackFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = paper.author_name.toLowerCase().includes(query);
        const matchesEmail = paper.author_email.toLowerCase().includes(query);
        const matchesTitle = paper.paper_title.toLowerCase().includes(query);
        const matchesId = paper.id.toLowerCase().includes(query);
        const matchesTrack = paper.track.toLowerCase().includes(query);
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
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
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

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
                    NCATEX 2026 Admin Portal
                  </h1>
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 border border-teal-500/20">
                    LIVE REVIEW
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-white/50 hidden sm:block">
                  Academic Submissions &amp; Peer Review System
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Portals Dropdown Menu */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                aria-expanded={portalMenuOpen}
              >
                <span>Navigation</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${portalMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {portalMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] p-1.5 shadow-xl backdrop-blur-md z-50 text-xs"
                    onClick={() => setPortalMenuOpen(false)}
                  >
                    <Link
                      to="/"
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <span>Public Landing</span>
                      <ArrowUpRight size={12} className="opacity-50" />
                    </Link>
                    <a
                      href="/#tracks"
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <span>Conference Tracks</span>
                      <ArrowUpRight size={12} className="opacity-50" />
                    </a>
                    <a
                      href="/#about"
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <span>About NCATEX</span>
                      <ArrowUpRight size={12} className="opacity-50" />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Supabase Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>Supabase Connected</span>
            </div>

            {/* Refresh Data Button */}
            <button
              type="button"
              onClick={() => fetchSubmissions(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white/90 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white active:scale-95 disabled:opacity-50"
              title="Reload from Supabase"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin text-teal-600 dark:text-teal-400" : ""}
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* Light / Dark Mode Toggle Switch */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Metric Cards Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {/* Total Submissions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-teal-500/5 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                  Total Submissions
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                  <Layers size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-display">
                  {metrics.total}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-white/50 font-medium">
                  manuscripts
                </span>
              </div>
            </motion.div>

            {/* Under Review */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
              className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.04] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-amber-500/5 hover:border-amber-300 dark:hover:border-amber-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300/80 uppercase tracking-wider">
                  Under Review
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-3xl font-display">
                  {metrics.underReview}
                </span>
                <span className="text-[11px] text-amber-600/70 dark:text-amber-300/60 font-medium">
                  pending
                </span>
              </div>
            </motion.div>

            {/* Accepted */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
              className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.04] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300/80 uppercase tracking-wider">
                  Accepted
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl font-display">
                  {metrics.accepted}
                </span>
                <span className="text-[11px] text-emerald-600/70 dark:text-emerald-300/60 font-medium">
                  approved
                </span>
              </div>
            </motion.div>

            {/* Rejected / Revisions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
              className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/[0.04] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-rose-500/5 hover:border-rose-300 dark:hover:border-rose-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300/80 uppercase tracking-wider">
                  Rejected / Rev.
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <XCircle size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 sm:text-3xl font-display">
                  {metrics.rejected + metrics.revision}
                </span>
                <span className="text-[11px] text-rose-600/70 dark:text-rose-300/60 font-medium">
                  {metrics.revision > 0 ? `${metrics.revision} rev.` : "closed"}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filter and Search Controls Toolbar */}
        <section className="mb-6 space-y-3.5 rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-4 sm:p-5 shadow-sm transition-colors duration-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, title, email, or UUID..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none transition-colors focus:border-teal-500 focus:bg-white dark:focus:border-teal-500/50 dark:focus:bg-white/[0.07] focus:ring-1 focus:ring-teal-500"
              />
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
            </div>
          )}

          {/* Table Footer info */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-3 sm:px-6 bg-slate-50/50 dark:bg-white/[0.01] text-[11px] text-slate-500 dark:text-white/50">
            <span>
              Showing {filteredPapers.length} of {papers.length} total paper records
            </span>
            <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Supabase Real-time Sync Active
            </span>
          </div>
        </section>
      </main>

      {/* =====================================================================
          VIEW PDF / REPORT ACTION MODAL (Full Manuscript Dossier)
          ===================================================================== */}
      <AnimatePresence>
        {selectedDossier && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDossier(null)}
          >
            <motion.div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-6 sm:p-8 shadow-2xl text-left text-slate-900 dark:text-white"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dossier Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-teal-700 dark:text-teal-400">
                      Peer Review Dossier
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-white/40">
                      ID: {selectedDossier.id}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl font-display">
                    {selectedDossier.paper_title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dossier Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 dark:border-white/10 text-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-white/70">
                    <User size={13} className="text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedDossier.author_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-white/70">
                    <Mail size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>{selectedDossier.author_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-white/70">
                    <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>{selectedDossier.department || "Engineering Research Division"}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-slate-600 dark:text-white/60">
                    <span className="text-slate-400 dark:text-white/40 mr-1.5 font-medium">
                      Conference Track:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white/90">
                      {selectedDossier.track}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-white/60">
                    <span className="text-slate-400 dark:text-white/40 mr-1.5 font-medium">
                      Submitted On:
                    </span>
                    <span className="font-mono">{formatDate(selectedDossier.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-white/40 font-medium">
                      Current Status:
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        selectedDossier.status === "Accepted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                          : selectedDossier.status === "Under Review" ||
                              selectedDossier.status === "Submitted"
                            ? "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                            : selectedDossier.status === "Revision Required" ||
                                selectedDossier.status === "Revision Needed"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40"
                              : "bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
                      }`}
                    >
                      {selectedDossier.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manuscript PDF Document Section */}
              <div className="py-5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60 flex items-center gap-1.5">
                    <FileText size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>Uploaded Manuscript PDF</span>
                  </h4>
                  {(selectedDossier.pdf_url || selectedDossier.file_url) ? (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Cloud Storage Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-amber-700 dark:text-amber-400">
                      File Unattached
                    </span>
                  )}
                </div>

                {(selectedDossier.pdf_url || selectedDossier.file_url) ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">Manuscript Draft Document</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 truncate font-mono">
                        {selectedDossier.pdf_url || selectedDossier.file_url}
                      </p>
                    </div>
                    <a
                      href={(selectedDossier.pdf_url || selectedDossier.file_url)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      <ExternalLink size={13} />
                      <span>Open / Download PDF</span>
                    </a>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] p-4 text-xs text-slate-500 dark:text-white/50 flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    <span>No PDF document was attached to this manuscript submission.</span>
                  </div>
                )}
              </div>

              {/* Abstract Section */}
              <div className="py-5 border-b border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-2.5">
                  Manuscript Abstract
                </h4>
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] p-4 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-white/80">
                  {selectedDossier.abstract}
                </div>
              </div>

              {/* AI Peer Review Triage & Quality Rubric Assessment */}
              {(() => {
                const activeDossierTriage = triageMap[selectedDossier.id];

                return (
                  <>
                    <div className="py-5 border-b border-slate-200 dark:border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                            <Sparkles size={13} />
                          </div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-white/80">
                            Technical Committee Evaluation & AI Rubric
                          </h4>
                        </div>

                        {activeDossierTriage && (
                          <button
                            type="button"
                            onClick={handleRefreshTriage}
                            disabled={triageLoading}
                            title="Re-run AI Analysis"
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={11} className={triageLoading ? "animate-spin" : ""} />
                            <span>{triageLoading ? "Analyzing..." : "Re-evaluate"}</span>
                          </button>
                        )}
                      </div>

                      {/* Loading State */}
                      {triageLoading && !activeDossierTriage && (
                        <div className="flex items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 text-xs text-teal-800 dark:text-teal-300">
                          <RefreshCw className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>Gemini AI is analyzing technical depth, originality, and methodology...</span>
                        </div>
                      )}

                      {/* Error State */}
                      {triageError && !activeDossierTriage && (
                        <div className="flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-300">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>{triageError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRefreshTriage}
                            className="px-2.5 py-1 text-[11px] font-semibold underline hover:no-underline"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Dynamic Rubric with AI Evaluation */}
                      {activeDossierTriage ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            {[
                              [
                                "Methodology & Validity",
                                `Score: ${activeDossierTriage.scores.methodologyRigor * 10}/100`,
                                activeDossierTriage.analysis.methodologicalEvaluation,
                              ],
                              [
                                "Technical Depth",
                                `Score: ${activeDossierTriage.scores.technicalDepth * 10}/100`,
                                activeDossierTriage.analysis.technicalDepthAssessment,
                              ],
                              [
                                "Content Quality",
                                `Score: ${activeDossierTriage.scores.contentQuality * 10}/100`,
                                activeDossierTriage.analysis.contentQualityAssessment,
                              ],
                              [
                                "Clarity & Organization",
                                `Score: ${activeDossierTriage.scores.clarityAndOrganization * 10}/100`,
                                activeDossierTriage.reviewerGuidance.justificationForAction,
                              ],
                            ].map(([title, scoreLabel, desc]) => (
                              <div
                                key={title}
                                className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.01] p-3"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0"
                                />
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{title}</p>
                                    <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">{scoreLabel}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-white/50 leading-relaxed">{desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Key Strengths & Revisions Needed */}
                          {(activeDossierTriage.analysis.strengths?.length > 0 ||
                            activeDossierTriage.analysis.weaknesses?.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                              {activeDossierTriage.analysis.strengths?.length > 0 && (
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-3 space-y-1">
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 size={11} className="text-emerald-500" />
                                    Key Strengths
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-white/70">
                                    {activeDossierTriage.analysis.strengths.slice(0, 2).map((s: string, i: number) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {activeDossierTriage.analysis.weaknesses?.length > 0 && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-3 space-y-1">
                                  <span className="font-semibold text-amber-800 dark:text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                    <AlertCircle size={11} className="text-amber-500" />
                                    Observations / Revisions Needed
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-white/70">
                                    {activeDossierTriage.analysis.weaknesses.slice(0, 2).map((w: string, i: number) => (
                                      <li key={i}>{w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Baseline Evaluation Rubric */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {[
                            ["Methodology & Validity", "Meets standard of empirical reproducibility"],
                            ["Technical Depth", "Novel algorithmic and hardware architectures present"],
                            ["Formatting Standards", "Strict compliance with IEEE 6-page double column"],
                            [
                              "Plagiarism & Originality",
                              "Original scholarly contribution (< 10% similarity)",
                            ],
                          ].map(([title, desc]) => (
                            <div
                              key={title}
                              className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.01] p-3"
                            >
                              <CheckCircle2
                                size={14}
                                className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-white/50">{desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Review & Triage Assessment Bar alongside Decision Controls */}
                    <div className="pt-5 space-y-4">
                      {/* AI Executive Summary, Condition, and Score Card */}
                      {activeDossierTriage && (
                        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/[0.03] dark:bg-teal-500/[0.04] p-4 text-xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/10 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                AI Triage Assessment:
                              </span>

                              {/* Condition Badge (EXCELLENT, ACCEPTABLE, NEEDS_REVISION, POOR) */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                                  activeDossierTriage.condition === "EXCELLENT"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                                    : activeDossierTriage.condition === "ACCEPTABLE"
                                      ? "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40"
                                      : activeDossierTriage.condition === "NEEDS_REVISION"
                                        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                                        : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
                                }`}
                              >
                                Condition: {activeDossierTriage.condition.replace("_", " ")}
                              </span>

                              {/* Overall Score */}
                              <span className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:text-white">
                                Overall Score: {activeDossierTriage.scores.overallAssessmentScore}/100
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400 dark:text-white/40">Recommendation:</span>
                              <span className="font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                                {activeDossierTriage.recommendedAction === "APPROVE"
                                  ? "Approve (Accept)"
                                  : activeDossierTriage.recommendedAction === "REQUEST_CHANGES"
                                    ? "Request Revisions"
                                    : "Reject Manuscript"}
                              </span>
                            </div>
                          </div>

                          {/* Executive Summary */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">
                              Executive Summary
                            </span>
                            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                              {activeDossierTriage.executiveSummary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Quick Decision Status Switcher & PDF Print */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                          <span className="text-xs text-slate-500 dark:text-white/60 mr-1 font-medium">
                            Set Decision:
                          </span>
                          {(["Under Review", "Accepted", "Revision Required", "Rejected"] as const).map(
                            (st) => {
                              const isRecommended =
                                (activeDossierTriage?.recommendedAction === "APPROVE" && st === "Accepted") ||
                                (activeDossierTriage?.recommendedAction === "REQUEST_CHANGES" &&
                                  st === "Revision Required") ||
                                (activeDossierTriage?.recommendedAction === "REJECT" && st === "Rejected");
                              const isSelected = selectedDossier.status === st;

                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateStatus(selectedDossier.id, st)}
                                  className={`relative rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                                    isSelected
                                      ? "bg-teal-600 text-white dark:bg-white dark:text-black font-semibold shadow"
                                      : isRecommended
                                        ? "border border-teal-500/70 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold"
                                        : "border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                                  }`}
                                >
                                  <span>{st === "Accepted" ? "Approve (Accept)" : st}</span>
                                  {isRecommended && !isSelected && (
                                    <span className="ml-1 text-[9px] font-mono text-teal-600 dark:text-teal-400">
                                      (AI Pick)
                                    </span>
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                          >
                            <Printer size={13} />
                            <span>Print Dossier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDossier(null)}
                            className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-4 py-1.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white/90 shadow transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
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
