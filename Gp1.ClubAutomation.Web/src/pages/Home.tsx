import { useToast } from "../components/Toast";
import { downloadIcs } from "../lib/ics";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext"; // 🌙 theme
import {
  getClubs,
  getUpcomingEventsForUser,
  getAnnouncementsForClubs,
  createAnnouncement,
  getMyMemberships,
  updateAnnouncement,
  deleteAnnouncement,
  isAttending,
  attendEvent,
  unattendEvent,
  getAttendanceCount,
  aiRecommendClubs
} from "../lib/api";
import { Link } from "react-router-dom";
import type { Club, EventItem, Announcement, Membership } from "../types";
import CampusFeed from "../components/CampusFeed";
import CampusMap from "../components/CampusMap";
import { useNotifications } from "../notifications/NotificationContext";


// UI-only (no endpoint call yet): high-level interest areas for the AI recommender modal.
const AI_INTERESTS: string[] = [
  "Sports",
  "Arts",
  "Music",
  "Technology",
  "Software & AI",
  "Robotics",
  "Entrepreneurship",
  "Social Responsibility",
  "Volunteerism",
  "Culture",
  "Photography",
  "Gaming",
  "Health & Wellness",
  "Science",
  "Language",
];
const AI_MAX_SELECTION = 4;


