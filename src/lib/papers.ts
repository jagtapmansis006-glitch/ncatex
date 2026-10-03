export type PaperStatus =
  "Submitted" | "Under Review" | "Revision Needed" | "Accepted" | "Rejected";

export type Paper = {
  id: string;
  title: string;
  author: string;
  email: string;
  abstract: string;
  tracks: string[];
  fileName?: string;
  fileUrl?: string;
  status: PaperStatus;
  submittedAt: string;
};

const KEY = "ncatex_papers";
const EVT = "ncatex_papers_changed";

const SEED: Paper[] = [
  {
    id: "NCATEX-101",
    title: "Low-Power CNN Accelerator on 28nm FPGA",
    author: "Aarav Mehta",
    email: "aarav@example.com",
    abstract: "An energy-efficient accelerator for edge inference.",
    tracks: ["VLSI", "AI/ML"],
    status: "Accepted",
    submittedAt: "2026-01-12",
  },
  {
    id: "NCATEX-102",
    title: "Beamforming Strategies for mmWave 5G Small Cells",
    author: "Priya Nair",
    email: "priya@example.com",
    abstract: "Adaptive beamforming for dense urban deployments.",
    tracks: ["5G Communication"],
    status: "Under Review",
    submittedAt: "2026-01-20",
  },
  {
    id: "NCATEX-103",
    title: "LoRa-based Soil Moisture Mesh for Smart Farms",
    author: "Rohan Kulkarni",
    email: "rohan@example.com",
    abstract: "A long-range IoT sensing network.",
    tracks: ["IoT"],
    status: "Revision Needed",
    submittedAt: "2026-02-02",
  },
];

export function loadPapers(): Paper[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED;
  }
}

export function savePapers(p: Paper[]) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent(EVT, { detail: p }));
}

export function nextId(p: Paper[]) {
  const max = p.reduce((m, x) => Math.max(m, parseInt(x.id.split("-")[1] ?? "0") || 0), 103);
  return `NCATEX-${max + 1}`;
}

export const PAPERS_EVENT = EVT;

export const STAGES = ["Submitted", "Initial Screening", "Peer Review", "Decision", "Camera Ready"];

export function stageIndex(s: PaperStatus) {
  switch (s) {
    case "Submitted":
      return 1;
    case "Under Review":
      return 2;
    case "Revision Needed":
      return 3;
    case "Rejected":
      return 3;
    case "Accepted":
      return 4;
  }
}
