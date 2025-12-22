import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  getClub,
  getEventsByClub,
  deleteEvent,
  updateEvent,
  getMyMemberships,
  joinClub,
  leaveClub,
} from "../lib/api";
import { useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { QRCodeCanvas } from "qrcode.react";
import type { Membership, EventItem } from "../types";

export default function ClubEvents() {
  const { id } = useParams(); // clubId (string)
  const clubId = Number(id); // ✅ convert number
  const hasValidClubId = Number.isFinite(clubId) && clubId > 0;

  const qc = useQueryClient();
  const { user } = useAuth();
  const { push } = useToast();

  // clubs and events
  const clubQ = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => getClub(clubId),
    enabled: hasValidClubId,
  });

  const eventsQ = useQuery({
    queryKey: ["events", clubId],
    queryFn: () => getEventsByClub(clubId),
    enabled: hasValidClubId,
  });

  // ✅ memberships
  const membershipsQ = useQuery({
    queryKey: ["myMemberships", user?.id],
    queryFn: () => getMyMemberships(user!.id),
    enabled: !!user,
  });

  const myMemberships: Membership[] = membershipsQ.data ?? [];

  // ✅ number comparison
  const iAmMember = useMemo(
    () => myMemberships.some((m) => m.clubId === clubId),
    [myMemberships, clubId]
  );

  const iAmPresident = useMemo(
    () => myMemberships.some((m) => m.clubId === clubId && m.role === "President"),
    [myMemberships, clubId]
  );

  // events create form state
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createEvent(clubId, {
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
      qc.invalidateQueries({ queryKey: ["events", clubId] });
      push({ message: "Event created ✅" });
    },
    onError: () => {
      push({ message: "Event could not be created", type: "error" });
    },
  });

  // Event delete
  const deleteMut = useMutation({
    mutationFn: (eventId: number) => deleteEvent(clubId, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", clubId] });
      push({ message: "Event deleted", type: "info" });
    },
    onError: () => {
      push({ message: "Delete failed", type: "error" });
    },
  });

  // Event edit
  const patchMut = useMutation({
    mutationFn: (payload: { eventId: number; nextTitle: string }) =>
      updateEvent(clubId, payload.eventId, { title: payload.nextTitle }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", clubId] });
      push({ message: "Event updated ✅" });
    },
    onError: () => {
      push({ message: "Update failed", type: "error" });
    },
  });

  // === QR MODAL STATE ===
  const [qrEventId, setQrEventId] = useState<number | null>(null);

  const qrEvent: EventItem | null = useMemo(() => {
    if (qrEventId == null || !eventsQ.data) return null;
    return (eventsQ.data ?? []).find((e: EventItem) => e.id === qrEventId) ?? null;
  }, [qrEventId, eventsQ.data]);

  const qrValue = qrEvent ? `checkin|${qrEvent.id}|club=${clubId}` : "";

  // invalid id
  if (!hasValidClubId) {
    return <div style={{ padding: 16 }}>Invalid club id.</div>;
  }

  if (clubQ.isLoading) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }
  if (!clubQ.data) {
    return <div style={{ padding: 16 }}>Club not found.</div>;
  }

  const club = clubQ.data;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6 }}>{club.name} — Events</h2>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        {club.description || "No description"}
      </div>

      {/* Join/Leave button */}
      {user && (
        <div style={{ marginBottom: 16 }}>
          {!iAmMember ? (
            <button
              onClick={async () => {
                try {
                  await joinClub(user.id, clubId);
                  qc.invalidateQueries({ queryKey: ["myMemberships", user.id] });
                  push({ message: "You joined the club ✅" });
                } catch {
                  push({ message: "Join failed", type: "error" });
                }
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
              Join Club
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  await leaveClub(user.id, clubId);
                  qc.invalidateQueries({ queryKey: ["myMemberships", user.id] });
                  push({ message: "You left the club", type: "info" });
                } catch {
                  push({ message: "Leave failed", type: "error" });
                }
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
              Leave Club
            </button>
          )}
        </div>
      )}

      {/* New event create form - ONLY FOR PRESIDENT */}
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
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <input
            placeholder="Location"
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
              {createMut.isPending ? "Adding..." : "Add Event"}
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      {eventsQ.isLoading ? (
        "Loading..."
      ) : (
        <ul style={{ display: "grid", gap: 8, marginTop: 8, listStyle: "none", padding: 0 }}>
          {(eventsQ.data ?? []).map((e: EventItem) => (
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
                    {new Date(e.startAt).toLocaleString()} – {new Date(e.endAt).toLocaleString()}
                    {e.location ? ` | ${e.location}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
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
                      title="Show check-in QR code for attendance"
                    >
                      QR Code
                    </button>
                  )}

                  {iAmPresident && (
                    <button
                      onClick={() => {
                        const newTitle = window.prompt("New title:", e.title);
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
                      Edit
                    </button>
                  )}

                  {iAmPresident && (
                    <button
                      onClick={() => {
                        if (!window.confirm("Delete this event?")) return;
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
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}

          {eventsQ.data?.length === 0 && <div>No events yet.</div>}
        </ul>
      )}

      {/* === QR MODAL === */}
      <Modal open={!!qrEvent} onClose={() => setQrEventId(null)} title="Event Check-in QR">
        {qrEvent ? (
          <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 600 }}>{qrEvent.title}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {new Date(qrEvent.startAt).toLocaleString()} - {new Date(qrEvent.endAt).toLocaleString()}
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
              <QRCodeCanvas value={qrValue} size={180} includeMargin={true} />
            </div>

            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4, maxWidth: 260 }}>
              The door attendant can scan this code on students' phones to take attendance. (Demo)
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
