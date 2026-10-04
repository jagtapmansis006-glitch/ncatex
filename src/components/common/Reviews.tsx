import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Award } from "lucide-react";

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  institution: string;
  avatarInitials: string;
  track: string;
  rating: number;
  quote: string;
  highlight: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Dr. Rajesh Sharma",
    role: "Professor & TPC Member",
    institution: "Indian Institute of Technology Delhi",
    avatarInitials: "RS",
    track: "VLSI & Embedded Systems",
    rating: 5,
    quote:
      "The peer review feedback at NCATEX was remarkably thorough and prompt. The double-blind evaluation gave our research scholars invaluable academic rigor, and the presentation sessions were impeccably organized.",
    highlight: "Exceptional Double-Blind Peer Review",
  },
  {
    id: "rev-2",
    name: "Dr. Elena Rostova",
    role: "Senior Principal Scientist & IEEE Fellow",
    institution: "International Wireless Lab",
    avatarInitials: "ER",
    track: "5G & Next-Gen Wireless",
    rating: 5,
    quote:
      "An outstanding forum for 5G beamforming, mmWave communication, and hardware security. The technical committee ensured only reproducible, high-caliber manuscripts made it to the final proceedings.",
    highlight: "Top-Tier Scientific Integrity",
  },
  {
    id: "rev-3",
    name: "Priya Nair",
    role: "Doctoral Scholar",
    institution: "Centre for AI & Robotics",
    avatarInitials: "PN",
    track: "AI & Machine Learning",
    rating: 5,
    quote:
      "The instant AI formatting pre-audit in the portal saved us multiple revisions before submission. Our paper on edge inference was accepted and indexed directly into the official conference proceedings.",
    highlight: "Seamless Pre-Audit & Fast Turnaround",
  },
  {
    id: "rev-4",
    name: "Dr. Marcus Vance",
    role: "Director of Systems R&D",
    institution: "Qualcomm Research",
    avatarInitials: "MV",
    track: "IoT & Smart Sensors",
    rating: 5,
    quote:
      "The industrial applicability of papers presented at NCATEX is unmatched. It bridges the gap between doctoral theoretical models and commercial silicon deployment.",
    highlight: "Bridging Academia & Industry",
  },
  {
    id: "rev-5",
    name: "Dr. Ananya Roy",
    role: "Associate Professor",
    institution: "National Institute of Technology",
    avatarInitials: "AR",
    track: "Signal & Image Processing",
    rating: 5,
    quote:
      "The hybrid technical sessions allowed our international collaborators to interact seamlessly. A truly world-class conference experience with transparent tracking from submission to acceptance.",
    highlight: "Flawless Hybrid Session Delivery",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function Reviews() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const totalCards = REVIEWS.length;

  const nextReview = () => {
    setActiveTab((prev) => (prev + 1) % totalCards);
  };

  const prevReview = () => {
    setActiveTab((prev) => (prev - 1 + totalCards) % totalCards);
  };

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 sm:px-6 py-24 scroll-mt-20">
      {/* Section Header with Minimal Micro-Interaction */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14 text-center max-w-2xl mx-auto"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          <Award size={13} className="text-teal-600 dark:text-teal-400" />
          Author &amp; Reviewer Community
        </span>
        <h2 className="mt-3.5 text-4xl font-light tracking-tight text-slate-900 dark:text-white font-display md:text-5xl">
          Academic <span className="font-semibold text-slate-900 dark:text-white">Endorsements</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Read candid perspectives from researchers, session chairs, and doctoral candidates who
          have presented original contributions at NCATEX.
        </p>
      </motion.div>

      {/* Grid of Reviews with Staggered Entrance Animations & Anti-Gravity Hover */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10"
      >
        {REVIEWS.slice(0, 3).map((rev) => (
          <motion.div
            key={rev.id}
            variants={cardVariants}
            className="card-antigravity group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-7 shadow-sm cursor-default"
          >
            {/* Top row: Track chip & Star rating */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                  {rev.track}
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={13} className="fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Quote text with clean vertical line-height */}
              <div className="relative mb-5">
                <Quote
                  size={20}
                  className="text-teal-500/30 mb-2 rotate-180 transition-transform duration-300 group-hover:scale-110"
                />
                <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-display mb-1.5">
                  &ldquo;{rev.highlight}&rdquo;
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-[1.6]">
                  {rev.quote}
                </p>
              </div>
            </div>

            {/* Author info footer */}
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider shrink-0 border border-slate-200 dark:border-white/10">
                {rev.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {rev.name}
                  </h5>
                  <ShieldCheck size={14} className="text-teal-500 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {rev.role} • {rev.institution}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Featured Swipe / Carousel Interactive Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-slate-50/70 dark:bg-[#0c0e15] p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Interactive Testimonial Carousel
            </span>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevReview}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Previous review"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextReview}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Next review"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Animated Carousel Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={REVIEWS[activeTab]!.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="max-w-2xl">
              <span className="inline-block rounded-md bg-teal-500/10 dark:bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:text-teal-300 mb-2">
                {REVIEWS[activeTab]!.track}
              </span>
              <p className="text-base sm:text-lg italic text-slate-800 dark:text-slate-200 leading-[1.6]">
                &ldquo;{REVIEWS[activeTab]!.quote}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-600 text-white font-bold text-sm shadow-md">
                {REVIEWS[activeTab]!.avatarInitials}
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  {REVIEWS[activeTab]!.name}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {REVIEWS[activeTab]!.role}
                </p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  {REVIEWS[activeTab]!.institution}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {REVIEWS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeTab === idx ? "w-6 bg-teal-500" : "w-1.5 bg-slate-300 dark:bg-white/20"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Reviews;
