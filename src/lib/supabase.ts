import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  "https://wxtvqbwzdpbroavijxpq.supabase.co";
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ||
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
}
