import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createEvent,
  getClub,
  getEventsByClub,
  joinClub,
  leaveClub,
  getMyMemberships,
  hasRole,
  deleteEvent,
} from "../lib/api";
import { useAuth } from "../auth/AuthContext";
// Toast kullanmak istemezsen bu iki satırı yorumlayabilirsin
import { useToast } from "../components/Toast";

export default function ClubEvents() {
  const params = useParams();
  const clubId = params.id || "";            // güvenli clubId
  const qc = useQueryClient();
  const { user } = useAuth();
  const { push } = useToast();               // ToastProvider yoksa no-op (beyaz ekran olmaz)

  // Sadece giriş yapmış kullanıcılar için rol kontrolü (id yoksa false)
  const isPresident = !!(user && clubId && hasRole(user, clubId, "President"));

  // Queries
  const clubQ = useQuery({ queryKey: ["club", clubId], queryFn: () => getClub(clubId), enabled: !!clubId });
  const eventsQ = useQuery({
    queryKey: ["events", clubId],
    queryFn: () => getEventsByClub(clubId),
    enabled: !!clubId,
  });

  // Event create form state
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Mutations
  const createMut = useMutation({
    mutationFn: () =>
      createEvent(clubId, { title, location: loc, description: "", startAt: start, endAt: end }),
    onSuccess: () => {
      setTitle(""); setLoc(""); setStart(""); setEnd("");
      qc.invalidateQueries({ queryKey: ["events", clubId] });
      push({ message: "Etkinlik eklendi ✅" });
    },
    onError: () => push({ message: "Etkinlik eklenemedi", type: "error" }),
  });

  const deleteMut = useMutation({
    mutationFn: (eventId: string) => deleteEvent(clubId, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", clubId] });
      push({ message: "Etkinlik silindi", type: "info" });
    },
    onError: () => push({ message: "Silme işlemi başarısız", type: "error" }),
  });

  // Üyelik yardımcıları (gerekirse kullanırsın)
  const memberships = user ? getMyMemberships(user.id) : [];
  const isMember = !!(user && memberships.some((m) => m.clubId === clubId));

  if (clubQ.isLoading) return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  if (!clubQ.data) return <div style={{ padding: 16 }}>Kulüp bulunamadı.</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{clubQ.data.name} — Etkinlikler</h2>
        <div style={{ flex: 1 }} />
        <Link to="/clubs" style={{ padding:"6px 10px", border:"1px solid #ddd", borderRadius:8, textDecoration:"none" }}>
          ← Kulüpler
        </Link>
      </div>

      {/* Yalnızca BAŞKAN için etkinlik ekleme formu */}
      {isPresident && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 8,
            margin: "12px 0",
            alignItems: "center",
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,.05)",
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
              onClick={() => createMut.mutate()}
              disabled={!title || !start || !end || createMut.isPending}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                background: "#3b82f6",
                color: "#fff",
                transition: "transform .05s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {createMut.isPending ? "Ekleniyor..." : "Etkinlik Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Etkinlik listesi */}
      {eventsQ.isLoading ? (
        "Yükleniyor..."
      ) : (
        <ul style={{ display: "grid", gap: 8, marginTop: 8, listStyle: "none", padding: 0 }}>
          {(eventsQ.data ?? []).map((e) => (
            <li
              key={e.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {new Date(e.startAt).toLocaleString()} – {new Date(e.endAt).toLocaleString()} |{" "}
                    {e.location || "TBA"}
                  </div>
                </div>

                {/* Sil butonu: sadece başkan */}
                {isPresident && (
                  <button
                    onClick={() => {
                      if (!confirm("Bu etkinliği silmek istiyor musun?")) return;
                      deleteMut.mutate(e.id);
                    }}
                    disabled={deleteMut.isPending}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#b91c1c",
                      transition: "transform .05s ease",
                    }}
                    onMouseDown={(ev) => (ev.currentTarget.style.transform = "scale(0.98)")}
                    onMouseUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                  >
                    {deleteMut.isPending ? "Siliniyor..." : "Sil"}
                  </button>
                )}
              </div>
            </li>
          ))}
          {(eventsQ.data?.length ?? 0) === 0 && <div>Henüz etkinlik yok.</div>}
        </ul>
      )}
    </div>
  );
}
