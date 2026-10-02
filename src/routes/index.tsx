import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Header, Hero } from "@/components/ncatex/Hero";
import { Tracks } from "@/components/ncatex/Tracks";
import { AdminPanel, SubmitModal, TrackModal } from "@/components/ncatex/Panels";
import { loadPapers, PAPERS_EVENT, type Paper } from "@/lib/papers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NCATEX 2026 — National Conference on Electronics & Telecom" },
      { name: "description", content: "2nd National Conference on Advanced Trends in Electronics & Telecommunication Engineering. Submit and track your paper." },
      { property: "og:title", content: "NCATEX 2026 — Electronics & Telecom Conference" },
      { property: "og:description", content: "Submit papers across AI/ML, VLSI, 5G, IoT and Signal Processing tracks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const DATES = [
  ["Jan 15, 2026", "Call for papers opens"],
  ["Feb 20, 2026", "Paper submission deadline"],
  ["Mar 05, 2026", "Acceptance notification"],
  ["Mar 15, 2026", "Camera-ready submission"],
  ["Mar 27–28, 2026", "Conference days"],
];
const FAQ = [
  ["Who can submit?", "Students, researchers, faculty and industry professionals working in electronics and telecommunication."],
  ["What format is required?", "IEEE double-column format, max 6 pages, submitted as PDF."],
  ["Is there a registration fee?", "Yes — fees apply after acceptance, with concessions for students."],
  ["Will papers be published?", "Accepted and presented papers will be considered for indexed proceedings."],
];
const SPONSORS = ["IEEE", "Scopus", "Springer", "Codecraft", "AlphaWave"];

function Index() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [modal, setModal] = useState<null | "submit" | "track" | "admin">(null);
  const [trackId, setTrackId] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    const sync = () => setPapers(loadPapers());
    sync();
    window.addEventListener(PAPERS_EVENT, sync);
    return () => window.removeEventListener(PAPERS_EVENT, sync);
  }, []);

  return (
    <div className="min-h-screen">
      <Header onSubmit={() => setModal("submit")} onTrack={() => { setTrackId(""); setModal("track"); }} onAdmin={() => setModal("admin")} />
      <Hero onSubmit={() => setModal("submit")} />

      <section id="about" className="mx-auto grid max-w-7xl gap-12 px-6 py-28 md:grid-cols-2">
        <h2 className="font-display text-5xl font-medium tracking-tighter">About the conference</h2>
        <div className="space-y-4 text-lg font-light text-muted-foreground">
          <p>NCATEX 2026 brings together researchers, engineers and students to share breakthroughs shaping the future of electronics and telecommunication.</p>
          <div className="grid grid-cols-3 gap-4 pt-6 text-foreground">
            {[["5", "Tracks"], ["40+", "Speakers"], ["2", "Days"]].map(([n, l]) => (
              <div key={l} className="border-t border-ink pt-3"><p className="font-display text-4xl">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      <Tracks />

      <section id="dates" className="bg-ink py-28 text-paper">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-5xl font-medium tracking-tighter">Important dates</h2>
          <div className="mt-12 divide-y divide-paper/15 border-y border-paper/15">
            {DATES.map(([d, l], i) => (
              <motion.div key={d} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between py-6">
                <span className="text-paper/70">{l}</span>
                <span className="font-display text-xl md:text-2xl">{d}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
        <h2 className="font-display text-5xl font-medium tracking-tighter">FAQ</h2>
        <div className="mt-10 border-t border-border">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="border-b border-border">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full justify-between py-5 text-left font-medium">
                {q}<span className="text-xl">{open === i ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-5 font-light text-muted-foreground">{a}</motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">Supported by</p>
        <div className="overflow-hidden">
          <div className="marquee-projects flex w-max gap-20">
            {[...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS].map((s, i) => (
              <span key={i} className="font-display text-4xl font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground">{s}</span>
            ))}
          </div>
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">© 2026 NCATEX ✵ All rights reserved.</p>
      </footer>

      <AnimatePresence>
        {modal === "submit" && <SubmitModal key="s" papers={papers} onClose={() => setModal(null)} onTrack={(id) => { setTrackId(id); setModal("track"); }} />}
        {modal === "track" && <TrackModal key="t" papers={papers} initial={trackId} onClose={() => setModal(null)} />}
        {modal === "admin" && <AdminPanel key="a" papers={papers} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
