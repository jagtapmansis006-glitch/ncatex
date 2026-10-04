import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  LogIn,
  LogOut,
  ShieldCheck,
  GraduationCap,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "@/context/ThemeContext";
import { useAuth } from "@/lib/auth";

const EASE = [0.16, 1, 0.3, 1] as const;

export interface NavbarProps {
  onSubmit?: (() => void) | undefined;
  onTrack?: (() => void) | undefined;
  roleOverride?: "student" | "admin" | "public" | undefined;
}

export function Logo() {
  return (
    <img
      src="/assets/ncatex-logo.png"
      alt="NCATEX Logo"
      className="h-8 w-auto md:h-10 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-transform duration-200 hover:scale-105 shrink-0"
    />
  );
}

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Tracks", href: "#tracks" },
  { label: "Dates", href: "#dates" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar({ onSubmit, onTrack, roleOverride }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();

  const effectiveRole =
    roleOverride !== undefined ? (roleOverride === "public" ? null : roleOverride) : role;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler
  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const targetId = href.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      } else if (href === "#overview" || href === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
        isScrolled
          ? "bg-white/85 dark:bg-[#08090d]/90 border-b border-slate-200/80 dark:border-[#1f2430] shadow-md shadow-slate-900/5 dark:shadow-black/20"
          : "bg-white/70 dark:bg-[#08090d]/75 border-b border-slate-200/40 dark:border-[#1f2430]/60"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <a
            href="#top"
            onClick={(e) => handleScrollClick(e, "#top")}
            className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold text-sm sm:text-base tracking-tight hover:opacity-95 transition-opacity"
          >
            <Logo />
            <span className="font-display font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
              NCATEX
            </span>
          </a>

          {/* Desktop Smooth-Scroll Links [ Overview | Tracks | Dates | FAQ ] */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollClick(e, link.href)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* =========================================================================
            Role-Based Access Control Actions (Right Side)
            ========================================================================= */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* CASE 1: PUBLIC / GUEST (NOT LOGGED IN) */}
          {!effectiveRole && (
            <>
              {/* Single Login Button */}
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-white shadow-sm transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 hover:shadow-md hover:shadow-teal-500/10"
              >
                <LogIn size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Login</span>
              </a>
            </>
          )}

          {/* CASE 2: LOGGED IN AS STUDENT */}
          {effectiveRole === "student" && (
            <>
              {/* [ My Submissions ] Quick Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTrack?.();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
              >
                <FileText size={13} className="text-teal-600 dark:text-teal-400" />
                <span>My Submissions</span>
              </button>

              {/* [ Submit Paper ] Modal Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-[#0b0c10] px-4 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 hover:shadow-lg hover:shadow-teal-500/20 transition-all cursor-pointer"
              >
                <span>Submit Paper</span>
                <ArrowRight size={13} />
              </button>

              {/* Account / Student Badge & Logout */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/10">
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5">
                  <GraduationCap size={12} className="text-teal-500" />
                  <span className="truncate max-w-[120px]">{user?.email || "Student"}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out of student portal"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}

          {/* CASE 3: LOGGED IN AS ADMIN */}
          {effectiveRole === "admin" && (
            <>
              {/* [ Admin Dashboard ] Link */}
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/15 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-500/25 transition-all shadow-sm active:scale-95"
              >
                <ShieldCheck size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Admin Dashboard</span>
              </a>

              {/* Admin Logout */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of admin control center"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          )}

          {/* Dark / Light Mode Switch */}
          <div className="pl-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Controls: ThemeToggle + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-2 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Menu with Matching Dark Theme */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 dark:border-[#1f2430] bg-white/95 dark:bg-[#08090d]/95 backdrop-blur-xl md:hidden px-4 py-5 shadow-2xl"
          >
            <div className="space-y-3">
              {/* Mobile Smooth Scroll Links */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleScrollClick(e, link.href)}
                    className="flex items-center rounded-xl p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Mobile Actions by Role */}
              <div className="space-y-2 pt-1">
                {/* Public Role Mobile */}
                {!effectiveRole && (
                  <a
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <LogIn size={14} className="text-teal-600 dark:text-teal-400" />
                    <span>Login</span>
                  </a>
                )}

                {/* Student Role Mobile */}
                {effectiveRole === "student" && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                        onSubmit?.();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
                    >
                      <span>Submit Paper</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                        onTrack?.();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <FileText size={14} className="text-teal-500" />
                      <span>My Submissions / Track Paper</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300"
                    >
                      <LogOut size={13} />
                      <span>Logout ({user?.email || "Student"})</span>
                    </button>
                  </div>
                )}

                {/* Admin Role Mobile */}
                {effectiveRole === "admin" && (
                  <div className="space-y-2">
                    <a
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/15 py-2.5 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-500/20 transition-colors"
                    >
                      <ShieldCheck size={14} />
                      <span>Admin Dashboard</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300"
                    >
                      <LogOut size={13} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
