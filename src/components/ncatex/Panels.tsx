import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Upload, X, Search, CheckCircle2 } from "lucide-react";
import { TRACKS } from "./Tracks";
import { STAGES, nextId, savePapers, stageIndex, type Paper, type PaperStatus } from "@/lib/papers";

function Overlay({ onClose, children, side }: { onClose: () => void; children: React.ReactNode; side?: boolean }) {
  return (
    <motion.div className="fixed inset-0 z-[60] flex bg-ink/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ justifyContent: side ? "flex-end" : "center", alignItems: side ? "stretch" : "center" }}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={side ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
        animate={side ? { x: 0 } : { scale: 1, opacity: 1 }}
        exit={side ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={side ? "h-full w-full max-w-xl overflow-y-auto bg-background p-8" : "m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-background p-8"}>
        <button onClick={onClose} className="float-right p-1 hover:opacity-60" aria-label="Close"><X className="h-5 w-5" /></button>
        {children}
      </motion.div>
    </motion.div>
  );
}

const input = "w-full border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring";

export function SubmitModal({ papers, onClose, onTrack }: { papers: Paper[]; onClose: () => void; onTrack: (id: string) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const [f, setF] = useState({ title: "", author: "", email: "", abstract: "" });
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const toggle = (n: string) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = nextId(papers);
    savePapers([...papers, { id, ...f, tracks: sel, fileName: file?.name ?? "", status: "Submitted", submittedAt: new Date().toISOString().slice(0, 10) }]);
    setDone(id);
  };

  return (
    <Overlay onClose={onClose}>
      {done ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h3 className="mt-4 font-display text-3xl font-medium">Paper submitted</h3>
          <p className="mt-2 text-muted-foreground">Your paper ID is</p>
          <p className="mt-2 font-display text-4xl tracking-tight">{done}</p>
          <button onClick={() => onTrack(done)} className="mt-8 bg-primary px-6 py-3 text-sm uppercase tracking-wider text-primary-foreground">Track this paper</button>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h3 className="font-display text-3xl font-medium tracking-tight">Submit a paper</h3>
          <input required placeholder="Paper Title" className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Author Name" className={input} value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
            <input required type="email" placeholder="Email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <textarea required rows={4} placeholder="Abstract" className={input} value={f.abstract} onChange={(e) => setF({ ...f, abstract: e.target.value })} />
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Tracks</p>
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => {
                const on = sel.includes(t.name);
                return (
                  <motion.button type="button" key={t.name} onClick={() => toggle(t.name)} layout whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-input hover:border-ink"}`}>
                    <AnimatePresence>
                      {on && (
                        <motion.span initial={{ scale: 0, width: 0 }} animate={{ scale: 1, width: "auto" }} exit={{ scale: 0, width: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                          <Check className="h-4 w-4 text-accent" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {t.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0] ?? null); }}
            className={`flex cursor-pointer flex-col items-center border-2 border-dashed p-6 text-sm transition ${drag ? "border-accent bg-muted" : "border-input"}`}>
            <Upload className="mb-2 h-5 w-5" />
            {file ? file.name : "Drop your PDF here or click to browse"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <AnimatePresence>
            {sel.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center justify-between gap-4 bg-ink p-4 text-paper">
                  <p className="text-sm">Ready to inquire about: <span className="text-accent">{sel.join(", ")}</span></p>
                  <button type="submit" className="shrink-0 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-accent-foreground">Let's Go</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sel.length === 0 && <p className="text-xs text-muted-foreground">Select at least one track to continue.</p>}
        </form>
      )}
    </Overlay>
  );
}

export function Stepper({ paper }: { paper: Paper }) {
  const idx = stageIndex(paper.status);
  const bad = paper.status === "Rejected";
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{paper.id}</p>
          <h4 className="font-display text-xl font-medium">{paper.title}</h4>
          <p className="text-sm text-muted-foreground">{paper.author}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${bad ? "bg-destructive text-destructive-foreground" : paper.status === "Accepted" ? "bg-success text-paper" : paper.status === "Revision Needed" ? "bg-warning text-ink" : "bg-muted"}`}>{paper.status}</span>
      </div>
      <div className="mt-8 grid grid-cols-5 gap-2">
        {STAGES.map((s, i) => (
          <div key={s}>
            <div className="h-1.5 overflow-hidden bg-muted">
              <motion.div className={bad && i === idx ? "h-full bg-destructive" : "h-full bg-ink"} initial={{ width: 0 }} animate={{ width: i <= idx ? "100%" : "0%" }} transition={{ delay: i * 0.12, duration: 0.4 }} />
            </div>
            <p className={`mt-2 text-[11px] leading-tight ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrackModal({ papers, initial, onClose }: { papers: Paper[]; initial: string; onClose: () => void }) {
  const [q, setQ] = useState(initial);
  const [query, setQuery] = useState(initial);
  const paper = papers.find((p) => p.id.toLowerCase() === query.trim().toLowerCase());
  return (
    <Overlay onClose={onClose}>
      <h3 className="font-display text-3xl font-medium tracking-tight">Track your paper</h3>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="mt-6 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. NCATEX-101" className={input} />
        <button className="flex items-center gap-1 bg-primary px-4 text-sm text-primary-foreground"><Search className="h-4 w-4" /> Search</button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">Try NCATEX-101, NCATEX-102 or NCATEX-103.</p>
      {query && (paper ? <Stepper paper={paper} /> : <p className="mt-6 text-sm text-destructive">No paper found with ID "{query}".</p>)}
    </Overlay>
  );
}

export function AdminPanel({ papers, onClose }: { papers: Paper[]; onClose: () => void }) {
  const set = (id: string, status: PaperStatus) => savePapers(papers.map((p) => (p.id === id ? { ...p, status } : p)));
  return (
    <Overlay onClose={onClose} side>
      <p className="text-xs uppercase tracking-widest text-accent">Admin Demo</p>
      <h3 className="font-display text-3xl font-medium tracking-tight">All submissions</h3>
      <div className="mt-6 space-y-4">
        {papers.map((p) => (
          <motion.div layout key={p.id} className="border border-border bg-card p-4">
            <div className="flex justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{p.id} · {p.tracks.join(", ") || "—"}</p>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.author}</p>
              </div>
              <span className="h-fit shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => set(p.id, "Accepted")} className="bg-success px-3 py-1 text-xs text-paper">Accept</button>
              <button onClick={() => set(p.id, "Revision Needed")} className="bg-warning px-3 py-1 text-xs text-ink">Request Revision</button>
              <button onClick={() => set(p.id, "Rejected")} className="bg-destructive px-3 py-1 text-xs text-destructive-foreground">Reject</button>
            </div>
          </motion.div>
        ))}
      </div>
    </Overlay>
  );
}
