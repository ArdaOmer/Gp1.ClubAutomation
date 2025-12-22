import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../notifications/NotificationContext";
import { useTheme } from "../theme/ThemeContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { unread } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#111827" : "#f9fafb",
        color: isDark ? "#e5e7eb" : "#111827",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderBottom: isDark ? "1px solid #1f2937" : "1px solid #eee",
          position: "sticky",
          top: 0,
          background: isDark ? "#1f2937" : "#fff",
          color: isDark ? "#e5e7eb" : "#111827",
          zIndex: 10,
        }}
      >
        {/* Left logo / brand */}
        <Link
          to="/"
          style={{
            fontWeight: 800,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "inherit",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: isDark ? "#374151" : "#eef2ff",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 700,
              color: isDark ? "#93c5fd" : "#3b82f6",
            }}
          >
            U
          </span>
          <span>Club Automation</span>
        </Link>

        {/* Mid Navigation */}
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <NavLink
            to="/"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ddd",
              background: isDark ? "#1f2937" : "#fff",
              color: "inherit",
              fontWeight: 500,
            }}
          >
            Home
          </NavLink>

          <NavLink
            to="/profile"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ddd",
              background: isDark ? "#1f2937" : "#fff",
              color: "inherit",
              fontWeight: 500,
            }}
          >
            My Profile
          </NavLink>

          <NavLink
            to="/clubs"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ddd",
              background: isDark ? "#1f2937" : "#fff",
              color: "inherit",
              fontWeight: 500,
            }}
          >
            Clubs
          </NavLink>

          <NavLink
            to="/certificates"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ddd",
              background: isDark ? "#1f2937" : "#fff",
              color: "inherit",
              fontWeight: 500,
            }}
          >
            Certificates
          </NavLink>

          {/* Announcements (bell + badge) */}
          <NavLink
            to="/announcements"
            style={{
              position: "relative",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ddd",
              background: isDark ? "#1f2937" : "#fff",
              color: "inherit",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Announcements"
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ fontSize: 16 }}>🔔</span>

              {unread && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 6px rgba(239,68,68,.6)",
                  }}
                />
              )}
            </span>

            <span>Announcements</span>
          </NavLink>
        </nav>

        {/* Right Side : theme button + leave button */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={toggleTheme}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #ccc",
              background: isDark ? "#1f2937" : "#fff",
              color: isDark ? "#fff" : "#111",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {isDark ? "🌞 Light" : "🌙 Dark"}
          </button>

          <button
            onClick={logout}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: isDark ? "1px solid #4b5563" : "1px solid #ddd",
              background: isDark ? "#374151" : "#fff",
              color: isDark ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content Zone */}
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 16,
        }}
      >
        {children}
      </main>
    </div>
  );
}
