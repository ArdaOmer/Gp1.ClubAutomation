import { FormEvent, useState } from "react";
import { loginApi } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await loginApi({ email, password });
      login(res.token, res.user);
      nav("/");
    } catch (e: any) {
      setErr(e?.message ?? "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f7fb",
        position: "relative",
        overflow: "hidden",
        padding: 16,
      }}
    >
      {/* Arka plan logo (su izi) */}
      <img
        
        src="/university logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "min(90vmin, 820px)",
          height: "auto",
          margin: "auto",
          objectFit: "contain",
          opacity: 0.3,          // su izi etkisi
          filter: "grayscale(100%)",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Hafif bir üstten degrade, kontrastı artırır (isteğe bağlı) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(0,0,0,0.06), transparent)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Login kartı */}
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 18px 50px rgba(0,0,0,.08)",
          zIndex: 1,
          border: "1px solid #eef2f7",
        }}
      >
        {/* Kart üst başlık */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#3b82f6",
            }}
            title="Üniversite"
          >
            U
          </div>
          <div>
            <h1 style={{ fontSize: 18, margin: 0 }}>Kaydol ya da Giriş Yap</h1>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Üniversite Kulüp Otomasyonu
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          <input
            placeholder="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              outline: "none",
            }}
            required
            autoComplete="email"
          />
          <input
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              outline: "none",
            }}
            required
            autoComplete="current-password"
          />
          <button
            disabled={loading}
            style={{
              padding: 10,
              border: "none",
              borderRadius: 10,
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              transition: "transform .05s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          {import.meta.env.VITE_USE_MOCK === "1" && (
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
              Mock: <b>test@uni.edu / 123456</b>
            </p>
          )}
          {err && (
            <div style={{ color: "#b00020", fontSize: 13, marginTop: 2 }}>
              {err}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
