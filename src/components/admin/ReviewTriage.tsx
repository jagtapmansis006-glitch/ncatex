import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { SlidersHorizontal, Users, Loader2 } from "lucide-react";
import type { ReviewerMember } from "@/server/admin-api";

export interface ReviewTriageProps {
  onShowToast?: (msg: string) => void;
}

const DEFAULT_COMMITTEE: ReviewerMember[] = [
  {
    id: "rev-1",
    name: "Dr. Anand Verma",
    email: "a.verma@ncatex.edu",
    track: "Artificial Intelligence & Machine Learning",
    assignedCount: 14,
    completedCount: 11,
    rating: 4.9,
  },
  {
    id: "rev-2",
    name: "Prof. Sunita Rao",
    email: "s.rao@ncatex.edu",
    track: "VLSI & Embedded Systems",
    assignedCount: 10,
    completedCount: 8,
    rating: 4.8,
  },
  {
    id: "rev-3",
    name: "Dr. Rajesh Iyer",
    email: "r.iyer@ncatex.edu",
    track: "5G & Next-Gen Wireless Communications",
    assignedCount: 9,
    completedCount: 8,
    rating: 4.7,
  },
  {
    id: "rev-4",
    name: "Dr. Meera Deshmukh",
    email: "m.deshmukh@ncatex.edu",
    track: "Internet of Things (IoT) & Smart Sensors",
    assignedCount: 12,
    completedCount: 10,
    rating: 4.9,
  },
  {
    id: "rev-5",
    name: "Prof. Vikram Joshi",
    email: "v.joshi@ncatex.edu",
    track: "Digital Signal & Image Processing",
    assignedCount: 8,
    completedCount: 7,
    rating: 4.8,
  },
];

export function ReviewTriage({ onShowToast }: ReviewTriageProps) {
  // 1. Scoring Calculator State
  const [evaluationScores, setEvaluationScores] = useState({
    innovation: 80,
    techQuality: 85,
    methodology: 80,
    presentation: 75,
    impact: 80,
  });

  // 2. Dynamic Committee Members
  const [committee, setCommittee] = useState<ReviewerMember[]>(DEFAULT_COMMITTEE);
  const [loadingCommittee, setLoadingCommittee] = useState(false);

  // Fetch committee from live API backend: GET /api/committee
  useEffect(() => {
    let isMounted = true;
    const fetchCommittee = async () => {
      setLoadingCommittee(true);
      try {
        const res = await axios.get<ReviewerMember[]>("/api/committee");
        if (isMounted && Array.isArray(res.data)) {
          setCommittee(res.data);
        }
      } catch (err) {
        console.warn("Failed to fetch /api/committee, using default state:", err);
      } finally {
        if (isMounted) setLoadingCommittee(false);
      }
    };

    fetchCommittee();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute weighted score dynamically:
  // Score = (Innovation * 0.25) + (TechQuality * 0.25) + (Methodology * 0.20) + (Presentation * 0.20) + (Impact * 0.10)
  const computedScore = useMemo(() => {
    const s = evaluationScores;
    const score =
      s.innovation * 0.25 +
      s.techQuality * 0.25 +
      s.methodology * 0.2 +
      s.presentation * 0.2 +
      s.impact * 0.1;
    return Math.round(score * 10) / 10;
  }, [evaluationScores]);

  const recommendation = useMemo(() => {
    if (computedScore >= 75) {
      return {
        label: "Recommendation: Accept",
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
      };
    }
    if (computedScore >= 60) {
      return {
        label: "Recommendation: Revision",
        className: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30",
      };
    }
    return {
      label: "Recommendation: Reject",
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    };
  }, [computedScore]);

  const criteriaList = [
    { key: "innovation" as const, label: "Innovation (25%)", weight: 0.25 },
    { key: "techQuality" as const, label: "Tech Quality (25%)", weight: 0.25 },
    { key: "methodology" as const, label: "Methodology (20%)", weight: 0.2 },
    { key: "presentation" as const, label: "Presentation (20%)", weight: 0.2 },
    { key: "impact" as const, label: "Impact (10%)", weight: 0.1 },
  ];

  return (
    <div className="space-y-6">
      {/* Weighted Peer Review & Scoring Calculator */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-teal-500" />
              <span>Weighted Peer Review &amp; Scoring Calculator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive standard rubric: Innovation (25%), Tech Quality (25%), Methodology (20%), Presentation (20%), Impact (10%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Weighted Score</span>
              <p className="text-3xl font-bold font-display text-teal-600 dark:text-teal-400">
                {computedScore}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </p>
            </div>

            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${recommendation.className}`}>
              {recommendation.label}
            </span>
          </div>
        </div>

        {/* Interactive Criteria Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {criteriaList.map((crit) => {
            const val = evaluationScores[crit.key];
            return (
              <div
                key={crit.key}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2"
              >
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{crit.label}</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded">
                    {val}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e) =>
                    setEvaluationScores((prev) => ({
                      ...prev,
                      [crit.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviewer Committee Directory */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-teal-500" />
              <span>Technical Review Committee</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track reviewer assignments, double-blind progress, and peer evaluation completion
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loadingCommittee && <Loader2 size={13} className="animate-spin text-teal-500" />}
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
              {committee.length} Active Reviewers
            </span>
          </div>
        </div>

        {/* Reviewer Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committee.map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-2 hover:border-teal-500/40 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{rev.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{rev.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  ⭐ {rev.rating}
                </span>
              </div>

              <p className="text-[11px] text-teal-700 dark:text-teal-300 truncate font-medium">
                {rev.track}
              </p>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500 text-[11px]">
                  Assigned: <strong>{rev.assignedCount}</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  Done: {rev.completedCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewTriage;