export default function Home() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const { push } = useToast();
  const { refresh } = useNotifications();

  // --- UI state ---
  const [q, setQ] = useState("");
  const [filterClub, setFilterClub] = useState<number | "">("");
  const [days, setDays] = useState<number>(14);
  const [showAnnForm, setShowAnnForm] = useState(false);

  // --- AI modal (UI only) ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSelected, setAiSelected] = useState<string[]>([]);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiFabHover, setAiFabHover] = useState(false);
  const [aiPillHover, setAiPillHover] = useState<string | null>(null);
  const [aiSuggestHover, setAiSuggestHover] = useState(false);
  const [aiResults, setAiResults] = useState<
    { id: number; name: string; description?: string; score: number }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);




  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!user) return <div style={{ padding: 16 }}>Login required.</div>;

  // --- Data: clubs ---
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // ✅ Data: Retrieve memberships from the database (Critical for Home)
  const membershipsQ = useQuery({
    queryKey: ["memberships", user.id],
    queryFn: () => getMyMemberships(user.id),
    enabled: !!user,
  });

  const memberships: Membership[] = useMemo(() => {
    return Array.isArray(membershipsQ.data) ? membershipsQ.data : [];
  }, [membershipsQ.data]);

  const myClubIdsArr = useMemo(
    () => memberships.map((m) => m.clubId).sort((a, b) => a - b),
    [memberships]
  );

  const myClubIds = useMemo(() => new Set<number>(myClubIdsArr), [myClubIdsArr]);

  const myPresidentClubIds = useMemo(
    () => memberships.filter((m) => m.role === "President").map((m) => m.clubId),
    [memberships]
  );

  const myClubs: Club[] = useMemo(() => {
    return (clubsQ.data ?? []).filter((c) => myClubIds.has(c.id));
  }, [clubsQ.data, myClubIds]);

  // --- Data: Upcoming events (parametric days) ---
  const upcomingQ = useQuery({
    queryKey: ["upcoming", user.id, days],
    queryFn: () => getUpcomingEventsForUser(user.id, days),
    enabled: !!user,
  });

  // --- Data: Weekly view (7 days) ---
  const weeklyQ = useQuery({
    queryKey: ["upcoming7", user.id],
    queryFn: () => getUpcomingEventsForUser(user.id, 7),
    enabled: !!user,
  });

  // ✅ Announcements key: Must be linked to the clubId list (string join is sufficient)
  const annKey = useMemo(() => {
    return ["announcements", user.id, myClubIdsArr.join(",")];
  }, [user.id, myClubIdsArr]);

  const annsQ = useQuery({
    queryKey: annKey,
    queryFn: () => getAnnouncementsForClubs(myClubIdsArr),
    enabled: !!user && myClubIdsArr.length > 0,
  });

  // --- Announcement form state ---
  const [annClub, setAnnClub] = useState<number | "">("");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);

  // President club default selection
  useEffect(() => {
    if (annClub === "" && myPresidentClubIds.length > 0) {
      setAnnClub(myPresidentClubIds[0]);
    }
  }, [annClub, myPresidentClubIds]);

  const createAnn = useMutation({
    mutationFn: () => {
      if (annClub === "") throw new Error("Club not selected");
      return createAnnouncement(annClub, {
        title: annTitle,
        content: annContent,
        pinned: annPinned,
      });
    },
    onSuccess: () => {
      setAnnTitle("");
      setAnnContent("");
      setAnnPinned(false);

      // ✅ Invalidate the same key
      qc.invalidateQueries({ queryKey: annKey as any });

      // Reload the announcements in NotificationProvider
      refresh();

      setShowAnnForm(false);
      push({ message: "Announcement published ✅" });
    },
    onError: () => {
      push({ message: "Failed to publish announcement", type: "error" });
    },
  });

  // --- Filters ---
  const upcomingFiltered: EventItem[] = useMemo(() => {
    const base = upcomingQ.data ?? [];
    const term = q.trim().toLowerCase();
    return base
      .filter((e) => filterClub === "" || e.clubId === filterClub)
      .filter(
        (e) =>
          !term ||
          e.title.toLowerCase().includes(term) ||
          (e.location || "").toLowerCase().includes(term)
      );
  }, [upcomingQ.data, q, filterClub]);

  // Weekly: Group by date heading
  const weeklyGrouped = useMemo(() => {
    const list = weeklyQ.data ?? [];
    const map = new Map<string, EventItem[]>();
    list.forEach((e) => {
      const d = new Date(e.startAt);
      const key = d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [weeklyQ.data]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // --- Card style ---
  const cardStyle: React.CSSProperties = {
    background: theme === "dark" ? "#1f2937" : "#fff",
    border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
    borderRadius: 12,
    boxShadow:
      theme === "dark"
        ? "0 2px 6px rgba(0,0,0,.3)"
        : "0 2px 8px rgba(0,0,0,.05)",
    padding: 16,
    transition: "all .3s ease",
  };

  const isLoadingHeader = clubsQ.isLoading || membershipsQ.isLoading;


  // --- AI UI helpers (UI only) ---
  const aiCanSuggest = aiSelected.length > 0;
  const aiAtLimit = aiSelected.length >= AI_MAX_SELECTION;


  // UI-only placeholder: pick a few clubs to render as "suggested".
  const aiRecommendedPreview: Club[] = useMemo(() => {
    const all = clubsQ.data ?? [];
    if (!aiResults.length) return [];
    // AI sonuçlarındaki id’lere göre gerçek Club objelerini buluyoruz (Link/route için)
    const byId = new Map(all.map((c) => [c.id, c]));
    return aiResults
      .map((r) => byId.get(r.id))
      .filter(Boolean)
      .slice(0, 5) as Club[];
  }, [clubsQ.data, aiResults]);


  function toggleAiInterest(label: string) {
    setAiSuggested(false);

    setAiSelected((prev) => {
      const already = prev.includes(label);

      if (already) return prev.filter((x) => x !== label); // unselect always allowed
      if (prev.length >= AI_MAX_SELECTION) return prev;    // block if limit reached

      return [...prev, label]; // select
    });
  }


  function closeAi() {
    setAiOpen(false);
    setAiSuggested(false);
    setAiSelected([]);
    setAiResults([]);
    setAiLoading(false);
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      {/* === HERO / HEADER PART === */}
      <div
        style={{
          borderRadius: 16,
          padding: "16px 20px",
          background:
            "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(147,51,234,1) 100%)",
          color: "#fff",
          boxShadow: "0 24px 60px rgba(0,0,0,.25)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 16,
          minHeight: 140,
        }}
      >
        {/* Left side: welcome text */}
        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 500 }}>
            {todayLabel}
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.3,
              marginTop: 4,
            }}
          >
            Welcome,{" "}
            <span style={{ fontWeight: 800 }}>{user.name || user.email}</span>{" "}
            👋
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              marginTop: 8,
              lineHeight: 1.4,
              maxWidth: 360,
            }}
          >
            What's happening today? Find upcoming events and the latest
            announcements from your clubs right here!
          </div>
        </div>

        {/* Right side: quick statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 8,
            flex: "1 1 260px",
            minWidth: 240,
            maxWidth: 400,
          }}
        >
          {/* Card 1: My Clubs */}
          <div
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 12,
              padding: "10px 12px",
              minHeight: 70,
              display: "grid",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>My Clubs</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              {isLoadingHeader ? "…" : myClubs.length}
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.8,
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              Clubs you are a member of
            </div>
          </div>

          {/* Card 2: Upcoming Events */}
          <div
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 12,
              padding: "10px 12px",
              minHeight: 70,
              display: "grid",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>Upcoming</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              {upcomingQ.data?.length ?? 0}
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.8,
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              Events in the next {days} days
            </div>
          </div>

          {/* Card 3: Announcements */}
          <div
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 12,
              padding: "10px 12px",
              minHeight: 70,
              display: "grid",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>Announcements</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              {annsQ.isLoading ? "…" : (annsQ.data?.length ?? 0)}
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.8,
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              From your clubs
            </div>
          </div>
        </div>
      </div>

      {/* === Filter bar === */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 8,
        }}
      >
        <input
          placeholder="Search events (title/location)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <select
          value={filterClub === "" ? "" : String(filterClub)}
          onChange={(e) => setFilterClub(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">All Clubs</option>
          {myClubs.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={String(days)}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </section>

      {/* === President quick actions === */}
      {myPresidentClubIds.length > 0 && (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <strong>Quick Actions</strong>
            <span style={{ fontSize: 12, color: "#666" }}>
              (club presidents only)
            </span>
            <div style={{ flex: 1 }} />
            <Link
              to={`/clubs/${myPresidentClubIds[0]}/events`}
              style={{
                textDecoration: "none",
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              Create Event
            </Link>
            <button
              onClick={() => setShowAnnForm((s) => !s)}
              style={{
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              {showAnnForm ? "Cancel" : "Publish Announcement"}
            </button>
          </div>

          {showAnnForm && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: 8,
              }}
            >
              {myPresidentClubIds.length > 1 && (
                <select
                  value={annClub === "" ? "" : String(annClub)}
                  onChange={(e) => setAnnClub(e.target.value ? Number(e.target.value) : "")}
                  style={{
                    padding: 10,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                >
                  {myPresidentClubIds.map((cid) => {
                    const name = clubsQ.data?.find((c) => c.id === cid)?.name || "Club";
                    return (
                      <option key={cid} value={String(cid)}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              )}

              {myPresidentClubIds.length === 1 && (
                <input
                  readOnly
                  value={clubsQ.data?.find((c) => c.id === myPresidentClubIds[0])?.name || "Club"}
                  style={{
                    padding: 10,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                />
              )}

              <input
                placeholder="Announcement title"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                />
                Pin to top
              </label>

              <textarea
                placeholder="Short content (optional)"
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                rows={3}
                style={{
                  gridColumn: "1 / -1",
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  resize: "vertical",
                }}
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  onClick={() => createAnn.mutate()}
                  disabled={
                    (!annClub && myPresidentClubIds.length > 1) ||
                    !annTitle ||
                    createAnn.isPending
                  }
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: "#3b82f6",
                    color: "#fff",
                  }}
                >
                  {createAnn.isPending ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Upcoming Events */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📅 Upcoming Events</h3>
        {upcomingQ.isLoading ? (
          <div>Loading…</div>
        ) : upcomingFiltered.length === 0 ? (
          <Empty
            text={
              q || filterClub
                ? "No events match your filters."
                : "No upcoming events."
            }
            theme={theme}
          />
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {upcomingFiltered.map((e) => (
              <EventRow key={e.id} e={e} clubs={clubsQ.data ?? []} userId={user.id} theme={theme} />
            ))}
          </ul>
        )}
      </section>

      {/* === Campus Map === */}
      <CampusMap userId={user.id} />

      {/* Announcements — edit/delete for the president */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📢 Announcements</h3>

        {membershipsQ.isLoading ? (
          <div>Loading…</div>
        ) : myClubIdsArr.length === 0 ? (
          <Empty text="You must be a member of at least one club to see announcements." theme={theme} />
        ) : annsQ.isLoading ? (
          <div>Loading…</div>
        ) : (annsQ.data?.length ?? 0) === 0 ? (
          <Empty text="No announcements from your clubs." theme={theme} />
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {(annsQ.data as Announcement[]).map((a) => {
              const isPresidentHere = myPresidentClubIds.includes(a.clubId);
              return (
                <li key={a.id} style={{ ...rowCard(theme) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start", flexWrap: "wrap" }}>
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
                            Pinned
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666", marginTop: 2 }}>
                        {formatDateTime(a.createdAt)}
                      </div>
                      {a.content && <div style={{ fontSize: 14, marginTop: 8 }}>{a.content}</div>}
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <ClubPill clubs={clubsQ.data ?? []} clubId={a.clubId} theme={theme} />

                      {isPresidentHere && (
                        <>
                          <button
                            onClick={async () => {
                              const title = window.prompt("New title:", a.title);
                              if (!title) return;
                              await updateAnnouncement(a.id, { title });
                              qc.invalidateQueries({ queryKey: annKey as any });
                              refresh();
                              push({ message: "Announcement updated ✅" });
                            }}
                            style={btn(theme)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Do you want to delete this announcement?")) return;
                              await deleteAnnouncement(a.id);
                              qc.invalidateQueries({ queryKey: annKey as any });
                              refresh();
                              push({ message: "Announcement deleted", type: "info" });
                            }}
                            style={{ ...btn(theme), color: "#b91c1c" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* This week */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>🗓 This Week</h3>
        {weeklyQ.isLoading ? (
          <div>Loading…</div>
        ) : weeklyGrouped.length === 0 ? (
          <Empty text="No events in the next 7 days." theme={theme} />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {weeklyGrouped.map(([dateLabel, items]) => (
              <div
                key={dateLabel}
                style={{
                  border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{dateLabel}</div>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>
                  {items.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666" }}>
                          {formatTime(e.startAt)} – {formatTime(e.endAt)} {e.location ? `| ${e.location}` : ""}
                        </div>
                      </div>
                      <ClubPill clubs={clubsQ.data ?? []} clubId={e.clubId} theme={theme} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Clubs */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>🏛 My Clubs</h3>
        {clubsQ.isLoading || membershipsQ.isLoading ? (
          <div>Loading…</div>
        ) : myClubs.length === 0 ? (
          <Empty text="You are not a member of any club yet. You can join from the Clubs page." theme={theme} />
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {myClubs.map((c) => (
              <li
                key={c.id}
                style={{
                  ...rowCard(theme),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: theme === "dark" ? "#9ca3af" : "#555" }}>
                    {c.description || "—"}
                  </div>
                </div>
                <Link to={`/clubs/${c.id}/events`} style={btn(theme)}>
                  Events
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>


      {/* === AI: floating button + modal (UI only) === */}
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        onMouseEnter={() => setAiFabHover(true)}
        onMouseLeave={() => setAiFabHover(false)}
        aria-label="Open AI club recommender"
        title="AI Club Recommendation"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 999,
          border: "1px solid rgba(255,255,255,.18)",
          cursor: "pointer",
          borderRadius: 999,
          padding: "12px 14px",
          boxShadow:
            theme === "dark"
              ? "0 14px 34px rgba(0,0,0,.52)"
              : "0 14px 34px rgba(0,0,0,.22)",
          background: theme === "dark" ? "rgba(17,24,39,.92)" : "rgba(17,24,39,.92)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,

          // premium touches
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "transform .15s ease, box-shadow .15s ease, opacity .15s ease",
          transform: aiFabHover ? "translateY(-2px)" : "translateY(0)",
          opacity: aiFabHover ? 1 : 0.96,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🤖</span>

        {/*  */}
        <span
          style={{
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: 0.2,
            maxWidth: aiFabHover ? 120 : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "max-width .18s ease",
          }}
        >
          AI Club
        </span>
      </button>

      {aiOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAi();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: theme === "dark" ? "rgba(0,0,0,.65)" : "rgba(0,0,0,.45)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(920px, 100%)",
              borderRadius: 16,
              border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
              background: theme === "dark" ? "#0b1220" : "#fff",
              boxShadow:
                theme === "dark"
                  ? "0 24px 80px rgba(0,0,0,.55)"
                  : "0 24px 80px rgba(0,0,0,.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom:
                  theme === "dark" ? "1px solid #1f2937" : "1px solid #f1f5f9",
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(15,23,42,1) 100%)"
                    : "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>

                    AI CLUB RECOMMENDATION
                  </div>

                  {/* BETA chip */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.6,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: theme === "dark" ? "1px solid #374151" : "1px solid #e2e8f0",
                      background: theme === "dark" ? "rgba(99,102,241,.16)" : "rgba(99,102,241,.10)",
                      color: theme === "dark" ? "#c7d2fe" : "#3730a3",
                    }}
                  >
                    BETA
                  </span>

                  {/* Selected count */}
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 12,
                      color: theme === "dark" ? "#9ca3af" : "#64748b",
                      fontWeight: 800,
                    }}
                  >
                    Selected: {aiSelected.length}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: theme === "dark" ? "#9ca3af" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  Select interest areas and generate a club suggestion list.
                </div>
              </div>

              <button
                type="button"
                onClick={closeAi}
                aria-label="Close"
                style={{
                  border:
                    theme === "dark" ? "1px solid #374151" : "1px solid #e2e8f0",
                  background: theme === "dark" ? "#111827" : "#fff",
                  color: theme === "dark" ? "#e5e7eb" : "#111",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>Interest Areas</div>

                <div
                  style={{
                    fontSize: 12,
                    color: theme === "dark" ? "#9ca3af" : "#64748b",
                    fontWeight: 800,
                  }}
                >
                  {aiSelected.length}/{AI_MAX_SELECTION} selected
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: theme === "dark" ? "#9ca3af" : "#64748b",
                  marginTop: 4,
                }}
              >
                You can select up to {AI_MAX_SELECTION} interest areas.
              </div>


              {/* Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {AI_INTERESTS.map((label) => {
                  const active = aiSelected.includes(label);
                  const disabled = !active && aiSelected.length >= AI_MAX_SELECTION;

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleAiInterest(label)}
                      onMouseEnter={() => setAiPillHover(label)}
                      onMouseLeave={() => setAiPillHover(null)}
                      disabled={disabled}
                      style={{
                        borderRadius: 999,
                        padding: "10px 12px",
                        border: "1px solid",
                        borderColor: active
                          ? theme === "dark"
                            ? "#60a5fa"
                            : "#3b82f6"
                          : theme === "dark"
                            ? "#374151"
                            : "#e2e8f0",
                        background: active
                          ? theme === "dark"
                            ? "rgba(59,130,246,.22)"
                            : "rgba(59,130,246,.12)"
                          : theme === "dark"
                            ? "#111827"
                            : "#fff",
                        color: theme === "dark" ? "#e5e7eb" : "#111",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? (theme === "dark" ? 0.55 : 0.6) : 1,
                        fontWeight: 800,
                        fontSize: 13,
                        transition: "transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease",
                        transform: !disabled && aiPillHover === label ? "translateY(-1px)" : "translateY(0)",
                        boxShadow: active
                          ? theme === "dark"
                            ? "0 10px 26px rgba(59,130,246,.18)"
                            : "0 10px 26px rgba(59,130,246,.14)"
                          : "none",

                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Results (UI placeholder) */}
              <div style={{ marginTop: 4 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: theme === "dark" ? "#9ca3af" : "#64748b",
                    fontWeight: 800,
                  }}
                >
                  Suggested Clubs
                </div>

                {/* 1) No interests selected */}
                {!aiSelected.length ? (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 12,
                      padding: 14,
                      border: theme === "dark" ? "1px dashed #374151" : "1px dashed #cbd5e1",
                      color: theme === "dark" ? "#9ca3af" : "#64748b",
                      fontSize: 13,
                    }}
                  >
                    Select at least one interest to enable <b>Suggest</b>.
                  </div>
                ) : /* 2) Interests selected but not suggested yet => skeleton */ !aiSuggested ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          border: theme === "dark" ? "1px solid #374151" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: 12,
                          background: theme === "dark" ? "#111827" : "#fff",
                        }}
                      >
                        <div
                          style={{
                            height: 12,
                            width: "45%",
                            borderRadius: 999,
                            background: theme === "dark" ? "#1f2937" : "#e2e8f0",
                            marginBottom: 10,
                          }}
                        />
                        <div
                          style={{
                            height: 10,
                            width: "70%",
                            borderRadius: 999,
                            background: theme === "dark" ? "#1f2937" : "#e2e8f0",
                          }}
                        />
                      </div>
                    ))}

                    <div
                      style={{
                        fontSize: 12,
                        color: theme === "dark" ? "#9ca3af" : "#64748b",
                      }}
                    >
                      Ready to generate recommendations based on your selection.
                    </div>
                  </div>
                ) : (
                  /* 3) Suggested => existing cards */
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {aiRecommendedPreview.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          border: theme === "dark" ? "1px solid #374151" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: 12,
                          background: theme === "dark" ? "#111827" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 900,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.name}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: theme === "dark" ? "#9ca3af" : "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 560,
                            }}
                          >
                            {c.description || "—"}
                          </div>
                        </div>

                        <Link to={`/clubs/${c.id}/events`} style={btn(theme)}>
                          View
                        </Link>
                      </div>
                    ))}

                    {!aiRecommendedPreview.length && (
                      <div
                        style={{
                          borderRadius: 12,
                          padding: 14,
                          border: theme === "dark" ? "1px dashed #374151" : "1px dashed #cbd5e1",
                          color: theme === "dark" ? "#9ca3af" : "#64748b",
                          fontSize: 13,
                        }}
                      >
                        No clubs available for preview. (This will be replaced by AI results later.)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Body finished (Footer under this) */}
            </div>


            {/* Footer (Suggest right-bottom) */}

            <div
              style={{
                padding: 16,
                display: "flex",
                justifyContent: "flex-end",
                borderTop:
                  theme === "dark" ? "1px solid #1f2937" : "1px solid #f1f5f9",
                gap: 10,
                background: theme === "dark" ? "#0b1220" : "#fff",
              }}
            >
              <button
                type="button"
                onClick={async () => {
                  if (!aiCanSuggest || aiLoading) return;

                  try {
                    setAiLoading(true);
                    setAiSuggested(true);

                    const res = await aiRecommendClubs({ interests: aiSelected });

                    setAiResults(Array.isArray(res?.recommendedClubs) ? res.recommendedClubs : []);
                    push({ message: "AI recommendations generated ✅" });
                  } catch (e: any) {
                    setAiResults([]);
                    push({ message: "AI recommendation failed", type: "error" });
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={!aiCanSuggest}
                onMouseEnter={() => setAiSuggestHover(true)}
                onMouseLeave={() => setAiSuggestHover(false)}
                title={aiCanSuggest ? "Generate recommendations" : "Select at least 1 interest"}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: aiCanSuggest ? "pointer" : "not-allowed",
                  background: aiCanSuggest
                    ? theme === "dark"
                      ? "#2563eb"
                      : "#3b82f6"
                    : theme === "dark"
                      ? "#1f2937"
                      : "#e2e8f0",
                  color: aiCanSuggest ? "#fff" : theme === "dark" ? "#9ca3af" : "#64748b",
                  fontWeight: 900,
                  letterSpacing: 0.2,

                  // ✅ CTA polish
                  transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
                  transform: aiCanSuggest && aiSuggestHover ? "translateY(-1px)" : "translateY(0)",
                  boxShadow: aiCanSuggest
                    ? theme === "dark"
                      ? "0 14px 32px rgba(37,99,235,.28)"
                      : "0 14px 32px rgba(37,99,235,.22)"
                    : "none",
                  filter: aiCanSuggest && aiSuggestHover ? "brightness(1.03)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Suggest <span style={{ fontWeight: 900 }}>→</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* === Auxiliary styles === */
const navBtn = (theme: "light" | "dark" | string) => ({
  padding: "8px 12px",
  border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
  borderRadius: 8,
  background: theme === "dark" ? "#1f2937" : "#fff",
  color: theme === "dark" ? "#e5e7eb" : "#111",
  textDecoration: "none",
  transition: "all .2s ease",
});
const input = (theme: "light" | "dark" | string) => ({
  padding: 10,
  border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
  borderRadius: 8,
  background: theme === "dark" ? "#111827" : "#fff",
  color: theme === "dark" ? "#e5e7eb" : "#111",
});
const btn = (theme: "light" | "dark" | string) => ({
  padding: "6px 10px",
  borderRadius: 8,
  border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
  background: theme === "dark" ? "#1f2937" : "#fff",
  color: theme === "dark" ? "#e5e7eb" : "#111",
  cursor: "pointer",
  textDecoration: "none",
});
const mainBtn = (theme: "light" | "dark" | string) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: theme === "dark" ? "#2563eb" : "#3b82f6",
  color: "#fff",
  cursor: "pointer",
});

/* === Components === */

function EventRow({
  e,
  clubs,
  userId,
  theme,
}: {
  e: EventItem;
  clubs: Club[];
  userId: number;
  theme: "light" | "dark" | string;
}) {
  const { push } = useToast();

  const [count, setCount] = useState<number>(0);
  const [attending, setAttending] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [c, a] = await Promise.all([
          getAttendanceCount(e.id),
          isAttending(e.id, userId),
        ]);
        if (!cancelled) {
          setCount(c);
          setAttending(a);
        }
      } catch {
        // silent
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [e.id, userId]);

  async function onToggle() {
    if (busy) return;
    setBusy(true);

    const prevAttending = attending;
    const prevCount = count;

    try {
      if (attending) {
        setAttending(false);
        setCount((x) => Math.max(0, x - 1));
        const c = await unattendEvent(e.id, userId);
        setCount(c);
        push({ message: "Your attendance was removed", type: "info" });
      } else {
        setAttending(true);
        setCount((x) => x + 1);
        const c = await attendEvent(e.id, userId);
        setCount(c);
        push({ message: "You're attending ✅" });
      }
    } catch {
      setAttending(prevAttending);
      setCount(prevCount);
      push({ message: "Action failed", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li style={rowCard(theme)}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: theme === "dark" ? "#e5e7eb" : "#111" }}>
            {e.title}
          </div>

          <div style={{ fontSize: 13, color: theme === "dark" ? "#9ca3af" : "#555" }}>
            {formatDateTime(e.startAt)} – {formatDateTime(e.endAt)}{" "}
            {e.location ? `| ${e.location}` : ""}
          </div>

          <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666", marginTop: 4 }}>
            {count} people attending
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ClubPill clubs={clubs} clubId={e.clubId} theme={theme} />

          <button
            onClick={() =>
              downloadIcs({
                title: e.title,
                description: e.description || "",
                location: e.location || "",
                startISO: e.startAt,
                endISO: e.endAt,
              })
            }
            style={btn(theme)}
          >
            Add to Calendar
          </button>

          <button
            onClick={onToggle}
            disabled={busy}
            style={{
              ...btn(theme),
              background: attending
                ? theme === "dark"
                  ? "#0b3a53"
                  : "#e0f2fe"
                : theme === "dark"
                  ? "#1f2937"
                  : "#fff",
              color: attending ? "#7dd3fc" : undefined,
              minWidth: 110,
            }}
          >
            {busy ? "..." : attending ? "Cancel" : "Attend"}
          </button>
        </div>
      </div>
    </li>
  );
}

function Empty({ text, theme = "light" }: { text: string; theme?: "light" | "dark" | string }) {
  return (
    <div
      style={{
        border: theme === "dark" ? "1px dashed #374151" : "1px dashed #ddd",
        borderRadius: 12,
        padding: 16,
        color: theme === "dark" ? "#9ca3af" : "#666",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function clubEmoji(name?: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("futbol")) return "⚽";
  if (n.includes("spor")) return "🎮";
  if (n.includes("masa tenisi")) return "🏓";
  if (n.includes("zeka") || n.includes("ai")) return "🤖";
  if (n.includes("güvenlik")) return "🛡️";
  return "🏷️";
}

function ClubPill({
  clubs,
  clubId,
  theme = "light",
}: {
  clubs: Club[];
  clubId: number;
  theme?: "light" | "dark" | string;
}) {
  const club = clubs.find((c) => c.id === clubId);
  const name = club?.name || "Club";
  return (
    <Link
      to={`/clubs/${clubId}/events`}
      style={{
        textDecoration: "none",
        padding: "6px 10px",
        border: theme === "dark" ? "1px solid #374151" : "1px solid #ddd",
        borderRadius: 999,
        fontSize: 12,
        background: theme === "dark" ? "#0b1220" : "#f8fafc",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{clubEmoji(name)}</span>
      {name}
    </Link>
  );
}

function rowCard(theme: "light" | "dark" | string = "light"): React.CSSProperties {
  return {
    border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
    borderRadius: 10,
    padding: 12,
    boxShadow:
      theme === "dark" ? "0 2px 6px rgba(0,0,0,.25)" : "0 4px 16px rgba(0,0,0,.05)",
    background: theme === "dark" ? "#1f2937" : "#fff",
  };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
