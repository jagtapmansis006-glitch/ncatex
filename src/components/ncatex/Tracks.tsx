import { useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { Brain, Cpu, Radio, Wifi, Activity } from "lucide-react";

export const TRACKS = [
  { name: "AI/ML", icon: Brain, desc: "Deep learning, edge AI, neural accelerators and intelligent systems." },
  { name: "VLSI", icon: Cpu, desc: "Low-power design, FPGA, ASIC flows and semiconductor innovation." },
  { name: "5G Communication", icon: Radio, desc: "mmWave, massive MIMO, network slicing and beyond-5G research." },
  { name: "IoT", icon: Wifi, desc: "Sensor networks, embedded systems and connected infrastructure." },
  { name: "Signal Processing", icon: Activity, desc: "Audio, image, biomedical and radar signal analysis." },
];

function FloatSquare({ p, i }: { p: MotionValue<number>; i: number }) {
  const range = (i % 2 ? 1 : -1) * (60 + i * 25);
  const y = useSpring(useTransform(p, [0, 1], [0, range]), { stiffness: 80, damping: 20 });
  const rot = useTransform(p, [0, 1], [0, i * 30]);
  const size = 10 + (i % 4) * 8;
  return (
    <motion.div style={{ y, rotate: rot, width: size, height: size, left: `${8 + i * 11}%`, top: `${15 + ((i * 37) % 70)}%` }} className="absolute bg-ink" />
  );
}

function Magnet({ mx, my, i }: { mx: MotionValue<number>; my: MotionValue<number>; i: number }) {
  const base = { x: 20 + ((i * 53) % 70), y: 15 + ((i * 31) % 60) };
  const x = useSpring(useTransform(mx, (v) => (v - base.x) * 0.25), { stiffness: 150, damping: 15 });
  const y = useSpring(useTransform(my, (v) => (v - base.y) * 0.25), { stiffness: 150, damping: 15 });
  return <motion.span style={{ x, y, left: `${base.x}%`, top: `${base.y}%` }} className="absolute h-2 w-2 bg-ink/70 group-hover:bg-paper" />;
}

function TrackCard({ t, idx }: { t: (typeof TRACKS)[number]; idx: number }) {
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const Icon = t.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.08 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); mx.set(50); my.set(50); }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
      className="group relative h-72 overflow-hidden border border-ink bg-card p-6"
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-8">
        {Array.from({ length: 96 }).map((_, k) => {
          const row = Math.floor(k / 12), col = k % 12;
          return (
            <motion.div key={k} className="bg-ink/80" initial={false}
              animate={{ scale: hover ? 1 : 0 }}
              transition={{ duration: 0.25, delay: (row + col) * 0.018 }} />
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 6 }).map((_, i) => <Magnet key={i} mx={mx} my={my} i={i + idx} />)}
      </div>
      <div className="relative flex h-full flex-col justify-between transition-colors duration-300 group-hover:text-paper">
        <div className="flex items-start justify-between">
          <span className="text-xs tracking-widest text-muted-foreground group-hover:text-paper/60">0{idx + 1}</span>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-medium tracking-tight">{t.name}</h3>
          <p className="mt-2 text-sm font-light text-muted-foreground group-hover:text-paper/80">{t.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Tracks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section id="tracks" className="mx-auto max-w-7xl px-6 py-28">
      <div ref={ref} className="relative mb-16 py-10">
        {Array.from({ length: 8 }).map((_, i) => <FloatSquare key={i} p={scrollYProgress} i={i} />)}
        <p className="relative text-xs uppercase tracking-[0.3em] text-muted-foreground">Call for papers</p>
        <h2 className="relative mt-3 max-w-3xl font-display text-5xl font-medium tracking-tighter md:text-7xl">Five tracks. One frontier.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t, i) => <TrackCard key={t.name} t={t} idx={i} />)}
      </div>
    </section>
  );
}
