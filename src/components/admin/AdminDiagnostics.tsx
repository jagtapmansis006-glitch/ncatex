import React from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export interface DiagnosticMetrics {
  pendingPdf: number;
  revisionDelays: number;
  incompleteAbstracts: number;
  aiFlagged: number;
}

export interface DiagnosticChartItem {
  name: string;
  count: number;
  color: string;
}

interface AdminDiagnosticsProps {
  metrics: DiagnosticMetrics;
  diagnosticChartData: DiagnosticChartItem[];
  totalPapers: number;
  onViewAllProblemSubmissions: () => void;
}

export function AdminDiagnostics({
  metrics,
  diagnosticChartData,
  totalPapers,
  onViewAllProblemSubmissions,
}: AdminDiagnosticsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-amber-500" />
            <span>Diagnostic &amp; Submission Bottleneck Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identifies where authors are stuck across manuscript upload, format audits, and peer revisions
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllProblemSubmissions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>View All Problem Submissions</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending PDF Uploads Card */}
        <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Missing Manuscript PDF
            </span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {metrics.pendingPdf}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Submissions registered without an attached PDF draft file in Supabase Storage.
          </p>
        </div>

        {/* Revision Delays Card */}
        <div className="rounded-xl border border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              Revision Pending
            </span>
            <Clock size={15} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {metrics.revisionDelays}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Authors notified of required revisions awaiting camera-ready updates.
          </p>
        </div>

        {/* Incomplete Abstracts Card */}
        <div className="rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Incomplete Abstract
            </span>
            <AlertCircle size={15} className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {metrics.incompleteAbstracts}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Abstract text is unusually brief or missing structured technical contributions.
          </p>
        </div>

        {/* Format Audit Warnings Card */}
        <div className="rounded-xl border border-teal-300 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              AI Pre-Screened
            </span>
            <Sparkles size={15} className="text-teal-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {metrics.aiFlagged}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Incoming papers evaluated by Gemini AI format auditor with triage notes.
          </p>
        </div>
      </div>

      {/* Horizontal Bottleneck Visual Bars */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Diagnostic Risk Weight Distribution
        </h4>
        <div className="space-y-2.5">
          {diagnosticChartData.map((d) => {
            const pct = totalPapers ? Math.round((d.count / totalPapers) * 100) : 0;
            return (
              <div key={d.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{d.name}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {d.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pct || (d.count ? 8 : 0))}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminDiagnostics;
