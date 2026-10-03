import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In – NCATEX 2026 Portal" },
      { name: "description", content: "Sign in to the NCATEX 2026 portal as a student author or an admin / reviewer." },
      { property: "og:title", content: "Sign In – NCATEX 2026 Portal" },
      { property: "og:description", content: "Student and admin / reviewer access to the NCATEX 2026 conference portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [tab, setTab] = useState<"student" | "admin">("student");
  const navigate = useNavigate();
  const field =
    "w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-teal-400";
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#090D16] px-4 text-white">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-teal-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={14} /> Back to NCATEX 2026
        </Link>
        <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-white/60">Sign in to the NCATEX 2026 portal.</p>
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
            {(["student", "admin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-teal-500 text-slate-950" : "text-white/70 hover:text-white"}`}
              >
                {t === "student" ? "Student Login" : "Admin / Reviewer Login"}
              </button>
            ))}
          </div>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: tab === "admin" ? "/admin" : "/" });
            }}
          >
            <label className="relative block">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="email" required placeholder="Email address" className={field} />
            </label>
            <label className="relative block">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="password" required placeholder="Password" className={field} />
            </label>
            <button type="submit" className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
