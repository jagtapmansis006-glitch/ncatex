import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, CalendarDays, MapPin, GraduationCap, Trophy, Clock, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/context/ThemeContext";

const LINKS = [
  ["Overview", "#overview"],
  ["Tracks", "#tracks"],
  ["Dates", "#dates"],
  ["FAQ", "#faq"],
] as const;

const CONFERENCE_START = new Date("2026-03-27T09:00:00+05:30").getTime();

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function SiteNav({ onSubmit }: { onSubmit: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090D16]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="text-lg font-bold tracking-tight">
          NCATEX <span className="text-teal-600 dark:text-teal-400">2026</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map(([l, h]) => (
            <a key={l} href={h} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login" className="rounded-full border border-slate-300 dark:border-white/15 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5">
            Login
          </Link>
          <button type="button" onClick={onSubmit} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
            Submit Paper
          </button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button type="button" aria-label="Open menu" onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 dark:border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {LINKS.map(([l, h]) => (
                <a key={l} href={h} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5">
                  {l}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="rounded-full border border-slate-300 dark:border-white/15 py-2.5 text-center text-sm font-semibold">
                  Login
                </Link>
                <button type="button" onClick={() => { setOpen(false); onSubmit(); }} className="rounded-full bg-teal-600 py-2.5 text-sm font-semibold text-white">
                  Submit Paper
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Countdown() {
  const now = useNow();
  const diff = Math.max(0, CONFERENCE_START - now);
  const units = [
    ["Days", Math.floor(diff / 86400000)],
    ["Hours", Math.floor(diff / 3600000) % 24],
    ["Mins", Math.floor(diff / 60000) % 60],
    ["Secs", Math.floor(diff / 1000) % 60],
  ] as const;
  return (
    <div className="flex gap-3" suppressHydrationWarning>
      {units.map(([l, v]) => (
        <div key={l} className="w-20 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 py-3 text-center backdrop-blur">
          <p className="font-mono text-2xl font-bold tabular-nums" suppressHydrationWarning>
            {String(v).padStart(2, "0")}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{l}</p>
        </div>
      ))}
    </div>
  );
}

export function LandingHero({ onSubmit }: { onSubmit: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 md:pt-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-500/20 via-teal-500/5 to-transparent blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
          <CalendarDays size={14} /> Mar 27–28, 2026 · Pune, India
        </span>
        <h1 className="mt-6 text-4xl font-light tracking-tight md:text-6xl">
          2nd National Conference on <span className="font-semibold">Advanced Trends in Electronics &amp; Telecommunication</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
          Where researchers, scholars and industry engineers present the next wave of AI, VLSI, 5G, IoT and signal processing research.
        </p>
        <div className="mt-8">
          <Countdown />
        </div>
        <button type="button" onClick={onSubmit} className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-500">
          Submit Your Paper <ArrowRight size={16} />
        </button>
      </motion.div>
    </section>
  );
}

const INFO = [
  [CalendarDays, "Date", "Mar 27–28, 2026"],
  [MapPin, "Venue", "Pune, India"],
  [GraduationCap, "Eligibility", "UG, PG, PhD & faculty"],
  [Trophy, "Awards", "Best paper per track"],
  [Clock, "Registration Deadline", "Feb 20, 2026"],
] as const;

export function QuickInfoBar() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/10 md:grid-cols-5">
        {INFO.map(([Icon, l, v]) => (
          <div key={l} className="flex items-center gap-3 bg-white dark:bg-[#0f1117] p-5 last:col-span-2 md:last:col-span-1">
            <Icon size={20} className="shrink-0 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{l}</p>
              <p className="text-sm font-semibold">{v}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
