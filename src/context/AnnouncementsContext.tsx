import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  tag?: string;
  category?: "General" | "Urgent" | "Deadline" | "Keynote" | string;
  date: string;
  pinned?: boolean;
}

export interface PublishAnnouncementInput {
  id?: string;
  title: string;
  body: string;
  tag?: string;
  category?: string;
  pinned?: boolean;
  date?: string;
}

export interface AnnouncementsContextType {
  announcements: Announcement[];
  isLoading: boolean;
  fetchAnnouncements: () => Promise<void>;
  publishAnnouncement: (data: PublishAnnouncementInput) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
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

const STORAGE_KEY = "ncatex_announcements";

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn("Could not read cached announcements:", err);
      }
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<Announcement[]>("/api/announcements");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAnnouncements(res.data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Failed to fetch /api/announcements, keeping local store:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();

    // Cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAnnouncements(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchAnnouncements]);

  const publishAnnouncement = useCallback(async (input: PublishAnnouncementInput): Promise<Announcement> => {
    const id = input.id || `ann-${Date.now()}`;
    const date = input.date || new Date().toLocaleDateString();
    const tag = input.tag?.trim() || input.category || "GENERAL";
    const newAnnouncement: Announcement = {
      id,
      title: input.title.trim(),
      body: input.body.trim(),
      tag,
      category: input.category || tag,
      date,
      pinned: Boolean(input.pinned),
    };

    try {
      await axios.post("/api/announcements", newAnnouncement);
    } catch (err) {
      console.warn("POST /api/announcements failed, persisting to store:", err);
    }

    setAnnouncements((prev) => {
      const updated = [newAnnouncement, ...prev.filter((a) => a.id !== newAnnouncement.id)];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    return newAnnouncement;
  }, []);

  const deleteAnnouncement = useCallback(async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/announcements/${id}`);
    } catch (err) {
      console.warn(`DELETE /api/announcements/${id} failed, removing locally:`, err);
    }

    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  return (
    <AnnouncementsContext.Provider
      value={{
        announcements,
        isLoading,
        fetchAnnouncements,
        publishAnnouncement,
        deleteAnnouncement,
      }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error("useAnnouncements must be used within an AnnouncementsProvider");
  }
  return context;
}
