export interface Announcement {
  id: string;
  title: string;
  body: string;
  category?: "General" | "Urgent" | "Deadline" | "Keynote" | string;
  tag?: string;
  date: string;
  pinned?: boolean;
}

export interface MilestoneItem {
  id: string;
  label: string;
  date: string;
  status: "Completed" | "Upcoming" | "Scheduled";
}

export interface WebsiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  venue: string;
  dates: string;
}

export interface ReviewerMember {
  id: string;
  name: string;
  email: string;
  track: string;
  assignedCount: number;
  completedCount: number;
  rating: number;
}

// In-memory live store for Admin Control Center
let liveAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "IEEE & Scopus Indexing Agreement Finalized",
    body: "All presented papers will proceed directly into indexed proceedings post-conference presentation.",
    category: "General",
    tag: "SCOPUS INDEXED",
    date: "Feb 02",
    pinned: true,
  },
  {
    id: "ann-2",
    title: "AI Format Audit Active on Manuscript Submissions",
    body: "Authors must ensure their uploaded PDF matches IEEE double-column margins to obtain instant format validation.",
    category: "Urgent",
    tag: "AI AUDIT",
    date: "Jan 28",
    pinned: true,
  },
];

let liveMilestones: MilestoneItem[] = [
  { id: "d1", label: "Call for Papers Opens", date: "Jan 15", status: "Completed" },
  { id: "d2", label: "Paper Submission Deadline", date: "Feb 20", status: "Upcoming" },
  { id: "d3", label: "Peer Review Notification", date: "Mar 05", status: "Scheduled" },
  { id: "d4", label: "Camera-Ready Submission", date: "Mar 15", status: "Scheduled" },
  { id: "d5", label: "Official Conference Days", date: "Apr 10–11", status: "Scheduled" },
];

let liveSettings: WebsiteSettings = {
  heroTitle: "NCATEX",
  heroSubtitle: "National Conference on Advanced Trends in Electronics and Telecommunication Engineering",
  venue: "NCATEX Campus / Hybrid Virtual",
  dates: "April 10–11",
};

let liveCommittee: ReviewerMember[] = [
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

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}

export async function handleAdminApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      },
    });
  }

  // 1. Announcements Endpoints
  if (pathname === "/api/announcements") {
    if (request.method === "GET") {
      return jsonResponse(liveAnnouncements);
    }

    if (request.method === "POST") {
      try {
        const payload = (await request.json()) as Partial<Announcement>;
        const tag = payload.tag?.trim() || payload.category || "GENERAL";
        const newAnn: Announcement = {
          id: payload.id || `ann-${Date.now()}`,
          title: payload.title?.trim() || "Untitled Announcement",
          body: payload.body?.trim() || "",
          category: payload.category || tag,
          tag,
          date: payload.date || new Date().toLocaleDateString(),
          pinned: Boolean(payload.pinned),
        };
        liveAnnouncements = [newAnn, ...liveAnnouncements];
        return jsonResponse(newAnn, 201);
      } catch (err: unknown) {
        return jsonResponse({ error: "Invalid announcement payload" }, 400);
      }
    }
  }

  if (pathname.startsWith("/api/announcements/") && request.method === "DELETE") {
    const id = pathname.replace("/api/announcements/", "");
    liveAnnouncements = liveAnnouncements.filter((a) => a.id !== id);
    return jsonResponse({ success: true, id });
  }

  // 2. Milestones / Important Dates Endpoints
  if (pathname === "/api/milestones" && request.method === "GET") {
    return jsonResponse(liveMilestones);
  }

  if (pathname.startsWith("/api/milestones/") && request.method === "PUT") {
    const id = pathname.replace("/api/milestones/", "");
    try {
      const payload = (await request.json()) as Partial<MilestoneItem>;
      const existing = liveMilestones.find((m) => m.id === id);
      if (existing) {
        Object.assign(existing, payload);
        return jsonResponse(existing);
      } else {
        const created: MilestoneItem = {
          id,
          label: payload.label || "New Milestone",
          date: payload.date || "TBD",
          status: payload.status || "Scheduled",
        };
        liveMilestones.push(created);
        return jsonResponse(created);
      }
    } catch {
      return jsonResponse({ error: "Invalid milestone update" }, 400);
    }
  }

  // 3. Settings Endpoints
  if (pathname === "/api/settings") {
    if (request.method === "GET") {
      return jsonResponse(liveSettings);
    }
    if (request.method === "PUT") {
      try {
        const payload = (await request.json()) as Partial<WebsiteSettings>;
        liveSettings = {
          ...liveSettings,
          ...payload,
        };
        return jsonResponse(liveSettings);
      } catch {
        return jsonResponse({ error: "Invalid settings payload" }, 400);
      }
    }
  }

  // 4. Reviewer Committee Endpoints
  if (pathname === "/api/committee" && request.method === "GET") {
    return jsonResponse(liveCommittee);
  }

  return null;
}
