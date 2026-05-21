"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AuthState = {
  user: string | null;
  hydrated: boolean;
  login: (name: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "bo-agent-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(stored);
    } catch {}
    setHydrated(true);
  }, []);

  const login = (name: string) => {
    setUser(name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch {}
  };
  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
