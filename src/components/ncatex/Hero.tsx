import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Play,
  Pause,
} from "lucide-react";
import { SubmitModal, TrackModal } from "../common/Panels";
import { useAnnouncements } from "@/context/AnnouncementsContext";

export { Navbar, Navbar as Header, type NavbarProps, type NavbarProps as HeaderProps } from "../common/Navbar";

export interface HeroProps {
  onSubmit?: (() => void) | undefined;
  onTrack?: ((initialQuery?: string) => void) | undefined;
  onAdmin?: (() => void) | undefined;
  onOpenSubmit?: ((track?: string) => void) | undefined;
  onOpenTrack?: ((initialQuery?: string) => void) | undefined;
  isSubmitModalOpen?: boolean | undefined;
  setIsSubmitModalOpen?: ((open: boolean) => void) | undefined;
  isTrackModalOpen?: boolean | undefined;
  setIsTrackModalOpen?: ((open: boolean) => void) | undefined;
  activeModal?: "submit" | "track" | null | undefined;
  onModalChange?: ((modal: "submit" | "track" | null) => void) | undefined;
  prefilledTrack?: string | undefined;
}

export function Hero({
  onSubmit,
  onTrack,
  onOpenSubmit,
  onOpenTrack,
  isSubmitModalOpen,
  setIsSubmitModalOpen,
  isTrackModalOpen,
  setIsTrackModalOpen,
  activeModal,
  onModalChange,
  prefilledTrack,
}: HeroProps) {
  const [internalModal, setInternalModal] = useState<null | "submit" | "track">(null);
  const modal = activeModal !== undefined ? activeModal : internalModal;
  const setModal = (m: null | "submit" | "track") => {
    if (onModalChange) onModalChange(m);
    setInternalModal(m);
  };

  // Video Ref & Play/Pause State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleSubmitOpen = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (setIsSubmitModalOpen) setIsSubmitModalOpen(true);
    if (onOpenSubmit) onOpenSubmit(prefilledTrack);
    if (onSubmit) onSubmit();
    setModal("submit");
  };

  const handleTrackOpen = (initialQuery?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (setIsTrackModalOpen) setIsTrackModalOpen(true);
    if (onOpenTrack) onOpenTrack(initialQuery);
    if (onTrack) onTrack(initialQuery);
    setModal("track");
  };

  // Close internal modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  let announcementsList: any[] = [];
  try {
    const annContext = useAnnouncements();
    announcementsList = annContext.announcements || [];
  } catch {
    // Fallback for tests rendering outside provider
  }
  const latestAnnouncement = announcementsList.find((a) => a.pinned) || announcementsList[0];

  return (
    <section
      id="top"
      className="w-full pt-28 md:pt-36 pb-12 px-4 max-w-6xl mx-auto flex flex-col items-center text-center relative z-10"
    >
      {/* Background ambient lighting glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent blur-3xl opacity-70 dark:opacity-40 -z-10" />

      {/* 1. Main Headline: NCATEX */}
      <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent drop-shadow-md select-none mb-4">
        NCATEX
      </h1>

      {/* 2. Subtitle */}
      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
        National Conference on Advanced Trends in Electronics and Telecommunication Engineering
      </p>

      {/* 4. Button Row */}
      <div className="flex gap-4 mb-8 flex-wrap items-center justify-center">
        <button
          type="button"
          id="hero-submit-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setIsSubmitModalOpen) setIsSubmitModalOpen(true);
            handleSubmitOpen(e);
          }}
          className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-base font-medium shadow-md hover:shadow-lg transition-all bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:shadow-teal-500/20 active:scale-95 cursor-pointer"
        >
          <span>Submit Paper</span>
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          id="hero-track-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setIsTrackModalOpen) setIsTrackModalOpen(true);
            handleTrackOpen(undefined, e);
          }}
          className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-base font-medium border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm hover:bg-slate-100 dark:hover:bg-white/20 hover:shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <FileText size={16} />
          <span>Track Paper</span>
        </button>
      </div>

      {/* 5. Video Card */}
      <div className="max-w-4xl w-full aspect-video rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200/80 dark:border-slate-800 bg-[#090D16]">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl"
        >
          <source src="/assets/circuit-hero.mp4" type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>

        {/* Subtle dark gradient overlay so the video blends seamlessly into our dark theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d]/80 via-transparent to-[#08090d]/20 pointer-events-none rounded-2xl" />

        {/* Bottom Video Badge & Play/Pause controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto text-white text-xs">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 max-w-[80%]">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="font-mono text-[11px] font-medium text-slate-200 truncate">
              {latestAnnouncement ? `LIVE NOTICE: [${latestAnnouncement.tag || latestAnnouncement.category}] ${latestAnnouncement.title}` : "NCATEX High-Tech Circuit Stream"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVideoPlayback}
              className="grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-black/80 transition-colors cursor-pointer"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Local fallback modal overlays when used in standalone mode */}
      {isSubmitModalOpen === undefined && (
        <AnimatePresence>
          {modal === "submit" && (
            <SubmitModal
              isOpen={true}
              onClose={() => setModal(null)}
              onTrack={(id) => handleTrackOpen(id)}
              initialTrack={prefilledTrack}
            />
          )}
        </AnimatePresence>
      )}

      {isTrackModalOpen === undefined && (
        <AnimatePresence>
          {modal === "track" && (
            <TrackModal
              isOpen={true}
              onClose={() => setModal(null)}
            />
          )}
        </AnimatePresence>
      )}
    </section>
  );
}

export default Hero;
