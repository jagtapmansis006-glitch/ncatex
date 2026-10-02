import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import heroVideo from "@/assets/ncatex-hero.asset.json";

const VIDEO = heroVideo.url;

function useTypewriter(text: string, speed = 40) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return out;
}

function useMouseScrub(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let lastX: number | null = null;
    const onMove = (e: MouseEvent) => {
      const v = ref.current;
      if (!v || !v.duration) return;
      if (lastX === null) { lastX = e.clientX; return; }
      const delta = e.clientX - lastX;
      lastX = e.clientX;
      let t = v.currentTime + (delta / window.innerWidth) * 0.8 * v.duration;
      t = ((t % v.duration) + v.duration) % v.duration;
      v.currentTime = t;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [ref]);
}

export function Header({ onSubmit, onTrack, onAdmin }: { onSubmit: () => void; onTrack: () => void; onAdmin: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-paper/10 bg-ink/70 text-paper backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="font-display text-lg font-medium tracking-tight">NCATEX 2026 ✵</a>
        <nav className="hidden gap-8 text-sm text-paper/70 md:flex">
          {["About", "Tracks", "Dates", "FAQ"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors hover:text-paper">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onSubmit} className="border border-paper bg-paper px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-ink transition hover:bg-transparent hover:text-paper">Submit Paper</button>
          <button onClick={onTrack} className="hidden border border-paper/40 px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition hover:border-paper sm:block">Track Paper</button>
        </div>
      </div>
      <button onClick={onAdmin} className="absolute right-4 top-full mt-3 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground shadow-lg transition hover:scale-105">
        <Zap className="h-3 w-3" /> Admin Demo
      </button>
    </header>
  );
}

export function Hero({ onSubmit }: { onSubmit: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useMouseScrub(ref);
  const typed = useTypewriter("2nd National Conference on Advanced Trends in Electronics & Telecommunication Engineering");
  return (
    <section id="top" className="relative h-screen w-full overflow-hidden bg-ink text-paper">
      <video ref={ref} src={VIDEO} muted playsInline autoPlay loop preload="auto" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-xs uppercase tracking-[0.3em] text-paper/60">
          March 2026 · Pune, India
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-display text-6xl font-medium leading-none tracking-tighter md:text-9xl">
          NCATEX<span className="text-accent">.</span>2026
        </motion.h1>
        <p className="mt-6 max-w-2xl text-lg font-light text-paper/80 md:text-xl">
          {typed}<span className="animate-blink ml-0.5 inline-block w-2 bg-accent">&nbsp;</span>
        </p>
        <div className="mt-10 flex gap-3">
          <button onClick={onSubmit} className="bg-paper px-6 py-3 text-sm font-medium uppercase tracking-wider text-ink transition hover:bg-accent">Submit your paper</button>
          <a href="#tracks" className="border border-paper/40 px-6 py-3 text-sm font-medium uppercase tracking-wider transition hover:border-paper">Explore tracks</a>
        </div>
        <p className="mt-8 hidden text-xs text-paper/40 md:block">Move your mouse to scrub the video</p>
      </div>
    </section>
  );
}
