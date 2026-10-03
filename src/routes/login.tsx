import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/context/ThemeContext";
import { setStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "NCATEX 2026 – Conference Portal Login" },
      {
        name: "description",
        content:
          "Sign in to the NCATEX 2026 Student Submission or Academic Reviewer Portal.",
      },
      { property: "og:title", content: "NCATEX 2026 – Conference Portal Login" },
      { property: "og:description", content: "Student and admin / reviewer access to the NCATEX 2026 conference portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const EASE = [0.16, 1, 0.3, 1] as const;

const inputClass =
  "w-full rounded-xl border border-slate-200 dark:border-[#1f2430] bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none transition focus:border-teal-500 focus:bg-white dark:focus:border-teal-500 dark:focus:bg-white/[0.06]";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock authentication delay for realistic UX feedback
    await new Promise((resolve) => setTimeout(resolve, 350));

    const userEmail = email.trim() || (tab === "student" ? "student@ncatex.edu" : "admin@ncatex.edu");
    setStoredUser({
      role: tab,
      email: userEmail,
      name: tab === "student" ? "Student Author" : "Conference Administrator",
    });

    if (tab === "student") {
      // Redirect student to home with author session active
      navigate({ to: "/" });
    } else {
      // Redirect admin to administration & reviewer portal
      navigate({ to: "/admin" });
    }
  };

  const handleQuickFill = (type: "student" | "admin") => {
    setTab(type);
    if (type === "student") {
      setEmail("student@ncatex.edu");
      setPassword("student123");
    } else {
      setEmail("admin@ncatex.edu");
      setPassword("admin2026");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors duration-200 font-sans">
      {/* Background subtle radial lighting glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent blur-3xl opacity-70 dark:opacity-40" />

      {/* Top Header Bar */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between py-2 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-white/80 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Conference Home</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img
              src="/assets/ncatex-logo.png"
              alt="NCATEX 2026 Logo"
              className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            />
            <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              NCATEX 2026
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Glassmorphic Login Card */}
      <main className="my-auto flex items-center justify-center py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#1f2430] bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl text-slate-900 dark:text-white"
        >
          {/* Card Icon & Title */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400">
              {tab === "student" ? (
                <GraduationCap size={24} />
              ) : (
                <ShieldCheck size={24} />
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display text-slate-900 dark:text-white">
              {tab === "student" ? "Author Portal Sign In" : "Reviewer Portal Sign In"}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
              {tab === "student"
                ? "Submit research papers and track peer review status"
                : "Academic committee and double-blind triage access"}
            </p>
          </div>

          {/* Tab Switches: [ Student Login ] | [ Admin / Reviewer Login ] */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab("student")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                tab === "student"
                  ? "bg-white dark:bg-teal-500 text-slate-900 dark:text-black shadow-sm font-bold"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap size={14} />
              <span>Student / Author</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("admin")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                tab === "admin"
                  ? "bg-white dark:bg-teal-500 text-slate-900 dark:text-black shadow-sm font-bold"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              <span>Admin / Reviewer</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {tab === "student" ? "Student Registration Email" : "Admin / Reviewer Email"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tab === "student" ? "scholar@university.edu" : "admin@ncatex.edu"}
                  className={inputClass}
                />
                <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact the NCATEX secretariat at support@ncatex.edu for password resets.");
                  }}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-white/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/20 text-teal-500 focus:ring-teal-400"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">
                NCATEX 2026 Auth
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] py-3 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-teal-500" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {tab === "student" ? "Author Portal" : "Admin Panel"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Test Helper for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-white/40 text-center mb-2">
              Quick One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("student")}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-2 text-left hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <GraduationCap size={11} className="text-teal-500" />
                  <span>Student Demo</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/50 truncate font-mono mt-0.5">
                  student@ncatex.edu
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-2 text-left hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck size={11} className="text-teal-500" />
                  <span>Admin Demo</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/50 truncate font-mono mt-0.5">
                  admin@ncatex.edu
                </p>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl py-4 text-center text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
        © 2026 2nd National Conference on Advanced Trends in Engineering (NCATEX) • All rights reserved.
      </footer>
    </div>
  );
}

export default LoginPage;
