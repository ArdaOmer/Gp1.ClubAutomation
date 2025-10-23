// src/components/CampusFeed.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../theme/ThemeContext";
import { getClubs, getUpcomingEventsForUser, getAnnouncementsForClubs } from "../lib/api";
import type { Club, EventItem, Announcement } from "../types";
import { Link } from "react-router-dom";

type FeedItem =
  | { type: "event"; id: string; clubId: string; title: string; dateISO: string; location?: string; data: EventItem }
  | { type: "announcement"; id: string; clubId: string; title: string; dateISO: string; content?: string; pinned?: boolean; data: Announcement };

// --- Like helpers (localStorage) ---
function likeKey(itemKey: string) {
  return "feed_likes_" + itemKey; // itemKey: `${type}:${id}`
}
function readLikes(itemKey: string): string[] {
  try {
    const raw = localStorage.getItem(likeKey(itemKey));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeLikes(itemKey: string, userIds: string[]) {
  localStorage.setItem(likeKey(itemKey), JSON.stringify(userIds));
}

function LikeButton({
  itemKey, // `${type}:${id}`
  userId,
  theme,
}: {
  itemKey: string;
  userId: string;
  theme: "light" | "dark" | string;
}) {
  const initial = readLikes(itemKey);
  const [liked, setLiked] = useState(initial.includes(userId));
  const [count, setCount] = useState(initial.length);

  function toggle() {
    const arr = readLikes(itemKey);
    const has = arr.includes(userId);
    if (has) {
      const next = arr.filter((x) => x !== userId);
      writeLikes(itemKey, next);
      setLiked(false);
      setCount(next.length);
    } else {
      const next = [...arr, userId];
      writeLikes(itemKey, next);
      setLiked(true);
      setCount(next.length);
    }
  }

  return (
    <button
      onClick={toggle}
      title={liked ? "Beğenmekten vazgeç" : "Beğen"}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
        background: theme === "dark" ? "#1f2937" : "#fff",
        color: theme === "dark" ? "#e5e7eb" : "#111",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minWidth: 96,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span>
      <span style={{ fontWeight: 600 }}>Beğen</span>
      <span style={{ fontSize: 12, opacity: 0.8 }}>({count})</span>
    </button>
  );
}

export default function CampusFeed({ userId, myClubIds }: { userId: string; myClubIds: string[] }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<"all" | "event" | "announcement">("all");

  // Kulüpler (isimler için)
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // Üyenin kulüplerinden DUYURULAR
  const annsQ = useQuery({
    queryKey: ["feed_announcements", myClubIds.sort().join(",")],
    queryFn: () => getAnnouncementsForClubs(myClubIds),
    enabled: myClubIds.length > 0,
  });

  // Üyenin kulüplerinden YAKLAŞAN ETKİNLİKLER (30 gün)
  const eventsQ = useQuery({
    queryKey: ["feed_upcoming", userId, 30],
    queryFn: () => getUpcomingEventsForUser(userId, 30),
    enabled: !!userId,
  });

  const clubName = (cid: string) => clubsQ.data?.find((c: Club) => c.id === cid)?.name || "Kulüp";

  // Birleştir + tarihe göre sırala
  const feed: FeedItem[] = useMemo(() => {
    const a: FeedItem[] =
      (annsQ.data as Announcement[] | undefined)?.map((x) => ({
        type: "announcement" as const,
        id: x.id,
        clubId: x.clubId,
        title: x.title,
        dateISO: x.createdAt,
        content: x.content,
        pinned: x.pinned,
        data: x,
      })) ?? [];

    const e: FeedItem[] =
      (eventsQ.data as EventItem[] | undefined)?.map((x) => ({
        type: "event" as const,
        id: x.id,
        clubId: x.clubId,
        title: x.title,
        dateISO: x.startAt,
        location: x.location,
        data: x,
      })) ?? [];

    const combined = [...a, ...e];
    combined.sort((lhs, rhs) => new Date(rhs.dateISO).getTime() - new Date(lhs.dateISO).getTime());
    return combined;
  }, [annsQ.data, eventsQ.data]);

  const filtered = filter === "all" ? feed : feed.filter((f) => f.type === filter);

  const cardStyle: React.CSSProperties = {
    background: theme === "dark" ? "#1f2937" : "#fff",
    border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
    borderRadius: 12,
    boxShadow: theme === "dark" ? "0 2px 6px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.05)",
    padding: 12,
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {/* Başlık ve filtre */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>🎓 Kampüs Akışı</h3>
        <div style={{ flex: 1 }} />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          style={{
            padding: 8,
            border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
            borderRadius: 8,
            background: theme === "dark" ? "#111827" : "#fff",
            color: theme === "dark" ? "#e5e7eb" : "#111",
          }}
        >
          <option value="all">Hepsi</option>
          <option value="event">Yalnızca Etkinlik</option>
          <option value="announcement">Yalnızca Duyuru</option>
        </select>
      </div>

      {(annsQ.isLoading || eventsQ.isLoading || clubsQ.isLoading) && (
        <div style={{ fontSize: 14, color: theme === "dark" ? "#9ca3af" : "#666" }}>Yükleniyor…</div>
      )}

      {!annsQ.isLoading && !eventsQ.isLoading && filtered.length === 0 && (
        <div
          style={{
            border: theme === "dark" ? "1px dashed #374151" : "1px dashed #ddd",
            borderRadius: 12,
            padding: 16,
            color: theme === "dark" ? "#9ca3af" : "#666",
            fontSize: 14,
          }}
        >
          Şu anda gösterilecek aktivite yok.
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {filtered.map((f) => {
          const icon = f.type === "event" ? "📅" : "📣";
          const labelColor = f.type === "event" ? "#2563eb" : "#a16207";
          const itemKey = `${f.type}:${f.id}`;

          return (
            <li key={`${f.type}_${f.id}`} style={cardStyle}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Sol ikon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: f.type === "event" ? "#eff6ff" : "#fff7ed",
                    border: `1px solid ${f.type === "event" ? "#bfdbfe" : "#fed7aa"}`,
                    color: labelColor,
                    fontSize: 18,
                  }}
                  title={f.type === "event" ? "Etkinlik" : "Duyuru"}
                >
                  {icon}
                </div>

                {/* İçerik */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontWeight: 700 }}>
                    {f.title}{" "}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 12,
                        color: theme === "dark" ? "#9ca3af" : "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      • {clubName(f.clubId)}
                    </span>
                    {f.type === "announcement" && (f as any).pinned && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 999,
                          border: "1px solid #fca5a5",
                          color: "#b91c1c",
                        }}
                      >
                        Sabit
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#6b7280", marginTop: 2 }}>
                    {new Date(f.dateISO).toLocaleString("tr-TR")}
                    {f.type === "event" && f.location ? ` | ${f.location}` : ""}
                  </div>

                  {f.type === "announcement" && (f as any).content && (
                    <div style={{ fontSize: 14, marginTop: 6 }}>{(f as any).content}</div>
                  )}
                </div>

                {/* Sağ aksiyonlar */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Beğen butonu (localStorage) */}
                  <LikeButton itemKey={itemKey} userId={userId} theme={theme} />
                  {/* Link */}
                  <Link
                    to={`/clubs/${f.clubId}/events`}
                    style={{
                      padding: "6px 10px",
                      border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
                      borderRadius: 8,
                      textDecoration: "none",
                      background: theme === "dark" ? "#1f2937" : "#fff",
                      color: theme === "dark" ? "#e5e7eb" : "#111",
                      minWidth: 96,
                      textAlign: "center",
                    }}
                  >
                    {f.type === "event" ? "Detay" : "Kulüp"}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* manuel yenileme */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => {
            void clubsQ.refetch();
            void annsQ.refetch();
            void eventsQ.refetch();
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
            background: theme === "dark" ? "#1f2937" : "#fff",
            color: theme === "dark" ? "#e5e7eb" : "#111",
            cursor: "pointer",
          }}
        >
          🔄 Yeni aktiviteleri getir
        </button>
      </div>
    </section>
  );
}
