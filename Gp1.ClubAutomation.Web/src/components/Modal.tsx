import React from "react";

export default function Modal({
  open,
  onClose,
  children,
  title
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          width: "min(90vw,400px)",
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
          textAlign: "center",
        }}
      >
        {title && (
          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>
            {title}
          </h2>
        )}

        <div>{children}</div>

        <button
          style={{
            marginTop: 20,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 500
          }}
          onClick={onClose}
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
