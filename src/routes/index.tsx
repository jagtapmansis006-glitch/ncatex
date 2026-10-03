import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  FileCheck,
  Clock,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { Hero } from "@/components/hero/Hero";
import { Tracks } from "@/components/common/Tracks";
import { SubmitModal, TrackModal } from "@/components/common/Panels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NCATEX 2026 – 2nd National Conference on Advanced Trends in Engineering" },
      {
        name: "description",
        content:
          "2nd National Conference on Advanced Trends in Engineering (NCATEX 2026). Peer-reviewed scholarly paper submissions across AI/ML, VLSI, 5G, IoT, and Signal Processing.",
      },
      { property: "og:title", content: "NCATEX 2026 – Advanced Trends in Engineering" },
      {
        name: "og:description",
        content: "Peer-reviewed academic conference submissions across 5 major engineering tracks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const QUICK_INFO_ITEMS = [
  {
    icon: Calendar,
    label: "Date",
    value: "April 10–11, 2026",
    detail: "Hybrid Technical Sessions",
  },
  {
    icon: MapPin,
    label: "Venue",
    value: "NCATEX Campus / Hybrid",
    detail: "Main Auditorium & Online",
  },
  {
    icon: GraduationCap,
    label: "Eligibility",
    value: "UG / PG / PhD & Faculty",
    detail: "Scholars & Corporate R&D",
  },
  {
    icon: Award,
    label: "Awards",
    value: "Best Paper Awards",
    detail: "Cash Prizes & Medals",
  },
  {
    icon: FileCheck,
    label: "Registration",
    value: "Indexed Proceedings",
    detail: "IEEE & Scopus Standards",
  },
];

const TIMELINE_MILESTONES = [
  {
    id: "m1",
    date: "Jan 15, 2026",
    title: "Call for Papers Opens",
    description: "Official submission portal initialized across all 5 conference research tracks.",
    status: "COMPLETED",
    badge: "Completed",
  },
  {
    id: "m2",
    date: "Feb 20, 2026",
    title: "Paper Submission Deadline",
    description: "Strict deadline for full manuscript submission (IEEE 2-column format, max 6 pages).",
    status: "UPCOMING",
    badge: "Upcoming Deadline",
    isUpcoming: true,
  },
  {
    id: "m3",
    date: "Mar 05, 2026",
    title: "Peer Review & Acceptance Notification",
    description: "Formal double-blind evaluation reports and acceptance notices issued to authors.",
    status: "SCHEDULED",
    badge: "Review Phase",
  },
  {
    id: "m4",
    date: "Mar 15, 2026",
    title: "Camera-Ready Manuscript Submission",
    description: "Submission of finalized manuscripts incorporating reviewer feedback and copyright forms.",
    status: "SCHEDULED",
    badge: "Final Version",
  },
  {
    id: "m5",
    date: "Apr 10–11, 2026",
    title: "Official Conference Sessions",
    description: "Oral presentation sessions, keynote addresses, track discussions, and award presentations.",
    status: "SCHEDULED",
    badge: "Conference Day",
  },
];

const FAQ_ITEMS = [
  {
    q: "Who is eligible to submit manuscripts?",
    a: "Postgraduate researchers, academic faculty, PhD scholars, and corporate R&D engineers working in electronics, telecommunication, and computing disciplines.",
  },
  {
    q: "What formatting and length standards are enforced?",
    a: "Manuscripts must strictly adhere to the IEEE double-column template (maximum 6 pages inclusive of figures, citations, and biographies) in PDF format.",
  },
  {
    q: "Are registration fees required upon submission?",
    a: "No fees are required to submit manuscripts for initial peer review. Registration fees apply only following formal acceptance notification.",
  },
  {
    q: "Where will accepted papers be indexed?",
    a: "All accepted and presented papers will be submitted for inclusion in indexed conference proceedings (Scopus / IEEE standards).",
  },
  {
    q: "How does the AI manuscript format audit work?",
    a: "When you upload your PDF in the submission modal, our Gemini-powered audit agent instantly verifies page margins, font compliance, column layouts, and mandatory sections (Abstract, Introduction, References) before submission.",
  },
];

