import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "ncatex_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use a deterministic SSR initial state to ensure server and client match during hydration
  const [theme, setThemeState] = useState<Theme>("dark");
  const [systemDark, setSystemDark] = useState<boolean>(true);

  useEffect(() => {
    // Read local storage or system preference safely on client mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        setThemeState(saved);
      }
    } catch {
      // Fallback
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      return systemDark ? "dark" : "light";
    }
    return theme;
  }, [theme, systemDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering client-specific theme attributes during SSR hydration
  if (!mounted) {
    return (
      <div
        className={`relative inline-flex h-8 w-16 items-center rounded-full border border-slate-300 dark:border-white/10 bg-slate-200/80 dark:bg-slate-800/80 p-1 opacity-70 ${className}`}
        aria-hidden="true"
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      className={`group relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border p-1 transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
        isDark
          ? "border-slate-700/80 bg-[#0f1422] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
          : "border-slate-300 bg-slate-200/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle light and dark theme"
    >
      {/* Background Track Icons */}
      <span className="absolute left-2 flex items-center justify-center text-amber-500/70 pointer-events-none transition-opacity duration-300">
        <Sun size={12} />
      </span>
      <span className="absolute right-2 flex items-center justify-center text-slate-400 dark:text-teal-400/60 pointer-events-none transition-opacity duration-300">
        <Moon size={12} />
      </span>

      {/* Sliding Knob with Smooth translateX and 0.3s Transition */}
      <span
        style={{
          transform: isDark ? "translateX(32px)" : "translateX(0px)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, box-shadow 0.3s ease",
        }}
        className={`pointer-events-none relative flex h-6 w-6 items-center justify-center rounded-full shadow-md ${
          isDark
            ? "bg-slate-900 border border-teal-500/40 text-teal-300 shadow-teal-950/40"
            : "bg-white border border-slate-200 text-amber-500 shadow-slate-400/20"
        }`}
      >
        {isDark ? (
          <Moon size={12} className="fill-teal-400/20 text-teal-400 transition-transform duration-300" />
        ) : (
          <Sun size={12} className="fill-amber-500/20 text-amber-500 transition-transform duration-300" />
        )}
      </span>
    </button>
  );
}
