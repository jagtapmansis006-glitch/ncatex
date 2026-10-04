import { createClient } from "@supabase/supabase-js";

function getEnvVar(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv?.[key]) {
      return metaEnv[key];
    }
  } catch {
    // Ignore in non-Vite environments
  }

  try {
    const procEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })?.process?.env;
    if (procEnv?.[key]) {
      return procEnv[key];
    }
  } catch {
    // Ignore in non-Node environments
  }

  return undefined;
}

const supabaseUrl =
  getEnvVar("VITE_SUPABASE_URL") ||
  getEnvVar("SUPABASE_URL") ||
  "https://wxtvqbwzdpbroavijxpq.supabase.co";

const supabaseAnonKey =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ||
  getEnvVar("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dHZxYnd6ZHBicm9hdmlqeHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NDcwMTgsImV4cCI6MjEwNjUyMzAxOH0.M0VNLA5ztSYs1Naq77SegO3A6juIOcwqjI5PmE5eSZA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PaperRecord {
  id: string;
  created_at: string;
  author_name: string;
  author_email: string;
  department: string;
  track: string;
  paper_title: string;
  abstract: string;
  status:
    | "Submitted"
    | "Under Review"
    | "Revision Required"
    | "Revision Needed"
    | "Accepted"
    | "Rejected";
  file_url?: string | null;
  pdf_url?: string | null;
}
