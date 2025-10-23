import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // aktif link için ortak stil
  const activeStyle = {
    background: theme === "dark" ? "#2563eb" : "#3b82f6",
    color: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme === "dark" ? "#111827" : "#f9fafb",
        color: theme === "dark" ? "#e5e7eb" : "#111827",
        transition: "background-color 0.6s ease, color 0.6s ease",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          background: theme === "dark" ? "#1f2937" : "#fff",
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            textDecoration: "none",
            color: theme === "dark" ? "#fff" : "#111",
            marginRight: 16,
          }}
        >
          Kulüp Otomasyonu
        </Link>

        <nav style={{ display: "flex", gap: 8 }}>
          {[
            { to: "/", label: "Home" },
            { to: "/profile", label: "Profilim" },
            { to: "/clubs", label: "Kulüpler" },
            { to: "/certificates", label: "Sertifikalar" },
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                textDecoration: "none",
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                transition: "all 0.25s ease",
                background: theme === "dark" ? "#374151" : "#fff",
                color: theme === "dark" ? "#e5e7eb" : "#111827",
                ...(isActive ? activeStyle : {}),
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: theme === "dark" ? "#1f2937" : "#fff",
              color: theme === "dark" ? "#fff" : "#111",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
          </button>

          <button
            onClick={logout}
            style={{
              padding: "6px 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: theme === "dark" ? "#374151" : "#fff",
              color: theme === "dark" ? "#f3f4f6" : "#111",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            Çıkış
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>{children}</main>
    </div>
  );
}