function Index() {
  // Explicit modal state management across landing page, hero, tracks, and navbar
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | undefined>(undefined);
  const [trackInitialQuery, setTrackInitialQuery] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleOpenSubmit = (track?: string) => {
    if (track) setSelectedTrack(track);
    setIsSubmitModalOpen(true);
  };

  const handleOpenTrack = (initialQuery?: string) => {
    if (initialQuery) setTrackInitialQuery(initialQuery);
    setIsTrackModalOpen(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Sticky Top Navigation Bar matching exact dark theme palette */}
      <Navbar
        onSubmit={() => handleOpenSubmit()}
        onTrack={() => handleOpenTrack()}
      />

      {/* Submission & tracking modals (logic preserved from Hero) */}
      <Hero
        isSubmitModalOpen={isSubmitModalOpen}
        setIsSubmitModalOpen={setIsSubmitModalOpen}
        isTrackModalOpen={isTrackModalOpen}
        setIsTrackModalOpen={setIsTrackModalOpen}
        onOpenSubmit={handleOpenSubmit}
        onOpenTrack={handleOpenTrack}
        prefilledTrack={selectedTrack}
        onSubmit={() => handleOpenSubmit()}
        onTrack={() => handleOpenTrack()}
      />

      {/* Compact Quick Info Bar below Hero */}
      <section
        id="quick-info"
        className="mx-auto max-w-7xl px-4 sm:px-6 -mt-6 sm:-mt-10 mb-16 relative z-20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {QUICK_INFO_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.5 }}
                className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl p-4 sm:p-4.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-md flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.label}
                  </span>
                  <div className="grid h-7 w-7 place-items-center rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                    <Icon size={14} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white font-display">
                    {item.value}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {item.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* About / Overview Section */}
      <section
        id="overview"
        className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 py-20 md:grid-cols-2 scroll-mt-20"
      >
        <div>
          <span className="inline-block rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            Academic Scope
          </span>
          <h2 className="mt-4 text-4xl font-light tracking-tight text-slate-900 dark:text-white font-display md:text-5xl">
            About the{" "}
            <span className="font-semibold text-slate-900 dark:text-white">Conference</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            NCATEX 2026 convenes distinguished researchers, doctoral scholars, and industry
            innovators to disseminate groundbreaking technical contributions shaping the future of
            electronics, telecommunication, and autonomous systems.
          </p>
        </div>

        <div className="flex flex-col justify-between">
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Each submitted manuscript undergoes rigorous double-blind peer review by an
            international technical committee, ensuring exceptional scientific rigor,
            reproducibility, and industrial relevance.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            {[
              ["5", "Research Tracks"],
              ["40+", "Keynote Speakers"],
              ["2", "Conference Days"],
            ].map(([n, l]) => (
              <div
                key={l}
                className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-teal-500/30"
              >
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                  {n}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standardized Cards Section 01–05 without glitchy black squares */}
      <Tracks onSelectTrack={(track) => handleOpenSubmit(track)} />

      {/* Important Dates Visual Timeline Section */}
      <section
        id="dates"
        className="bg-slate-900 text-white dark:bg-[#0b0c10] py-24 border-y border-slate-800 scroll-mt-20"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-14">
            <span className="inline-block rounded-full bg-teal-500/15 border border-teal-500/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-400">
              Critical Milestones
            </span>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white font-display md:text-5xl">
              Important <span className="font-semibold text-white">Dates</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-xl">
              Track deadlines closely. Camera-ready versions and registrations will strictly adhere
              to the conference schedule.
            </p>
          </div>

          {/* Visual Connected Timeline */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-500/30 space-y-8 ml-3 sm:ml-4">
            {TIMELINE_MILESTONES.map((item, idx) => {
              const isUpcoming = item.isUpcoming;
              const isCompleted = item.status === "COMPLETED";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07, duration: 0.5 }}
                  className="relative group"
                >
                  {/* Timeline Node on the vertical track */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-4 flex items-center justify-center">
                    {isUpcoming ? (
                      <div className="relative flex items-center justify-center">
                        <span className="absolute h-6 w-6 rounded-full bg-teal-400 opacity-75 animate-ping" />
                        <span className="relative h-4 w-4 rounded-full bg-teal-400 shadow-lg shadow-teal-500/50" />
                      </div>
                    ) : isCompleted ? (
                      <span className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-slate-900 dark:ring-[#0b0c10]" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 bg-slate-900 dark:bg-[#0b0c10]" />
                    )}
                  </div>

                  {/* Milestone Card */}
                  <div
                    className={`rounded-2xl transition-all duration-200 p-5 sm:p-6 ${
                      isUpcoming
                        ? "border-2 border-teal-400/90 bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent shadow-xl shadow-teal-500/10 ring-1 ring-teal-400/30"
                        : "border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-base sm:text-lg font-bold tracking-tight ${
                            isUpcoming ? "text-teal-300" : "text-white"
                          }`}
                        >
                          {item.date}
                        </span>

                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 text-slate-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow">
                            <Clock size={11} />
                            Upcoming Deadline
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold uppercase">
                            <CheckCircle2 size={11} />
                            Done
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 font-medium">
                        Milestone 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold tracking-tight text-white font-display">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {isUpcoming && (
                      <div className="mt-4 pt-4 border-t border-teal-500/20 flex items-center justify-between">
                        <span className="text-xs text-teal-300 font-medium">
                          Peer review queue open for immediate submission
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenSubmit();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>Submit Now</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expandable FAQ Accordion Section */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 py-24 scroll-mt-20">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            Author Guidance
          </span>
          <h2 className="mt-3.5 text-4xl font-light tracking-tight text-slate-900 dark:text-white font-display md:text-5xl">
            Frequently Asked{" "}
            <span className="font-semibold text-slate-900 dark:text-white">Questions</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Everything authors and reviewers need to know regarding submission protocols.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;

            return (
              <div
                key={item.q}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-teal-500/50 bg-white dark:bg-[#0f1117] shadow-md dark:shadow-teal-500/5"
                    : "border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] hover:border-teal-500/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="flex w-full items-center justify-between text-left p-5 sm:p-6 cursor-pointer gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-slate-900 dark:text-white font-display">
                    {item.q}
                  </span>
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-200 shrink-0 ${
                      isOpen
                        ? "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 rotate-180"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <ChevronDown size={15} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Consolidated Footer */}
      <Footer />

      {/* =====================================================================
          Top-Level Paper Submission & Tracking Dialog Overlays
          ===================================================================== */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <SubmitModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            onTrack={(id) => {
              setIsSubmitModalOpen(false);
              handleOpenTrack(id);
            }}
            initialTrack={selectedTrack}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTrackModalOpen && (
          <TrackModal
            isOpen={isTrackModalOpen}
            initialQuery={trackInitialQuery}
            onClose={() => setIsTrackModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
