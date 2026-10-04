import { useState, useEffect } from "react";
import { Download, FileText, CheckCircle2, FileCheck, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { useSettings, type WebsiteSettings } from "@/context/SettingsContext";
import type { PaperRecord } from "@/lib/supabase";

export interface SettingsProps {
  papers: PaperRecord[];
  acceptedCount: number;
  onShowToast?: (msg: string) => void;
  onExportCSV?: (dataset: PaperRecord[], filename: string) => void;
}

export function Settings({
  papers,
  acceptedCount,
  onShowToast,
  onExportCSV,
}: SettingsProps) {
  const { settings, loading: contextLoading, updateSettings } = useSettings();
  const [formData, setFormData] = useState<WebsiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  // Sync local form state when settings load from API
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      notify("Website content changes saved live across all public routes.");
    } catch {
      notify("Failed to save settings to server, updated locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (dataset: PaperRecord[], filename: string) => {
    if (onExportCSV) {
      onExportCSV(dataset, filename);
    } else {
      notify(`Exporting ${dataset.length} records to ${filename}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Data Export & Reports (6 cols) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Download size={18} className="text-teal-500" />
            <span>Comprehensive Data Export</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Generate instant export compendiums for institutional indexing, IEEE proceedings, and conference secretariat records.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleExport(papers, "ncatex-all-papers-compendium.csv")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1f2430] hover:border-teal-500/50 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-teal-500" />
                <span>Export All Submitted Papers ({papers.length})</span>
              </div>
              <Download size={14} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleExport(
                  papers.filter((p) => p.status === "Accepted"),
                  "ncatex-accepted-for-proceedings.csv",
                )
              }
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1f2430] hover:border-teal-500/50 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>Export Accepted Papers for Proceedings ({acceptedCount})</span>
              </div>
              <Download size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Certificate Verification System */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck size={18} className="text-teal-500" />
            <span>Certificate Management &amp; Verification</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Automatic verification ID generator for presentation and acceptance certificates.
          </p>

          <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-800 dark:text-teal-300">
                Verification ID Pattern:
              </span>
              <span className="font-mono text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded">
                NCATEX-CERT-XXXXX
              </span>
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-300/80">
              Eligible accepted papers: {acceptedCount}. Authors can verify authenticity directly through the public tracking portal.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Live Website Content Settings (6 cols) */}
      <div className="lg:col-span-6 space-y-6">
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <SettingsIcon size={18} className="text-teal-500" />
              <span>Website Content &amp; Meta Settings</span>
            </h3>
            {contextLoading && <Loader2 size={13} className="animate-spin text-teal-500" />}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hero Main Title:
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 font-semibold text-slate-900 dark:text-white focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hero Subtitle:
              </label>
              <textarea
                rows={2}
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dates:
                </label>
                <input
                  type="text"
                  value={formData.dates}
                  onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 font-mono focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Venue:
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Save Website Content Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
