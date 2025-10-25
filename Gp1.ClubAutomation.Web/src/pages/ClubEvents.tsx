import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  getClub,
  getEventsByClub,
  hasRole,
  deleteEvent,
  updateEvent,
} from "../lib/api";
import { useState, useMemo } from "react";
import { joinClub, leaveClub, getMyMemberships } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { QRCodeCanvas } from "qrcode.react";

export default function ClubEvents() {
  const { id = "" } = useParams(); // clubId
  const qc = useQueryClient();
  const { user } = useAuth();
  const { push } = useToast();

  // kulüp ve etkinlikler
  const clubQ = useQuery({
    queryKey: ["club", id],
    queryFn: () => getClub(id),
  });

  const eventsQ = useQuery({
    queryKey: ["events", id],
    queryFn: () => getEventsByClub(id),
    enabled: !!id,
  });

  // üyelik bilgisi (başkan mıyız? üye miyiz?)
  const myMemberships = useMemo(
    () => (user ? getMyMemberships(user.id) : []),
    [user]
  );
  const iAmMember = !!myMemberships.find((m) => m.clubId === id);
  const iAmPresident = !!myMemberships.find(
    (m) => m.clubId === id && m.role === "President"
  );

  // Etkinlik oluşturma form state
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const createMut = useMutation({
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
      push({ message: "Etkinlik oluşturuldu ✅" });
    },
    onError: () => {
      push({ message: "Etkinlik oluşturulamadı", type: "error" });
    },
  });

  // Etkinlik silme
  const deleteMut = useMutation({
    mutationFn: (eventId: string) => deleteEvent(id, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", id] });
      push({ message: "Etkinlik silindi", type: "info" });
    },
    onError: () => {
      push({ message: "Silme başarısız", type: "error" });
    },
  });

  // Etkinlik düzenleme (küçük patch için, örn başlık değişimi)
  const patchMut = useMutation({
    mutationFn: (payload: { eventId: string; nextTitle: string }) =>
      updateEvent(id, payload.eventId, { title: payload.nextTitle }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", id] });
      push({ message: "Etkinlik güncellendi ✅" });
    },
    onError: () => {
      push({ message: "Güncelleme başarısız", type: "error" });
    },
  });

  // === QR MODAL STATE ===
  // hangi etkinlik için QR göstereceğiz?
  const [qrEventId, setQrEventId] = useState<string | null>(null);

  const qrEvent = useMemo(() => {
    if (!qrEventId || !eventsQ.data) return null;
    return eventsQ.data.find((e) => e.id === qrEventId) || null;
  }, [qrEventId, eventsQ.data]);

  // QR kodun içine ne koyacağız?
  // Şimdilik mock: "checkin|<eventId>|<userId?>"
  // Gerçekte bu token backend tarafından verilir.
  const qrValue = qrEvent
    ? `checkin|${qrEvent.id}|club=${id}`
    : "";

  if (clubQ.isLoading) {
    return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  }
  if (!clubQ.data) {
    return <div style={{ padding: 16 }}>Kulüp bulunamadı.</div>;
  }

  const club = clubQ.data;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6 }}>
        {club.name} — Etkinlikler
      </h2>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        {club.description || "Açıklama yok"}
      </div>

      {/* Üyelik butonu (katıl / ayrıl) */}
      {user && (
        <div style={{ marginBottom: 16 }}>
          {!iAmMember ? (
            <button
              onClick={() => {
                joinClub(user.id, id);
                qc.invalidateQueries({ queryKey: ["club", id] });
                push({ message: "Kulübe katıldın ✅" });
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #22c55e",
                background: "#22c55e",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Kulübe Katıl
            </button>
          ) : (
            <button
              onClick={() => {
                leaveClub(user.id, id);
                qc.invalidateQueries({ queryKey: ["club", id] });
                push({ message: "Kulüpten ayrıldın", type: "info" });
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Kulüpten Ayrıl
            </button>
          )}
        </div>
      )}

      {/* Yeni etkinlik oluşturma formu - SADECE BAŞKANA */}
      {iAmPresident && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 8,
            margin: "12px 0",
            alignItems: "center",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <input
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
          <input
            placeholder="Konum"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button
              onClick={() => createMut.mutate()}
              disabled={!title || !start || !end || createMut.isPending}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                background: "#3b82f6",
                color: "#fff",
                fontWeight: 500,
                cursor: "pointer",
              }}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ flex: "1 1 auto" }}>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {new Date(e.startAt).toLocaleString()} –{" "}
                    {new Date(e.endAt).toLocaleString()}
                    {e.location ? ` | ${e.location}` : ""}
                  </div>
                </div>

                {/* Buton grubu */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "flex-end",
                  }}
                >
                  {/* QR Kod Göster - SADECE BAŞKAN GÖRSÜN */}
                  {iAmPresident && (
                    <button
                      onClick={() => setQrEventId(e.id)}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      title="Yoklama için giriş QR kodunu göster"
                    >
                      QR Kod
                    </button>
                  )}

                  {/* Etkinlik Düzenle - Başkan */}
                  {iAmPresident && (
                    <button
                      onClick={() => {
                        const newTitle = window.prompt(
                          "Yeni başlık:",
                          e.title
                        );
                        if (!newTitle) return;
                        patchMut.mutate({ eventId: e.id, nextTitle: newTitle });
                      }}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Düzenle
                    </button>
                  )}

                  {/* Etkinlik Sil - Başkan */}
                  {iAmPresident && (
                    <button
                      onClick={() => {
                        if (!window.confirm("Bu etkinlik silinsin mi?"))
                          return;
                        deleteMut.mutate(e.id);
                      }}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: "#fff",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}

          {eventsQ.data?.length === 0 && (
            <div>Henüz etkinlik yok.</div>
          )}
        </ul>
      )}

      {/* === QR MODAL === */}
      <Modal
        open={!!qrEvent}
        onClose={() => setQrEventId(null)}
        title="Etkinlik Giriş QR"
      >
        {qrEvent ? (
          <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 600 }}>{qrEvent.title}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {new Date(qrEvent.startAt).toLocaleString()} -
              {new Date(qrEvent.endAt).toLocaleString()}
            </div>

            <div
              style={{
                display: "grid",
                placeItems: "center",
                padding: 16,
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <QRCodeCanvas
                value={qrValue}
                size={180}
                includeMargin={true}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#666",
                lineHeight: 1.4,
                maxWidth: 260,
              }}
            >
              Kapı görevlisi bu kodu öğrencilerin telefonuna
              taratıp yoklama alabilir. (Demo)
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
