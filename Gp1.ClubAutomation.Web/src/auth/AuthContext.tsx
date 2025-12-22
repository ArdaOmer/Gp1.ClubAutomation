import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types";

type AuthCtx = {
  user: User | null;
  login: (t: string, u: User) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
  ready: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      try {
        const parsed = JSON.parse(u);
        if (parsed?.id != null) parsed.id = Number(parsed.id);
        setUser(parsed);
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ user, login, logout, updateUser, ready }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("`useAuth` must be used within the `AuthProvider`.");
  return v;
};
