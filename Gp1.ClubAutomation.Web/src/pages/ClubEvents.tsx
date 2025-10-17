import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, getClub, getEventsByClub } from "../lib/api";
import { useState } from "react";
import { joinClub, leaveClub, getMyMemberships, hasRole } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function ClubEvents(){
  const { id = "" } = useParams(); // clubId
  const qc = useQueryClient();
  const { user } = useAuth();

  const clubQ = useQuery({ queryKey: ["club", id], queryFn: () => getClub(id) });
  const eventsQ = useQuery({ queryKey: ["events", id], queryFn: () => getEventsByClub(id), enabled: !!id });

  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const m = useMutation({
    mutationFn: () =>
      createEvent(id, {
        title,
        location: loc,
        description: "",
        startAt: start,
        endAt: end,
      }),
    onSuccess: () => {
      setTitle("");
      setLoc("");
      setStart("");
      setEnd("");
      qc.invalidateQueries({ queryKey: ["events", id] });
    },
  });

  if (clubQ.isLoading) return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  if (!clubQ.data) return <div style={{ padding: 16 }}>Kulüp bulunamadı.</div>;

  // Üyelik ve rol bilgileri
  const myMs = user ? getMyMemberships(user.id) : [];
  const isMember = !!myMs.find((m) => m.clubId === id);
  const canManage = hasRole(user, id, "President"); // YALNIZCA BAŞKAN etkinlik ekleyebilir

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6 }}>{clubQ.data.name} — Etkinlikler</h2>

      {/* Katıl / Ayrıl butonu (öğrenciler için) */}
      <div style={{ margin: "8px 0 16px 0", display: "flex", gap: 8 }}>
        {!isMember ? (
          <button
            onClick={() => {
              if (!user) return;
              joinClub(user.id, id);
              // basitlik için sayfayı yenileyelim
              window.location.reload();
            }}
            style={{
              padding: "6px 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Kulübe Katıl
          </button>
        ) : (
          <button
            onClick={() => {
              if (!user) return;
              leaveClub(user.id, id);
              window.location.reload();
            }}
            style={{
              padding: "6px 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Ayrıl
          </button>
        )}
      </div>

      {/* Etkinlik Ekle formu — SADECE BAŞKAN */}
      {canManage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 8,
            margin: "12px 0",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <input
            placeholder="Konum"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              onClick={() => m.mutate()}
              disabled={!title || !start || !end || m.isPending}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                background: "#3b82f6",
                color: "#fff",
              }}
            >
              {m.isPending ? "Ekleniyor..." : "Etkinlik Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Etkinlik listesi */}
      {eventsQ.isLoading ? (
        "Yükleniyor..."
      ) : (
        <ul style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {(eventsQ.data ?? []).map((e) => (
            <li key={e.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 13, color: "#555" }}>
                {new Date(e.startAt).toLocaleString()} – {new Date(e.endAt).toLocaleString()} |{" "}
                {e.location || "TBA"}
              </div>
            </li>
          ))}
          {eventsQ.data?.length === 0 && <div>Henüz etkinlik yok.</div>}
        </ul>
      )}
    </div>
  );
}
