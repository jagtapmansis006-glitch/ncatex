<<<<<<< HEAD
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowRight,
  FileText,
  Search,
  CheckCircle2,
  X,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Building2,
  Mail,
  User,
  BookOpen,
  Sparkles,
  ChevronDown,
  Play,
  Pause,
  ExternalLink,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { supabase, type PaperRecord } from "@/lib/supabase";
import { ThemeToggle } from "@/context/ThemeContext";
import { SubmitModal } from "./Panels";

const EASE = [0.16, 1, 0.3, 1] as const;

// Asset pointer per user rule: Keep the hero video as a project asset pointer to a browser-compatible WebM
const HERO_WEBM_URL = "/__l5e/assets-v1/a071327a-b845-430f-8fb1-161572ce64a4/ncatex-hero-web.webm";
const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4";

const TRACK_OPTIONS = [
  "Artificial Intelligence & Machine Learning",
  "VLSI & Embedded Systems",
  "5G & Next-Gen Wireless Communications",
  "Internet of Things (IoT) & Smart Sensors",
  "Digital Signal & Image Processing",
  "Robotics & Autonomous Systems",
];

const TRACK_ITEMS = [
  { id: "01", name: "AI/ML", fullName: "Artificial Intelligence & Machine Learning" },
  { id: "02", name: "VLSI", fullName: "VLSI & Embedded Systems" },
  { id: "03", name: "5G Comms", fullName: "5G & Next-Gen Wireless Communications" },
  { id: "04", name: "IoT", fullName: "Internet of Things (IoT) & Smart Sensors" },
  { id: "05", name: "Signal DSP", fullName: "Digital Signal & Image Processing" },
];

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none" className="shrink-0">
      <rect
        x="3"
        y="8"
        width="11"
        height="6"
        rx="3"
        className="fill-teal-600 dark:fill-white"
        transform="rotate(-35 8.5 11)"
      />
      <rect
        x="10"
        y="10"
        width="11"
        height="6"
        rx="3"
        className="fill-teal-500 dark:fill-white"
        transform="rotate(-35 15.5 13)"
      />
    </svg>
  );
}

function StatusChip({ status }: { status: string }) {
  const norm = (status || "Under Review").toLowerCase();
  if (norm.includes("accept")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300">
        <CheckCircle2 size={12} /> Accepted
      </span>
    );
  }
  if (norm.includes("revision")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300">
        <Clock size={12} /> Revision Needed
      </span>
    );
  }
  if (norm.includes("reject")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300">
        <AlertCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300">
      <Clock size={12} /> Under Review
    </span>
  );
}

export interface HeaderProps {
  onSubmit?: (() => void) | undefined;
  onTrack?: (() => void) | undefined;
  onAdmin?: (() => void) | undefined;
}

export interface HeroProps {
  onSubmit?: (() => void) | undefined;
  onTrack?: (() => void) | undefined;
  onAdmin?: (() => void) | undefined;
  activeModal?: "submit" | "track" | null | undefined;
  onModalChange?: ((modal: "submit" | "track" | null) => void) | undefined;
  prefilledTrack?: string | undefined;
  modalsOnly?: boolean | undefined;
}

