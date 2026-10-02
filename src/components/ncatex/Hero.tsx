import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Zap, ArrowRight, FileText } from "lucide-react";
const EASE = [0.16, 1, 0.3, 1] as const;
const HERO_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4";
function useMouseScrub(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    let lastX: number | null = null;
    let rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const v = videoRef.current;
          if (!v.duration) return;
          if (lastX === null) {
            lastX = e.clientX;
            return;
          }
          const delta = e.clientX - lastX;
          lastX = e.clientX;
          let t = v.currentTime + (delta / window.innerWidth) * 0.6 * v.duration;
          t = ((t % v.duration) + v.duration) % v.duration;
          v.currentTime = t;
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [videoRef]);
}
const css = `
.nx-hero {
  position: relative;
  min-height: 90vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #111;
}
.nx-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 40px;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.nx-nav > * { pointer-events: auto; }
.nx-left, .nx-right { display: flex; align-items: center; gap: 12px; }
.nx-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111; font-weight: 700; font-size: 15px; }
.nx-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #111;
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 6px 16px 6px 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.nx-menu:hover { opacity: 0.9; }
.nx-menu span.c {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  display: grid;
  place-items: center;
}
.nx-badge-group {
  background: #f0f0f2;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 18px;
  font-size: 12px;
  font-weight: 500;
  color: #555;
}
.nx-portal { display: flex; align-items: center; gap: 10px; background: #f0f0f2; border-radius: 999px; padding: 4px; font-size: 13px; }
.nx-portal button.c { width: 30px; height: 30px; border-radius: 50%; background: #111; border: 0; display: grid; place-items: center; cursor: pointer; }
.nx-portal .lbl { padding-right: 10px; font-weight: 500; color: #333; }
.nx-admin {
  background: #111;
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}
.nx-admin:hover { opacity: 0.9; }
/* Video Positioning - Right Side Only */
.nx-video-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}
.nx-video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center right;
}
.nx-video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fafafa 0%, rgba(250,250,250,0.6) 20%, transparent 70%);
  z-index: 2;
}
/* Hero Body Section */
.nx-hero-content {
  position: relative;
  z-index: 10;
  margin-top: auto;
  padding: 160px 40px 60px;
  max-width: 1320px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.nx-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 20px;
}
.nx-pill i { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }
.nx-h1 {
  font-weight: 700;
  font-size: clamp(2.8rem, 4.8vw, 4.5rem);
  letter-spacing: -0.03em;
  line-height: 1.08;
  margin: 0 0 32px;
  max-width: 720px;
  color: #000;
}
.nx-btns { display: flex; gap: 14px; align-items: center; }
.nx-btn {
  font-size: 14px;
  font-weight: 600;
  border-radius: 999px;
  padding: 14px 28px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.nx-btn.p { background: #111; color: #fff; border: 1px solid #111; }
.nx-btn.p:hover { background: #222; transform: translateY(-1px); }
.nx-btn.s { background: #fff; color: #111; border: 1px solid #e5e5e5; }
.nx-btn.s:hover { background: #f5f5f5; border-color: #ccc; }
.nx-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.nx-tags span {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
`;
function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="8" width="11" height="6" rx="3" fill="#111" transform="rotate(-35 8.5 11)" />
      <rect x="10" y="10" width="11" height="6" rx="3" fill="#111" transform="rotate(-35 15.5 13)" />
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
    <motion.nav className="nx-nav" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: EASE }}>
      <div className="nx-left">
        <a href="#top" className="nx-logo"><Logo /><span>NCATEX 2026</span></a>
        <button className="nx-menu" onClick={() => document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" })}>
          <span className="c"><Plus size={12} strokeWidth={3} /></span>Menu
        </button>
        <div className="nx-badge-group">
          <span>Electronics</span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span>Telecommunication</span>
        </div>
      </div>
      <div className="nx-right">
        <div className="nx-portal">
          <button className="c" onClick={onAdmin} aria-label="Open Portal"><Grid /></button>
          <span className="lbl">NCATEX Portal</span>
          <button className="nx-admin" onClick={onAdmin}><Zap size={12} /> Admin Demo</button>
        </div>
      </div>
    </motion.nav>
  );
}
export function Hero({ onSubmit, onTrack }: { onSubmit: () => void; onTrack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useMouseScrub(videoRef);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);
  return (
    <section id="top" className="nx-hero">
      <style>{css}</style>
      <div className="nx-video-container">
        <div className="nx-video-overlay" />
        <video ref={videoRef} src={HERO_VIDEO_URL} poster="/hero-poster.jpg" autoPlay muted loop playsInline preload="auto" />
      </div>
      <div className="nx-hero-content">
        <div>
          <div className="nx-pill"><i />National Level Research &amp; Paper Presentation 2026</div>
          <h1 className="nx-h1">2nd National Conference<br />Advanced Trends in Engineering.</h1>
          <div className="nx-btns">
            <button className="nx-btn p" onClick={onSubmit}>
              Submit Paper <ArrowRight size={16} />
            </button>
            <button className="nx-btn s" onClick={onTrack}>
              <FileText size={16} /> Track Paper
            </button>
          </div>
        </div>
        <div className="nx-tags">
          <span>AI / ML</span>
          <span>VLSI</span>
          <span>5G &amp; IoT</span>
        </div>
      </div>
    </section>
  );
}
