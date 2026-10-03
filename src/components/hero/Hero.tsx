import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Play,
  Pause,
} from "lucide-react";
import { SubmitModal, TrackModal } from "../common/Panels";

const EASE = [0.16, 1, 0.3, 1] as const;

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

  return (
    <section id="top" className="relative pt-8 pb-20 md:pt-14 md:pb-28 overflow-hidden">
      {/* Background ambient lighting glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent blur-3xl opacity-70 dark:opacity-40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* 1. Date/Venue Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 dark:bg-teal-500/15 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 shadow-sm mb-5"
          >
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>April 10–11, 2026 • Hybrid Sessions</span>
          </motion.div>

          {/* 2. Main Title: NCATEX 2026 (Large, bold, gradient text styling) */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight font-display leading-[0.95] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-teal-700 to-slate-800 dark:from-white dark:via-teal-200 dark:to-slate-300 selection:bg-teal-500/30 drop-shadow-sm"
          >
            NCATEX 2026
          </motion.h1>

          {/* 3. Subtitle (Clean subtext, max-w-2xl mx-auto) */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
            className="text-base sm:text-lg md:text-xl font-normal text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-2 font-sans"
          >
            National Conference on Advanced Trends in Electronics and Telecommunication Engineering
          </motion.p>

          {/* Symmetrically aligned Call-to-Actions with Balanced Vertical Spacing */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
            className="flex items-center justify-center gap-4 flex-wrap my-6"
          >
            <button
              type="button"
              id="hero-submit-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (setIsSubmitModalOpen) setIsSubmitModalOpen(true);
                handleSubmitOpen(e);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-7 py-3 text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>Submit Paper</span>
              <ArrowRight size={15} />
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
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 px-7 py-3 text-sm font-semibold text-slate-800 dark:text-white shadow-sm hover:bg-slate-100 dark:hover:bg-white/20 hover:shadow-md hover:shadow-slate-500/10 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FileText size={15} />
              <span>Track Paper</span>
            </button>
          </motion.div>

          {/* High-Tech Circuit Video Player Framed in 16:9 Responsive Frame with Max Height Limit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
            className="w-full relative group mt-2"
          >
            <div className="relative aspect-video w-full max-w-4xl max-h-[360px] md:max-h-[420px] mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090D16] ring-1 ring-teal-500/20 shadow-[0_0_50px_-12px_rgba(20,184,166,0.25)]">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="object-cover w-full h-full"
              >
                <source src="/assets/circuit-hero.mp4" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>

              {/* Subtle dark gradient overlay so the video blends seamlessly into our dark theme */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090d]/80 via-transparent to-[#08090d]/30 pointer-events-none" />

              {/* Bottom Video Badge & Play/Pause controls */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-auto text-white text-xs">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-medium text-slate-200">
                    NCATEX High-Tech Circuit Stream
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
          </motion.div>
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
