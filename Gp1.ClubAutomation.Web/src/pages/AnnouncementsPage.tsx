import { useEffect, useMemo } from "react";
import { useNotifications } from "../notifications/NotificationContext";
import { useQuery } from "@tanstack/react-query";
import { getClubs } from "../lib/api";
import type { Club } from "../types";

function clubNameById(clubs: Club[], id: string) {
  const c = clubs.find((x) => x.id === id);
  return c?.name || "Kulüp";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AnnouncementsPage() {
  const { announcements, loading, markAllRead } = useNotifications();
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // SAYFA AÇILDIĞINDA OKUNMUŞ SAY
  useEffect(() => {
    markAllRead();
  }, []);

  const sorted = useMemo(() => {
    return [...announcements].sort((a, b) => {
      // pinned olanlar önce gelsin
      if (!!b.pinned - +!!a.pinned !== 0) {
        return (!!b.pinned ? 1 : 0) - (!!a.pinned ? 1 : 0);
      }
      // sonra tarihe göre (yeni en üstte)
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });
  }, [announcements]);

  return (
    <div style={{ padding: 8 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Duyurular</h2>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : sorted.length === 0 ? (
        <div
          style={{
            border: "1px dashed #ddd",
            borderRadius: 12,
            padding: 16,
            color: "#666",
            fontSize: 14,
          }}
        >
          Kulüplerinden yeni duyuru yok.
        </div>
      ) : (
        <ul
          style={{
            display: "grid",
            gap: 8,
            listStyle: "none",
            padding: 0,
          }}
        >
          {sorted.map((a) => (
            <li
              key={a.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {a.title}{" "}
                    {a.pinned && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#b91c1c",
                          marginLeft: 6,
                          border: "1px solid #fca5a5",
                          padding: "2px 6px",
                          borderRadius: 999,
                        }}
                      >
                        Sabit
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      marginTop: 2,
                    }}
                  >
                    {formatDateTime(a.createdAt)}
                    {" · "}
                    {clubsQ.isLoading
                      ? "..."
                      : clubNameById(clubsQ.data ?? [], a.clubId)}
                  </div>

                  {a.content && (
                    <div style={{ fontSize: 14, marginTop: 8 }}>
                      {a.content}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
