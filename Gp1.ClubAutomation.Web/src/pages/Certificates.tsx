// src/pages/Certificates.tsx
import { useAuth } from "../auth/AuthContext";
import { getClubs, getEventsIAttend } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import type { EventItem } from "../types";

export default function Certificates() {
  const { user } = useAuth();

  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // ✅ User participation in activities (backend)
  const attendedQ = useQuery({
    queryKey: ["my-attendances", user?.id],
    queryFn: () => getEventsIAttend(user!.id),
    enabled: !!user,
  });

  if (!user) return <div style={{ padding: 16 }}>Login required.</div>;

  function openCertificate(
    title: string,
    clubName: string,
    dateStr: string,
    userName: string
  ) {
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Certificate</title>
<style>
  body { margin:0; background:#f8fafc; font-family: Inter, Arial, sans-serif; }
  .paper { width:900px; margin:40px auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:40px; box-shadow:0 10px 40px rgba(0,0,0,.08); }
  h1 { text-align:center; margin:0 0 16px 0; font-size:28px; }
  h2 { text-align:center; margin:0 0 8px 0; font-size:20px; color:#374151; }
  .line { height:1px; background:#e5e7eb; margin:24px 0; }
  .meta { text-align:center; color:#6b7280; margin-top:6px; }
  .signature { display:flex; justify-content:space-between; margin-top:48px; color:#374151; }
  .sign { text-align:center; width:45%; }
  .sign .name { margin-top:40px; border-top:1px solid #e5e7eb; padding-top:6px; }
  .badge { text-align:center; margin-bottom:16px; font-size:40px; }
  @media print { body { background:#fff; } .paper { box-shadow:none; margin:0; width:auto; border:none; } }
</style>
</head>
<body>
  <div class="paper">
    <div class="badge">🎓</div>
    <h1>PARTICIPATION CERTIFICATE</h1>
    <h2>We hereby certify that <b>${userName}</b></h2>
    <h2>has participated in <b>"${title}"</b>, an event organized by the <b>${clubName}</b> club.</h2>
    <div class="line"></div>
    <div class="meta">Date: ${dateStr}</div>
    <div class="signature">
      <div class="sign"><div>Club President</div><div class="name">${clubName}</div></div>
      <div class="sign"><div>Student</div><div class="name">${userName}</div></div>
    </div>
  </div>
  <script>window.print()</script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer,width=980,height=700");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function clubName(id: number) {
    const c = clubsQ.data?.find((x) => x.id === id);
    return c?.name || "Club";
  }

  const items: EventItem[] = Array.isArray(attendedQ.data) ? attendedQ.data : [];

  const loading = clubsQ.isLoading || attendedQ.isLoading;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "0 0 12px 0" }}>Certificates</h2>

      {loading ? (
        <div style={{ color: "#666" }}>Loading…</div>
      ) : attendedQ.isError ? (
        <div
          style={{
            border: "1px dashed #ddd",
            borderRadius: 12,
            padding: 16,
            color: "#b91c1c",
          }}
        >
          Certificates could not be loaded.
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            border: "1px dashed #ddd",
            borderRadius: 12,
            padding: 16,
            color: "#666",
          }}
        >
          You have not attended any events yet. You can mark your attendance by
          clicking “I’m attending” on events on the Home page.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {items.map((ev) => {
            const dateStr = new Date(ev.startAt).toLocaleString();
            const cn = clubName(ev.clubId);
            return (
              <li
                key={ev.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {cn} • {dateStr}
                  </div>
                </div>

                <button
                  onClick={() =>
                    openCertificate(ev.title, cn, dateStr, user.name || user.email)
                  }
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                >
                  Generate Certificate
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
