import { motion } from "framer-motion";
import { Brain, Cpu, Radio, Wifi, Activity, ArrowUpRight } from "lucide-react";

export const TRACKS = [
  {
    id: "01",
    name: "AI/ML",
    fullName: "Artificial Intelligence & Machine Learning",
    icon: Brain,
    desc: "Deep learning architectures, edge AI acceleration, cognitive intelligence, and autonomous decision systems.",
    tags: ["Neural Networks", "Edge AI", "Computer Vision"],
  },
  {
    id: "02",
    name: "VLSI",
    fullName: "VLSI & Embedded Systems",
    icon: Cpu,
    desc: "Low-power semiconductor design, FPGA synthesis, nanoscale ASIC architectures, and hardware security.",
    tags: ["28nm/7nm Flows", "RISC-V", "SoC Design"],
  },
  {
    id: "03",
    name: "5G Communication",
    fullName: "5G & Next-Gen Wireless Communications",
    icon: Radio,
    desc: "mmWave propagation, massive MIMO beamforming, network slicing protocols, and beyond-5G communication.",
    tags: ["Beamforming", "Network Slicing", "Terahertz"],
  },
  {
    id: "04",
    name: "IoT",
    fullName: "Internet of Things (IoT) & Smart Sensors",
    icon: Wifi,
    desc: "Long-range sensor networks, industrial IoT telemetry, mesh topologies, and cyber-physical security.",
    tags: ["LoRaWAN", "Edge Sensing", "Industrial IoT"],
  },
  {
    id: "05",
    name: "Signal Processing",
    fullName: "Digital Signal & Image Processing",
    icon: Activity,
    desc: "Biomedical telemetry, multimodal signal decomposition, radar array processing, and audio compression.",
    tags: ["Biomedical DSP", "Radar Array", "Wavelet Transform"],
  },
];

export const TRACK_OPTIONS = TRACKS.map((t) => t.fullName);

interface TracksProps {
  onSelectTrack?: (trackName: string) => void;
}

export function Tracks({ onSelectTrack }: TracksProps) {
  return (
    <section id="tracks" className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
      {/* Section Header */}
      <div className="mb-14">
        <span className="inline-block rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Call for Papers 2026
        </span>
        <h2 className="mt-3.5 text-4xl font-light tracking-tight text-slate-900 dark:text-white font-display md:text-5xl">
          Five Tracks.{" "}
          <span className="font-semibold text-slate-900 dark:text-white">One Frontier.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Explore the five core technical domains of NCATEX 2026. Submit your original scholarly
          research for peer review and indexed publication.
        </p>
      </div>

      {/* Standardized Cards Grid (Sections 01-05) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t, idx) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -6 }}
              onClick={() => onSelectTrack?.(t.fullName)}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-7 shadow-sm transition-all duration-300 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xl dark:hover:shadow-teal-500/5 cursor-pointer overflow-hidden"
            >
              {/* Subtle top border accent glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div>
                {/* Card Top: Number pill & Icon */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 px-3 py-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors duration-200 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600">
                    {t.id}
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white group-hover:rotate-6">
                    <Icon size={20} />
                  </div>
                </div>

                {/* Title & Description with clean typography */}
                <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                  {t.name}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.desc}
                </p>
              </div>

              {/* Card Footer: Sub-tags & Submit prompt */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors duration-200 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 transition-all duration-200 group-hover:translate-x-0.5">
                  Submit{" "}
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default Tracks;
