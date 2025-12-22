import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClub, getClubs, getMyMemberships, joinClub, leaveClub } from "../lib/api";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Membership } from "../types";

export default function Clubs() {
  const qc = useQueryClient();
  const { user } = useAuth();

  // UI state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [q, setQ] = useState("");

  // ✅ Clubs
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // ✅ Memberships
  const membershipsQ = useQuery({
    queryKey: ["memberships", user?.id],
    queryFn: () => getMyMemberships(user!.id),
    enabled: !!user,
  });

  const myMs: Membership[] = Array.isArray(membershipsQ.data) ? membershipsQ.data : [];

  const isAnyPresident = useMemo(() => myMs.some((m) => m.role === "President"), [myMs]);

  const isMember = (clubId: number) => myMs.some((m) => m.clubId === clubId);

  // ✅ Create club
  const m = useMutation({
    mutationFn: () => createClub({ name, description: desc }),
    onSuccess: () => {
      setName("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["clubs"] });
    },
  });

  // 🔴 Temporarily safe wrappers (prevents crash if endpoints fail)
  const handleJoin = async (_clubId: number) => {
    if (!user) return;

    try {
      await joinClub(user.id, _clubId);

      // Renew memberships and club details
      await qc.invalidateQueries({ queryKey: ["memberships", user.id] });
      await qc.invalidateQueries({ queryKey: ["clubs"] }); // optional
    } catch (e) {
      console.error("joinClub failed", e);
    }
  };

  const handleLeave = async (_clubId: number) => {
    if (!user) return;

    try {
      await leaveClub(user.id, _clubId);

      await qc.invalidateQueries({ queryKey: ["memberships", user.id] });
      await qc.invalidateQueries({ queryKey: ["clubs"] }); // optional
    } catch (e) {
      console.error("leaveClub failed", e);
    }
  };

  const filtered = useMemo(() => {
    const list = clubsQ.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.description || "").toLowerCase().includes(s)
    );
  }, [clubsQ.data, q]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Clubs</h2>

      {isAnyPresident ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Club name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <input
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
          />
          <button
            onClick={() => m.mutate()}
            disabled={!name || m.isPending}
            style={{
              padding: "8px 12px",
              border: "none",
              borderRadius: 8,
              background: "#22c55e",
              color: "#fff",
            }}
          >
            {m.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 16, fontSize: 13, color: "#666" }}>
          (Only club presidents can create a new club.)
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Search clubs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
        />
      </div>

      {clubsQ.isLoading || membershipsQ.isLoading ? (
        "Loading..."
      ) : (
        <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
          {filtered.map((c) => (
            <li
              key={c.id}
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
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{c.description || "—"}</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {user &&
                    (isMember(c.id) ? (
                      <button
                        onClick={() => handleLeave(c.id)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          background: "#fff",
                        }}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(c.id)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          background: "#fff",
                        }}
                      >
                        Join
                      </button>
                    ))}

                  <Link
                    to={`/clubs/${c.id}/events`}
                    style={{
                      textDecoration: "none",
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  >
                    Events
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
