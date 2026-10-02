import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, Hero } from "@/components/ncatex/Hero";
import { Tracks } from "@/components/ncatex/Tracks";

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

const DATES = [
  ["Jan 15, 2026", "Call for papers opens"],
  ["Feb 20, 2026", "Paper submission deadline"],
  ["Mar 05, 2026", "Peer review & acceptance notification"],
  ["Mar 15, 2026", "Camera-ready manuscript submission"],
  ["Mar 27–28, 2026", "Official conference sessions"],
];

const FAQ = [
  [
    "Who is eligible to submit manuscripts?",
    "Postgraduate researchers, academic faculty, PhD scholars, and corporate R&D engineers working in electronics, telecommunication, and computing disciplines.",
  ],
  [
    "What formatting and length standards are enforced?",
    "Manuscripts must strictly adhere to the IEEE double-column template (maximum 6 pages inclusive of figures, citations, and biographies) in PDF format.",
  ],
  [
    "Are registration fees required upon submission?",
    "No fees are required to submit manuscripts for initial peer review. Registration fees apply only following formal acceptance notification.",
  ],
  [
    "Where will accepted papers be indexed?",
    "All accepted and presented papers will be submitted for inclusion in indexed conference proceedings (Scopus / IEEE standards).",
  ],
];

const SPONSORS = ["IEEE", "Scopus", "Springer", "Codecraft", "AlphaWave"];

function Index() {
  // Single unified modal state handler across the entire page (Student actions only)
  const [activeModal, setActiveModal] = useState<"submit" | "track" | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | undefined>(undefined);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleOpenSubmit = (track?: string) => {
    if (track) setSelectedTrack(track);
    setActiveModal("submit");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Navigation Header with Light/Dark Theme Switch and sticky glass blur */}
      <Header onSubmit={() => handleOpenSubmit()} onTrack={() => setActiveModal("track")} />

      {/* Centered Visual Hero Section with Framed Video Reel and Modal Dialogs */}
      <Hero
        activeModal={activeModal}
        onModalChange={setActiveModal}
        prefilledTrack={selectedTrack}
        onSubmit={() => handleOpenSubmit()}
        onTrack={() => setActiveModal("track")}
      />

      {/* About Section matching typography, clean border radii, and subtle lifts */}
      <section
        id="about"
        className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 py-24 md:grid-cols-2"
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

      {/* Important Dates Section */}
      <section
        id="dates"
        className="bg-slate-900 text-white dark:bg-[#0b0c10] py-24 border-y border-slate-800"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="inline-block rounded-full bg-teal-500/15 border border-teal-500/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-400">
              Critical Milestones
            </span>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white font-display md:text-5xl">
              Important <span className="font-semibold text-white">Dates</span>
            </h2>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {DATES.map(([d, l], i) => (
              <motion.div
                key={d}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="flex items-center justify-between py-6 transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-sm font-medium text-white/80 md:text-base">{l}</span>
                <span className="font-mono text-lg font-semibold tracking-tight text-teal-300 md:text-xl">
                  {d}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 py-24">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            Author Guidance
          </span>
          <h2 className="mt-3.5 text-4xl font-light tracking-tight text-slate-900 dark:text-white font-display md:text-5xl">
            Frequently Asked{" "}
            <span className="font-semibold text-slate-900 dark:text-white">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {FAQ.map(([q, a], i) => (
            <div
              key={q}
              className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-6 shadow-sm transition-all duration-200 hover:border-teal-500/40 dark:hover:border-teal-500/40"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between text-left text-base font-semibold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>{q}</span>
                <span className="ml-4 grid h-7 w-7 place-items-center rounded-full bg-slate-100 dark:bg-white/5 font-mono text-sm text-slate-900 dark:text-white">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden pt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                  >
                    {a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0d14] py-14 transition-colors duration-200">
        <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">
          Indexed Proceedings &amp; Academic Partners
        </p>
        <div className="overflow-hidden">
          <div className="marquee-projects flex w-max gap-20">
            {[...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS].map((s, i) => (
              <span
                key={i}
                className="text-3xl font-medium tracking-tight text-slate-400 dark:text-slate-600 transition-colors hover:text-slate-900 dark:hover:text-white cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          © 2026 2nd National Conference on Advanced Trends in Engineering (NCATEX) • All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
