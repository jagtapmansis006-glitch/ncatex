import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Layers, Users, Calendar } from "lucide-react";
import { CountUp } from "@/components/common/CountUp";

export interface OverviewProps {
  id?: string;
  className?: string;
}

export function Overview({ id = "overview", className = "" }: OverviewProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`mx-auto max-w-7xl px-4 sm:px-6 py-16 scroll-mt-20 ${className}`}
    >
      {/* 1. CONTAINER & HIGH-TECH GLASS CARD LAYOUT */}
      <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle background glow decorative blob in top-right */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center relative z-10">
          {/* 2. LEFT COLUMN (TEXT & BADGE) */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Academic Scope
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              About the{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                Conference
              </span>
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              NCATEX convenes distinguished researchers, doctoral scholars, and industry
              innovators to disseminate groundbreaking technical contributions shaping the future of
              electronics, telecommunication, and autonomous systems.
            </p>
          </div>

          {/* 3. RIGHT COLUMN & STAT CARDS */}
          <div className="flex flex-col justify-between">
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed p-4 rounded-xl bg-blue-50/40 dark:bg-slate-800/50 border border-blue-100/80 dark:border-slate-800 mb-6">
              Each submitted manuscript undergoes rigorous double-blind peer review by an
              international technical committee, ensuring exceptional scientific rigor,
              reproducibility, and industrial relevance.
            </p>

            {/* Stat Cards Grid: 3 stat boxes */}
            <div className="grid grid-cols-3 gap-4">
              {/* Card 1: Research Tracks */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all hover:-translate-y-1 group">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-blue-900 dark:text-blue-100 font-black text-3xl sm:text-4xl">
                  <CountUp value="5" duration={1.5} />
                </span>
                <span className="text-blue-700/80 dark:text-slate-300 text-xs font-semibold mt-1 text-center">
                  Research Tracks
                </span>
              </div>

              {/* Card 2: Keynote Speakers */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all hover:-translate-y-1 group">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-blue-900 dark:text-blue-100 font-black text-3xl sm:text-4xl">
                  <CountUp value="40+" duration={1.5} />
                </span>
                <span className="text-blue-700/80 dark:text-slate-300 text-xs font-semibold mt-1 text-center">
                  Keynote Speakers
                </span>
              </div>

              {/* Card 3: Conference Days */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all hover:-translate-y-1 group">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-blue-900 dark:text-blue-100 font-black text-3xl sm:text-4xl">
                  <CountUp value="2" duration={1.5} />
                </span>
                <span className="text-blue-700/80 dark:text-slate-300 text-xs font-semibold mt-1 text-center">
                  Conference Days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default Overview;
