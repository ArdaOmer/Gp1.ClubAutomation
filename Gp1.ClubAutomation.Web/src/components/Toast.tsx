import React, { createContext, useContext, useState } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" | "info"; duration?: number };
type ToastCtx = { push: (t: Omit<Toast, "id">) => void };

const Ctx = createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [list, setList] = useState<Toast[]>([]);

  function push(t: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, duration: 2500, type: "success", ...t };
    setList((prev) => [...prev, toast]);
    setTimeout(() => setList((prev) => prev.filter((x) => x.id !== id)), toast.duration);
  }

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 16,
          top: 16,
          display: "grid",
          gap: 8,
          zIndex: 9999,
        }}
      >
        {list.map((t) => (
          <div
            key={t.id}
            style={{
              minWidth: 220,
              padding: "10px 12px",
              borderRadius: 10,
              boxShadow: "0 8px 30px rgba(0,0,0,.12)",
              background:
                t.type === "error" ? "#fee2e2" : t.type === "info" ? "#e0e7ff" : "#dcfce7",
              color: t.type === "error" ? "#7f1d1d" : t.type === "info" ? "#1e3a8a" : "#065f46",
              border: "1px solid rgba(0,0,0,.06)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
};

// Safe fallback: Returns no-op if provider is absent, APPLICATION WILL NOT CRASH.
export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) return { push: () => { } };
  return v;
}