export function Header({ onSubmit, onTrack }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [tracksDropdownOpen, setTracksDropdownOpen] = useState(false);
  const [portalsDropdownOpen, setPortalsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
        isScrolled
          ? "bg-white/85 dark:bg-[#090D16]/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/20"
          : "bg-white/60 dark:bg-[#090D16]/60 border-b border-slate-200/40 dark:border-slate-800/40"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left side: Logo & Navigation */}
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold text-sm sm:text-base tracking-tight hover:opacity-90 transition-opacity"
          >
            <Logo />
            <span className="font-display font-bold tracking-tight">NCATEX 2026</span>
          </a>

          {/* Interactive Tracks Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTracksDropdownOpen(!tracksDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white shadow-sm transition-all hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95"
              aria-expanded={tracksDropdownOpen}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black">
                <Plus size={10} strokeWidth={3} />
              </span>
              <span>Tracks</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${tracksDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {tracksDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-64 origin-top-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] p-2 shadow-xl backdrop-blur-xl z-50 text-xs"
                  onClick={() => setTracksDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Conference Tracks
                  </div>
                  {TRACK_ITEMS.map((t) => (
                    <a
                      key={t.id}
                      href="#tracks"
                      className="flex items-center justify-between rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                          {t.id}
                        </span>
                        <span className="font-medium">{t.name}</span>
                      </div>
                      <ArrowUpRight size={12} className="opacity-40" />
                    </a>
                  ))}
                  <div className="mt-1 border-t border-slate-100 dark:border-white/5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSubmit?.()}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 text-white py-2 text-xs font-semibold hover:opacity-95 transition-opacity"
                    >
                      <span>Submit to Track</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-white/70">
            <span>Electronics</span>
            <span className="opacity-30">•</span>
            <span>Telecommunication</span>
            <span className="opacity-30">•</span>
            <span>Autonomous Systems</span>
          </div>
        </div>

        {/* Right side: Portals Navigation & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Portals Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPortalsDropdownOpen(!portalsDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white shadow-sm transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
            >
              <span>Portals</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${portalsDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {portalsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] p-2 shadow-xl backdrop-blur-xl z-50 text-xs"
                  onClick={() => setPortalsDropdownOpen(false)}
                >
                  <a
                    href="#top"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <span>Conference Home</span>
                    <ArrowUpRight size={12} className="opacity-40" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onTrack?.()}
                    className="w-full text-left flex items-center justify-between rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <span>Track Manuscript</span>
                    <Search size={12} className="opacity-40" />
                  </button>
                  <a
                    href="/admin"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20"
                  >
                    <span>Academic Admin Portal</span>
                    <ArrowUpRight size={12} />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Academic Admin Portal Link Button */}
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            aria-label="Open Academic Portal"
          >
            <BookOpen size={13} />
            <span className="hidden sm:inline">Academic Portal</span>
          </a>

          {/* Sun / Moon Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}

export function Hero({ onSubmit, onTrack, activeModal, onModalChange, prefilledTrack, modalsOnly }: HeroProps) {
  const [internalModal, setInternalModal] = useState<null | "submit" | "track">(null);
  const modal = activeModal !== undefined ? activeModal : internalModal;
  const setModal = (m: null | "submit" | "track") => {
    if (onModalChange) onModalChange(m);
    setInternalModal(m);
  };

  // Video Ref & Scrub State per Requirement 4 and User Rule
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Submit Modal State
  const [submitForm, setSubmitForm] = useState({
    authorName: "",
    authorEmail: "",
    department: "",
    track: TRACK_OPTIONS[0],
    paperTitle: "",
    abstract: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<PaperRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync prefilledTrack
  useEffect(() => {
    if (prefilledTrack) {
      setSubmitForm((prev) => ({ ...prev, track: prefilledTrack }));
    }
  }, [prefilledTrack]);

  // Track Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedPapers, setTrackedPapers] = useState<PaperRecord[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmitOpen = () => {
    if (onSubmit) onSubmit();
    setSubmitSuccess(null);
    setSubmitError(null);
    setModal("submit");
  };

  const handleTrackOpen = (initialQuery?: string) => {
    if (onTrack) onTrack();
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
    setModal("track");
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Submit Paper to Supabase
  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase
        .from("papers")
        .insert([
          {
            author_name: submitForm.authorName.trim(),
            author_email: submitForm.authorEmail.trim().toLowerCase(),
            department: submitForm.department.trim(),
            track: submitForm.track,
            paper_title: submitForm.paperTitle.trim(),
            abstract: submitForm.abstract.trim(),
            status: "Under Review",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setSubmitSuccess(data as PaperRecord);
      setSubmitForm({
        authorName: "",
        authorEmail: "",
        department: "",
        track: TRACK_OPTIONS[0],
        paperTitle: "",
        abstract: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit paper to Supabase.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Track Paper Query
  const performSearch = async (queryText: string) => {
    const term = queryText.trim();
    if (!term) return;
    setTrackingLoading(true);
    setHasSearched(true);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
      let builder = supabase.from("papers").select("*");

      if (isUuid) {
        builder = builder.eq("id", term);
      } else if (term.includes("@")) {
        builder = builder.ilike("author_email", term.toLowerCase());
      } else {
        builder = builder.or(`paper_title.ilike.%${term}%,author_name.ilike.%${term}%`);
      }

      const { data, error } = await builder.order("created_at", { ascending: false });
      if (error) throw error;
      setTrackedPapers((data as PaperRecord[]) || []);
    } catch {
      setTrackedPapers([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Interactive mouse scrub for video per rule
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    video.currentTime = percent * video.duration;
  };

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section id={modalsOnly ? undefined : "top"} className={modalsOnly ? "contents" : "relative pt-8 pb-20 md:pt-14 md:pb-28 overflow-hidden"}>
      {!modalsOnly && (<>
      {/* Background ambient lighting glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent blur-3xl opacity-70 dark:opacity-40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* =========================================================================
            Requirement 4: Centered Visual Hero & Animation Section
            ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Symmetrically aligned academic badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 dark:bg-teal-500/15 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 shadow-sm mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>National Level Research &amp; Scholarly Presentation • NCATEX 2026</span>
          </motion.div>

          {/* Symmetrically aligned main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-slate-900 dark:text-white font-display leading-[1.08] mb-6"
          >
            2nd National Conference
            <br />
            <span className="font-semibold text-slate-900 dark:text-white">
              Advanced Trends in Engineering.
            </span>
          </motion.h1>

          {/* Symmetrically aligned subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-8 font-sans"
          >
            A premier peer-reviewed scholarly forum convening academic researchers, engineering
            faculties, and industry pioneers to present groundbreaking advancements in emerging
            technologies.
          </motion.p>

          {/* Symmetrically aligned Call-to-Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="flex items-center justify-center gap-4 flex-wrap mb-12 sm:mb-16"
          >
            <button
              type="button"
              onClick={handleSubmitOpen}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-7 py-3 text-sm font-semibold shadow-lg hover:shadow-xl hover:opacity-95 active:scale-95 transition-all"
            >
              <span>Submit Paper</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleTrackOpen()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 px-7 py-3 text-sm font-semibold text-slate-800 dark:text-white shadow-sm hover:bg-slate-100 dark:hover:bg-white/20 active:scale-95 transition-all"
            >
              <FileText size={15} />
              <span>Track Paper</span>
            </button>
          </motion.div>

          {/* Centered Main Video Player Framed in Sleek Container per Requirement 4 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
            className="w-full relative group"
            onMouseMove={handleMouseMove}
          >
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 aspect-video max-w-4xl mx-auto ring-1 ring-slate-900/5 dark:ring-white/10">
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/hero-poster.jpg"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback quietly to secondary source or poster without failing UI
                  const target = e.currentTarget;
                  if (target && !target.src && HERO_VIDEO_URL) {
                    target.src = HERO_VIDEO_URL;
                    target.load();
                  }
                }}
              >
                {/* Reliable primary video stream */}
                <source src={HERO_VIDEO_URL} type="video/mp4" />
                <source src="/hero-video.mp4" type="video/mp4" />
                {/* Project asset pointer to browser-compatible WebM per rule */}
                <source src={HERO_WEBM_URL} type="video/webm" />
              </video>

              {/* Subtle glass gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Bottom Video Badge & Play/Pause controls */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-auto text-white text-xs">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-medium">
                    NCATEX Technical Sessions Reel
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-black/80 transition-colors"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      </>)}
      {/* =====================================================================
          SUBMIT PAPER MODAL (Integrated with Supabase)
          ===================================================================== */}
      <AnimatePresence>
        {modal === "submit" && (
          <SubmitModal
            onClose={() => setModal(null)}
            onTrack={(id) => handleTrackOpen(id)}
            initialTrack={prefilledTrack || submitForm.track}
          />
        )}
      </AnimatePresence>

      {/* =====================================================================
          TRACK PAPER MODAL (Query Supabase)
          ===================================================================== */}
      <AnimatePresence>
        {modal === "track" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] p-6 sm:p-8 shadow-2xl text-left text-slate-900 dark:text-white"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <h3 className="text-xl font-bold tracking-tight font-display flex items-center gap-2 text-slate-900 dark:text-white">
                  <Search size={20} className="text-teal-600 dark:text-teal-400" />
                  <span>Track Submission Status</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  performSearch(searchQuery);
                }}
                className="mb-6"
              >
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Search by Tracking ID or Author Email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. author@univ.edu or paper UUID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none focus:border-teal-500 focus:bg-white dark:focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-5 py-2.5 text-xs font-semibold hover:opacity-95 disabled:opacity-50 shrink-0"
                  >
                    {trackingLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>Lookup</span>
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {trackingLoading ? (
                <div className="text-center py-10 text-slate-500 dark:text-white/60">
                  <Loader2
                    size={24}
                    className="animate-spin mx-auto mb-2 text-teal-600 dark:text-teal-400"
                  />
                  <p className="text-sm font-medium">Querying Supabase database...</p>
                </div>
              ) : hasSearched && trackedPapers && trackedPapers.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Found {trackedPapers.length} matching scholarly submission
                    {trackedPapers.length > 1 ? "s" : ""}:
                  </p>
                  {trackedPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-white/[0.03] p-4 text-xs"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                            {paper.track}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                            {paper.paper_title}
                          </h4>
                        </div>
                        <StatusChip status={paper.status} />
                      </div>

                      <div className="text-slate-600 dark:text-slate-400 mb-2">
                        <strong className="text-slate-800 dark:text-slate-200">
                          {paper.author_name}
                        </strong>{" "}
                        • {paper.department}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3 line-clamp-3">
                        {paper.abstract}
                      </p>

                      <div className="flex justify-between items-center border-t border-slate-200/80 dark:border-white/10 pt-2.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paper.id)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                        >
                          {copiedId === paper.id ? (
                            <Check size={11} className="text-teal-600 dark:text-teal-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                          <span>ID: {paper.id.slice(0, 13)}...</span>
                        </button>
                        <span className="text-[11px] text-slate-400 dark:text-white/40 font-mono">
                          {new Date(paper.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasSearched && (!trackedPapers || trackedPapers.length === 0) ? (
                <div className="text-center py-10 text-slate-500 dark:text-white/60">
                  <AlertCircle size={32} className="mx-auto mb-2 text-rose-500 opacity-60" />
                  <h5 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    No Records Found
                  </h5>
                  <p className="text-xs">
                    No papers matched "{searchQuery}". Please verify the email or paper identifier.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-white/40">
                  <Search size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">
                    Enter your registration email or paper UUID above to track peer review status.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Hero;
=======
export * from "../hero/Hero";
export { default } from "../hero/Hero";
>>>>>>> 6ecf61d (Refactor landing hero layout, update video asset, add logo, and clean code)
