import { useState, useEffect, useCallback } from "react";

export type UserRole = "student" | "admin" | null;

export interface AuthUser {
  email: string;
  role: "student" | "admin";
  name?: string;
}

const STORAGE_KEY = "ncatex_auth_session";
const AUTH_EVENT = "ncatex:auth_change";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Dispatch local custom event for same-window updates
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
  } catch (err) {
    console.error("Failed to update auth session:", err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    // Initial sync
    setUser(getStoredUser());

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser | null>;
      setUser(customEvent.detail ?? getStoredUser());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setUser(getStoredUser());
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = useCallback(
    (role: "student" | "admin", email?: string, name?: string) => {
      const defaultEmail = role === "student" ? "student@ncatex.edu" : "admin@ncatex.edu";
      const defaultName = role === "student" ? "Author Scholar" : "Conference Administrator";
      const newUser: AuthUser = {
        role,
        email: email?.trim() || defaultEmail,
        name: name?.trim() || defaultName,
      };
      setStoredUser(newUser);
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredUser(null);
    setUser(null);
  }, []);

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
