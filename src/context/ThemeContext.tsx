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
      <button
        type="button"
        className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-sm opacity-80 ${className}`}
        aria-label="Toggle theme"
      >
        <div className="relative h-4 w-4" />
        <span className="text-[11px] hidden sm:inline font-medium">Theme</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 active:scale-95 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle light/dark theme"
    >
      <div className="relative h-4 w-4">
        <AnimatePresence initial={false} mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center text-amber-300"
            >
              <Moon size={14} className="fill-amber-300/30" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center text-amber-500"
            >
              <Sun size={14} className="fill-amber-500/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-[11px] hidden sm:inline font-medium">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
