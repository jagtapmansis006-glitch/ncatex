import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Zap } from "lucide-react";
import heroVideo from "@/assets/ncatex-hero-bw.asset.json";

const EASE = [0.16, 1, 0.3, 1] as const;
const INK = "#000";

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

const css = `
.nx-hero{position:relative;min-height:100vh;background:#fff;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;font-family:Inter,sans-serif;color:${INK}}
.nx-nav{position:fixed;top:0;left:0;right:0;z-index:50;pointer-events:none;display:flex;justify-content:space-between;align-items:center;padding:16px 20px}
.nx-nav > *{pointer-events:auto}
.nx-left,.nx-right{display:flex;align-items:center;gap:8px}
.nx-logo{display:flex;align-items:center;gap:8px;margin-right:4px;text-decoration:none;color:${INK}}
.nx-brand{display:none;font-weight:500;font-size:14px;letter-spacing:-0.01em}
.nx-menu{display:flex;align-items:center;gap:8px;background:#000;color:#fff;border:0;border-radius:999px;padding:4px 14px 4px 4px;font-size:11px;cursor:pointer;font-family:inherit}
.nx-menu span.c{width:22px;height:22px;border-radius:50%;background:#fff;color:#000;display:grid;place-items:center}
.nx-gray{background:#F4F4F6;border-radius:999px;display:none;align-items:center;gap:14px;padding:7px 14px;font-size:11px;color:rgba(0,0,0,.7)}
.nx-portal{display:flex;align-items:center;gap:8px;background:#F4F4F6;border-radius:999px;padding:4px;font-size:11px;position:relative}
.nx-portal button.c{width:26px;height:26px;border-radius:50%;background:#000;border:0;display:grid;place-items:center;cursor:pointer}
.nx-portal .lbl{display:none;padding-right:10px}
.nx-admin{position:absolute;top:calc(100% + 8px);right:0;display:flex;align-items:center;gap:4px;white-space:nowrap;background:#000;color:#fff;border:0;border-radius:999px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit}
.nx-video{position:absolute;z-index:0;left:10%;top:10%;width:80%;height:80%}
.nx-video video{width:100%;height:100%;object-fit:cover;display:block}
.nx-foot{position:relative;z-index:30;margin-top:auto;padding:120px 20px 28px;background:linear-gradient(to top,#ffffff 0%,rgba(255,255,255,0.8) 50%,transparent 100%);display:flex;flex-direction:column;gap:24px}
.nx-sub{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(0,0,0,.55)}
.nx-sub i{width:8px;height:8px;border-radius:50%;background:#000;display:inline-block}
.nx-h1{font-weight:300;font-size:clamp(2rem,8vw,4.5rem);letter-spacing:-0.03em;line-height:1;margin:14px 0 22px}
.nx-btns{display:flex;gap:10px;flex-wrap:wrap}
.nx-btn{font-family:inherit;font-size:13px;border-radius:999px;padding:11px 20px;cursor:pointer}
.nx-btn.p{background:#000;color:#fff;border:1px solid #000}
.nx-btn.s{background:transparent;color:#000;border:1px solid rgba(0,0,0,.35)}
.nx-tags{display:flex;gap:6px;flex-wrap:wrap}
.nx-tags span{background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:5px 12px;font-size:11px}
@media (min-width:768px){
 .nx-nav{padding:20px 32px}
 .nx-brand{display:inline}
 .nx-gray{display:flex}
 .nx-portal .lbl{display:inline}
 .nx-video{left:0;top:0;width:100%;height:100%}
 .nx-foot{flex-direction:row;justify-content:space-between;align-items:flex-end;padding:140px 32px 36px}
 .nx-h1{font-size:clamp(2.5rem,5.5vw,4.5rem)}
}
`;

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="8" width="11" height="6" rx="3" fill="#000" transform="rotate(-35 8.5 11)" />
      <rect x="10" y="10" width="11" height="6" rx="3" fill="#000" transform="rotate(-35 15.5 13)" />
    </svg>
  );
}

function Grid() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      {[[2, 2], [8, 2], [2, 8], [8, 8]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" />)}
    </svg>
  );
}

export function Header({ onAdmin }: { onSubmit?: () => void; onTrack?: () => void; onAdmin: () => void }) {
  return (
    <motion.nav className="nx-nav" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }}>
      <div className="nx-left">
        <a href="#top" className="nx-logo"><Logo /><span className="nx-brand">NCATEX 2026</span></a>
        <button className="nx-menu" onClick={() => document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" })}>
          <span className="c"><Plus size={12} strokeWidth={3} /></span>Menu
        </button>
        <div className="nx-gray"><span>Electronics</span><span>Telecommunication</span></div>
      </div>
      <div className="nx-right">
        <div className="nx-portal">
          <button className="c" onClick={onAdmin} aria-label="Open NCATEX Portal"><Grid /></button>
          <span className="lbl">NCATEX Portal</span>
          <button className="nx-admin" onClick={onAdmin}><Zap size={11} /> Admin Demo</button>
        </div>
      </div>
    </motion.nav>
  );
}

export function Hero({ onSubmit, onTrack }: { onSubmit: () => void; onTrack?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useMouseScrub(ref);
  const up = (y: number, delay: number) => ({
    initial: { y, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.8, delay, ease: EASE },
  });
  return (
    <section id="top" className="nx-hero">
      <style>{css}</style>
      <motion.div className="nx-video" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: EASE }}>
        <video ref={ref} src={heroVideo.url} autoPlay muted playsInline loop preload="auto" />
      </motion.div>
      <motion.div className="nx-foot" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.5, ease: EASE }}>
        <div>
          <motion.div className="nx-sub" {...up(16, 0.6)}><i />National Level Research &amp; Paper Presentation 2026</motion.div>
          <motion.h1 className="nx-h1" {...up(20, 0.8)}>2nd National Conference<br />Advanced Trends in Engineering.</motion.h1>
          <motion.div className="nx-btns" {...up(16, 1.0)}>
            <button className="nx-btn p" onClick={onSubmit}>Submit Paper</button>
            <button className="nx-btn s" onClick={onTrack}>Track Paper</button>
          </motion.div>
        </div>
        <div className="nx-tags"><span>AI/ML</span><span>VLSI</span><span>5G &amp; IoT</span></div>
      </motion.div>
    </section>
  );
}
