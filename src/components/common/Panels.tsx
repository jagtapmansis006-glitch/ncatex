import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Upload, X, Search, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ChevronDown, Copy, Clock, Loader2 } from "lucide-react";
import { TRACKS } from "./Tracks";
import { STAGES, nextId, savePapers, stageIndex, type Paper, type PaperStatus } from "@/lib/papers";
import { supabase } from "@/lib/supabase";
import { validateStudentDocument } from "@/lib/ai-validation-client";
import type { StudentValidationResult } from "@/services/ai-validation/types";

function Overlay({
  onClose,
  children,
  side,
}: {
  onClose: () => void;
  children: React.ReactNode;
  side?: boolean;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex bg-slate-900/60 dark:bg-black/75 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        justifyContent: side ? "flex-end" : "center",
        alignItems: side ? "stretch" : "center",
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={side ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
        animate={side ? { x: 0 } : { scale: 1, opacity: 1 }}
        exit={side ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={
          side
            ? "h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-8 text-slate-900 dark:text-white shadow-2xl"
            : "m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-8 text-slate-900 dark:text-white shadow-2xl"
        }
      >
        <button
          type="button"
          onClick={onClose}
          className="float-right rounded-full border border-slate-200 dark:border-[#1f2430] bg-slate-100 dark:bg-white/5 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

const input =
  "w-full rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none transition focus:border-teal-500 focus:bg-white dark:focus:border-teal-500 dark:focus:bg-white/[0.06]";

const resolveCanonicalTrack = (trackName?: string): string => {
  if (!trackName) return TRACKS[0]?.fullName ?? "Artificial Intelligence & Machine Learning";
  const trimmed = trackName.trim();
  const match = TRACKS.find(
    (t) =>
      t.fullName.toLowerCase() === trimmed.toLowerCase() ||
      t.name.toLowerCase() === trimmed.toLowerCase() ||
      t.fullName.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(t.name.toLowerCase()),
  );
  return match ? match.fullName : trimmed;
};

export interface SubmitModalProps {
  isOpen?: boolean;
  papers?: Paper[] | undefined;
  onClose: () => void;
  onTrack?: ((id: string) => void) | undefined;
  initialTrack?: string | undefined;
}

export function SubmitModal({
  isOpen = true,
  papers = [],
  onClose,
  onTrack = () => {},
  initialTrack,
}: SubmitModalProps) {
  if (isOpen === false) return null;
  const [selectedTrack, setSelectedTrack] = useState<string>(() =>
    resolveCanonicalTrack(initialTrack),
  );
  const [f, setF] = useState({
    title: "",
    author: "",
    email: "",
    abstract: "",
    department: "Electronics & Telecommunication Engineering",
  });
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<StudentValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync if initialTrack changes
  useEffect(() => {
    if (initialTrack) {
      setSelectedTrack(resolveCanonicalTrack(initialTrack));
    }
  }, [initialTrack]);

  const sel = [selectedTrack];
  const toggle = (n: string) => setSelectedTrack(resolveCanonicalTrack(n));

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setValidationResult(null);
    setValidationError(null);
    if (!selectedFile) return;

    setValidating(true);
    try {
      const res = await validateStudentDocument(selectedFile);
      setValidationResult(res.result);
      if (res.saved === false || !res.canSubmit) {
        setValidationError(res.error || res.result?.summaryMessage || "Document formatting checks failed.");
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Document validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify manuscript format validation before finalizing upload
    let activeResult = validationResult;
    if (file) {
      if (!activeResult) {
        setValidating(true);
        const res = await validateStudentDocument(file);
        activeResult = res.result;
        setValidationResult(res.result);
        setValidating(false);
        if (res.saved === false || !res.canSubmit) {
          const err = res.error || res.result?.summaryMessage || "Document formatting checks failed.";
          console.error("AI review rejected file upload:", err);
          setValidationError(err);
          return; // Stop upload process
        }
      } else if (!activeResult.canSubmit || (activeResult.fileSaved === false && activeResult.status === "FAILED")) {
        const err = activeResult.summaryMessage || "Document formatting checks failed. Fix indicated issues before submitting.";
        console.error("AI review rejected file upload:", err);
        setValidationError(err);
        return; // Stop upload process
      }
    }

    setSubmitting(true);
    setValidationError(null);
    const id = nextId(papers);

    let pdfUrl: string | null = null;

    // 2. Upload incoming PDF directly to Supabase Storage bucket 'paper-drafts'
    if (file) {
      try {
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `drafts/${Date.now()}_${sanitizedFilename}`;

        const { error: storageError } = await supabase.storage
          .from("paper-drafts")
          .upload(storagePath, file, {
            contentType: file.type || "application/pdf",
            upsert: true,
          });

        if (storageError) {
          const errMsg = `Storage upload failed: ${storageError.message}`;
          console.error(errMsg, storageError);
          setValidationError(errMsg);
          setSubmitting(false);
          return;
        }

        // 3. Obtain public URL for the uploaded PDF
        const { data: urlData } = supabase.storage
          .from("paper-drafts")
          .getPublicUrl(storagePath);

        pdfUrl = urlData?.publicUrl || null;
        if (!pdfUrl) {
          const errMsg = "Storage error: Failed to obtain public URL for uploaded PDF.";
          console.error(errMsg);
          setValidationError(errMsg);
          setSubmitting(false);
          return;
        }
      } catch (uploadCatchErr) {
        const errMsg = `Storage upload failed: ${uploadCatchErr instanceof Error ? uploadCatchErr.message : String(uploadCatchErr)}`;
        console.error(errMsg, uploadCatchErr);
        setValidationError(errMsg);
        setSubmitting(false);
        return;
      }
    }

    // 4. Update Supabase database insert call on 'papers' table to include pdf_url, AI review output, and abstract details
    try {
      const aiSummaryNote = activeResult
        ? `\n\n--- AI Review Evaluation ---\nScore: ${activeResult.overallScore}/100 | Status: ${activeResult.status}\n${activeResult.summaryMessage}`
        : "";
      const fullAbstract = `${f.abstract.trim()}${aiSummaryNote}`;

      const insertPayload: Record<string, any> = {
        author_name: f.author.trim(),
        author_email: f.email.trim().toLowerCase(),
        department: "Electronics & Telecommunication Engineering",
        track: selectedTrack,
        paper_title: f.title.trim(),
        abstract: fullAbstract,
        status: "Under Review",
        pdf_url: pdfUrl,
        file_url: pdfUrl,
      };

      let { error: insertError } = await supabase
        .from("papers")
        .insert([insertPayload]);

      // Retry without pdf_url if column not present in schema cache
      if (insertError && insertError.message?.includes("pdf_url")) {
        console.warn("Retrying database insert without 'pdf_url' column due to schema cache: ", insertError.message);
        delete insertPayload.pdf_url;
        const retryResult = await supabase
          .from("papers")
          .insert([insertPayload]);
        insertError = retryResult.error;
      }

      if (insertError) {
        console.error("Supabase insert error on 'papers':", insertError);
        setValidationError(`Database error: Failed to submit paper: ${insertError.message}`);
        setSubmitting(false);
        return;
      }
    } catch (insertCatchErr) {
      const errMsg = `Database submission failed: ${insertCatchErr instanceof Error ? insertCatchErr.message : String(insertCatchErr)}`;
      console.error(errMsg, insertCatchErr);
      setValidationError(errMsg);
      setSubmitting(false);
      return;
    }

    savePapers([
      ...papers,
      {
        id,
        ...f,
        department: "Electronics & Telecommunication Engineering",
        tracks: [selectedTrack],
        fileName: file?.name ?? "",
        fileUrl: pdfUrl ?? undefined,
        status: "Submitted",
        submittedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setSubmitting(false);
    setDone(id);
  };

  return (
    <Overlay onClose={onClose}>
      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-10 text-center"
        >
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 dark:text-emerald-400" />
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Paper Submitted Successfully
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/60">
            Your tracking identifier is
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-teal-600 dark:text-teal-300">
            {done}
          </p>
          <button
            type="button"
            onClick={() => onTrack(done)}
            className="mt-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black px-7 py-3 text-xs font-semibold uppercase tracking-wider transition hover:opacity-90 shadow"
          >
            Track this paper
          </button>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Submit a Research Paper
          </h3>
          <input
            required
            placeholder="Paper Title *"
            className={input}
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Author Name *"
              className={input}
              value={f.author}
              onChange={(e) => setF({ ...f, author: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email *"
              className={input}
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
          <textarea
            required
            rows={4}
            placeholder="Abstract (summary of technical contributions) *"
            className={input}
            value={f.abstract}
            onChange={(e) => setF({ ...f, abstract: e.target.value })}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="submission-track-select"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60"
              >
                Research Track *
              </label>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                {selectedTrack}
              </span>
            </div>

            {/* Dynamic Track Selection Dropdown */}
            <div className="relative mb-2.5">
              <select
                id="submission-track-select"
                required
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(resolveCanonicalTrack(e.target.value))}
                className={`${input} appearance-none pr-10 cursor-pointer`}
              >
                {TRACKS.map((t) => (
                  <option
                    key={t.id}
                    value={t.fullName}
                    className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white py-1"
                  >
                    Track {t.id}: {t.fullName} ({t.name})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 dark:text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Quick Track Selection Chips */}
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => {
                const on = selectedTrack === t.fullName || selectedTrack === t.name;
                return (
                  <motion.button
                    type="button"
                    key={t.name}
                    onClick={() => setSelectedTrack(t.fullName)}
                    layout
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? "border-teal-600 bg-teal-600 text-white font-semibold dark:border-white dark:bg-white dark:text-black"
                        : "border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-white/80 hover:border-teal-500/50"
                    }`}
                  >
                    <AnimatePresence>
                      {on && (
                        <motion.span
                          initial={{ scale: 0, width: 0 }}
                          animate={{ scale: 1, width: "auto" }}
                          exit={{ scale: 0, width: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-3.5 w-3.5 text-white dark:text-black" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {t.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
          {/* Student Document Upload Dropzone & Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Manuscript Document Upload (.pdf, .doc, .docx)
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Accepts .pdf, .doc, .docx
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const dropped = e.dataTransfer.files?.[0] ?? null;
                handleFileChange(dropped);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                drag
                  ? "border-teal-500 bg-teal-500/10 scale-[1.01]"
                  : file && validationResult && !validationResult.canSubmit
                    ? "border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-500/5 text-rose-700 dark:text-rose-300"
                    : file && validationResult?.canSubmit
                      ? "border-emerald-400 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 hover:border-teal-500/50 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]"
              }`}
            >
              <Upload className="mb-2 h-7 w-7 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {file ? (
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{file.name}</span>
                ) : (
                  <>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">Drag and drop manuscript here</span> or click to browse
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Accepted formats: .pdf, .doc, .docx (IEEE double-column format recommended)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/40">
                Automated Gemini AI checks formatting, margins, fonts, and required sections
              </p>

              <div className="mt-4 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Document</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] ?? null;
                      handleFileChange(picked);
                    }}
                  />
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setValidationResult(null);
                      setValidationError(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Pre-Validation Status & Loading Spinner */}
          {validating && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-xs text-teal-800 dark:text-teal-300 shadow-sm"
            >
              <RefreshCw className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
              <div>
                <p className="font-semibold text-teal-900 dark:text-teal-200">
                  AI Format Auditor is evaluating document...
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-300/80">
                  Gemini AI is checking formatting, margins, fonts, and required sections...
                </p>
              </div>
            </motion.div>
          )}

          {/* Validation Error Banner (Network / Extraction / 422 with message) */}
          {!validating && validationError && !validationResult && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-300 bg-rose-50/95 dark:border-rose-500/30 dark:bg-rose-500/10 p-4 text-xs text-rose-900 dark:text-rose-200 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Validation Error</span>
                </div>
                <span className="rounded bg-rose-200 dark:bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-rose-800 dark:text-rose-300">
                  Upload Stopped • Unsaved
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                {validationError}
              </p>
            </motion.div>
          )}

          {/* Formatting Feedback Card: Font errors, Layout mistakes, Missing sections, Actionable fix suggestions */}
          {!validating && validationResult && (!validationResult.canSubmit || validationResult.status === "FAILED") && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-300 bg-rose-50/95 dark:border-rose-500/30 dark:bg-rose-500/10 p-5 text-xs text-rose-900 dark:text-rose-200 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-bold">
                    Format Checks Failed (Compliance: {validationResult.overallScore}/100)
                  </span>
                </div>
                <span className="rounded-full bg-rose-200 dark:bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                  Upload Stopped • Unsaved
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300 font-medium">
                {validationResult.summaryMessage}
              </p>

              {/* Font Errors */}
              {((validationResult.fonts?.feedback?.length ?? 0) > 0 || !validationResult.fonts?.standardCompliance) && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-500/20 space-y-1">
                  <p className="font-bold text-[11px] text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    Font Errors:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 dark:text-rose-300">
                    {validationResult.fonts?.feedback?.length
                      ? validationResult.fonts.feedback.map((f, i) => <li key={`font-${i}`}>{f}</li>)
                      : <li>Non-compliant typography detected. Please use IEEE standard conference fonts (Times New Roman, Arial, Helvetica).</li>
                    }
                  </ul>
                </div>
              )}

              {/* Layout Mistakes (Margins, Columns, Page Structure) */}
              {((validationResult.formatting?.feedback?.length ?? 0) > 0 || (validationResult.pageLayout?.feedback?.length ?? 0) > 0) && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-500/20 space-y-1">
                  <p className="font-bold text-[11px] text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    Layout Mistakes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 dark:text-rose-300">
                    {validationResult.formatting?.feedback?.map((l, i) => (
                      <li key={`fmt-${i}`}>{l}</li>
                    ))}
                    {validationResult.pageLayout?.feedback?.map((p, i) => (
                      <li key={`lay-${i}`}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Mandatory Sections */}
              {validationResult.mandatorySections?.some((s) => !s.present || s.status !== "FOUND") && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-500/20 space-y-1">
                  <p className="font-bold text-[11px] text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    Missing Mandatory Sections:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 dark:text-rose-300">
                    {validationResult.mandatorySections
                      .filter((s) => !s.present || s.status !== "FOUND")
                      .map((s, i) => (
                        <li key={`sec-${i}`}>
                          <strong className="text-rose-900 dark:text-rose-100">{s.sectionName}</strong>: {s.feedback || "Mandatory section is missing or incomplete"}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Actionable Fix Suggestions */}
              {((validationResult.studentActionableFeedback?.length ?? 0) > 0) && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-500/20 space-y-1">
                  <p className="font-bold text-[11px] text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    Actionable Fix Suggestions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 dark:text-rose-300">
                    {validationResult.studentActionableFeedback.map((fix, idx) => (
                      <li key={`fix-${idx}`}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Green Format Verified Badge (canSubmit === true) */}
          {!validating && validationResult && validationResult.canSubmit && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                    Document Format Validated (Score: {validationResult.overallScore}/100)
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                    Margins, fonts, layouts, and all mandatory sections verified by Gemini AI. Cleared for submission.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm shrink-0">
                <Check className="h-3.5 w-3.5" />
                Format Verified
              </span>
            </motion.div>
          )}

          {/* Submit Report Button */}
          <button
            type="submit"
            disabled={
              submitting ||
              validating ||
              !file ||
              !validationResult ||
              !validationResult.canSubmit ||
              !selectedTrack
            }
            className="w-full rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black py-3 text-xs font-semibold uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Submitting Report...
              </span>
            ) : (
              "Submit Report"
            )}
          </button>
          {file && validationResult && !validationResult.canSubmit && (
            <p className="text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
              'Submit Report' button is disabled until document formatting errors are corrected.
            </p>
          )}
          {!file && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Please upload and verify your manuscript document to enable submission.
            </p>
          )}
          {!selectedTrack && (
            <p className="text-center text-xs text-slate-500 dark:text-white/50">
              Please select a track to submit.
            </p>
          )}
        </form>
      )}
    </Overlay>
  );
}

export function Stepper({ paper }: { paper: Paper }) {
  const idx = stageIndex(paper.status);
  const bad = paper.status === "Rejected";
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/[0.02] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs text-slate-400 dark:text-white/50">{paper.id}</p>
          <h4 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
            {paper.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-white/70">{paper.author}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            bad
              ? "border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
              : paper.status === "Accepted"
                ? "border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : paper.status === "Revision Needed"
                  ? "border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
          }`}
        >
          {paper.status}
        </span>
      </div>
      <div className="mt-7 grid grid-cols-5 gap-2">
        {STAGES.map((s, i) => (
          <div key={s}>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <motion.div
                className={
                  bad && i === idx ? "h-full bg-rose-500" : "h-full bg-teal-500 dark:bg-teal-400"
                }
                initial={{ width: 0 }}
                animate={{ width: i <= idx ? "100%" : "0%" }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              />
            </div>
            <p
              className={`mt-2 text-[10px] leading-tight ${i <= idx ? "font-semibold text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/40"}`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "Under Review").toLowerCase();
  if (norm.includes("accept")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300">
        <CheckCircle2 size={12} /> Accepted
      </span>
    );
  }
  if (norm.includes("revision")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300">
        <Clock size={12} /> Revision Needed
      </span>
    );
  }
  if (norm.includes("reject")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300">
        <AlertCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300">
      <Clock size={12} /> Under Review
    </span>
  );
}

export interface TrackModalProps {
  isOpen?: boolean;
  papers?: Paper[];
  initial?: string;
  initialQuery?: string;
  onClose: () => void;
}

export function TrackModal({
  isOpen = true,
  papers = [],
  initial = "",
  initialQuery,
  onClose,
}: TrackModalProps) {
  if (isOpen === false) return null;
  const startQuery = initialQuery || initial || "";
  const [q, setQ] = useState(startQuery);
  const [trackedResults, setTrackedResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const performSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      let builder = supabase.from("papers").select("*");

      if (isUuid) {
        builder = builder.eq("id", trimmed);
      } else if (trimmed.includes("@")) {
        builder = builder.ilike("author_email", trimmed.toLowerCase());
      } else {
        builder = builder.or(`paper_title.ilike.%${trimmed}%,author_name.ilike.%${trimmed}%`);
      }

      const { data, error } = await builder.order("created_at", { ascending: false });
      if (error) throw error;
      setTrackedResults(data || []);
    } catch {
      // Fallback to local papers
      const localMatches = papers.filter(
        (p) =>
          p.id.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.author.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.title.toLowerCase().includes(trimmed.toLowerCase()),
      );
      setTrackedResults(localMatches);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startQuery.trim()) {
      performSearch(startQuery);
    }
  }, [startQuery]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-5">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display flex items-center gap-2">
          <Search size={22} className="text-teal-600 dark:text-teal-400" />
          <span>Track Manuscript Status</span>
        </h3>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          performSearch(q);
        }}
        className="mb-5"
      >
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Search by Tracking ID, Author Email, or Paper Title:
        </label>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. author@univ.edu or paper UUID"
            className={input}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black px-5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0 shadow cursor-pointer"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            <span>Lookup</span>
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600 dark:text-teal-400" />
          <p className="text-xs font-medium">Querying Supabase database...</p>
        </div>
      ) : hasSearched && trackedResults && trackedResults.length > 0 ? (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Found {trackedResults.length} matching scholarly record{trackedResults.length > 1 ? "s" : ""}:
          </p>
          {trackedResults.map((paper: any) => (
            <div
              key={paper.id}
              className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-slate-50/80 dark:bg-white/[0.03] p-4 text-xs space-y-2"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    {paper.track || (paper.tracks && paper.tracks[0]) || "General"}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {paper.paper_title || paper.title}
                  </h4>
                </div>
                <StatusBadge status={paper.status} />
              </div>

              <div className="text-slate-600 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">
                  {paper.author_name || paper.author}
                </strong>{" "}
                • {paper.department || "Electronics & Telecommunication Engineering"}
              </div>

              {paper.abstract && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {paper.abstract}
                </p>
              )}

              <div className="flex justify-between items-center border-t border-slate-200/80 dark:border-white/10 pt-2.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(paper.id)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  {copiedId === paper.id ? (
                    <Check size={11} className="text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span>ID: {paper.id.slice(0, 13)}...</span>
                </button>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : (paper.submittedAt || "")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched && (!trackedResults || trackedResults.length === 0) ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <AlertCircle size={28} className="mx-auto mb-2 text-rose-500 opacity-60" />
          <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No Records Found
          </h5>
          <p className="text-xs">
            No papers matched "{q}". Please verify the email or paper identifier.
          </p>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 dark:text-slate-500">
          <Search size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Enter your registration email or paper UUID above to track peer review status.
          </p>
        </div>
      )}
    </Overlay>
  );
}

export function AdminPanel({ papers, onClose }: { papers: Paper[]; onClose: () => void }) {
  const set = (id: string, status: PaperStatus) =>
    savePapers(papers.map((p) => (p.id === id ? { ...p, status } : p)));
  return (
    <Overlay onClose={onClose} side>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
        Admin Portal
      </span>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
        Submissions Registry
      </h3>
      <div className="mt-6 space-y-4">
        {papers.map((p) => (
          <motion.div
            layout
            key={p.id}
            className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/[0.02] p-4 text-slate-900 dark:text-white"
          >
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-400 dark:text-white/50">
                  {p.id} · {p.tracks.join(", ") || "—"}
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{p.title}</p>
                <p className="text-xs text-slate-600 dark:text-white/70">{p.author}</p>
              </div>
              <span className="h-fit shrink-0 rounded-full border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-white/80">
                {p.status}
              </span>
            </div>
            <div className="mt-3.5 flex gap-2 border-t border-slate-200 dark:border-[#1f2430] pt-3">
              <button
                type="button"
                onClick={() => set(p.id, "Accepted")}
                className="rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => set(p.id, "Revision Needed")}
                className="rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 transition hover:bg-amber-100"
              >
                Revision
              </button>
              <button
                type="button"
                onClick={() => set(p.id, "Rejected")}
                className="rounded-lg border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 transition hover:bg-rose-100"
              >
                Reject
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </Overlay>
  );
}

// Aliases for Student Submission Panel
export const StudentPanel = SubmitModal;
export const StudentSubmission = SubmitModal;
export const StudentUpload = SubmitModal;

