import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 10,
        }}
      >
        <Link to="/" style={{ fontWeight: 800, textDecoration: "none" }}>
          Kulüp Otomasyonu
        </Link>

        <nav style={{ display: "flex", gap: 8 }}>
          <NavLink to="/" style={{ textDecoration: "none", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}>
            Home
          </NavLink>
          <NavLink to="/profile" style={{ textDecoration: "none", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}>
            Profilim
          </NavLink>
          <NavLink to="/clubs" style={{ textDecoration: "none", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}>
            Kulüpler
          </NavLink>
          <NavLink to="/certificates" style={{ textDecoration: "none", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}>
            Sertifikalar
          </NavLink>
        </nav>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={logout}
            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
            Çıkış
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>{children}</main>
    </div>
  );
}
