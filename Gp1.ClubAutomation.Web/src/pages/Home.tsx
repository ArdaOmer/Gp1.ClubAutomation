import { useToast } from "../components/Toast";
import { downloadIcs } from "../lib/ics";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext"; // 🌙 tema
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
} from "../lib/api";
import { Link } from "react-router-dom";
import type { Club, EventItem, Announcement } from "../types";
import CampusFeed from "../components/CampusFeed";
import CampusMap from "../components/CampusMap";




export default function Home() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const { push } = useToast();

  // --- UI state ---
  const [q, setQ] = useState("");
  const [filterClub, setFilterClub] = useState<string>("");
  const [days, setDays] = useState<number>(14);
  const [showAnnForm, setShowAnnForm] = useState(false);

  // --- Data: kulüpler ve üyelikler ---
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  const memberships = useMemo(() => (user ? getMyMemberships(user.id) : []), [user]);
  const myClubIds = useMemo(() => new Set(memberships.map((m) => m.clubId)), [memberships]);
  const myPresidentClubIds = useMemo(
    () => memberships.filter((m) => m.role === "President").map((m) => m.clubId),
    [memberships]
  );

  // --- Data: yaklaşan etkinlikler (parametrik gün) ---
  const upcomingQ = useQuery({
    queryKey: ["upcoming", user?.id, days],
    queryFn: () => getUpcomingEventsForUser(user!.id, days),
    enabled: !!user,
  });

  // --- Data: haftalık görünüm (7 gün) ---
  const weeklyQ = useQuery({
    queryKey: ["upcoming7", user?.id],
    queryFn: () => getUpcomingEventsForUser(user!.id, 7),
    enabled: !!user,
  });

  // --- Data: duyurular ---
  const annKey = useMemo(() => {
    const ids = Array.from(myClubIds.values()).sort();
    return ["announcements", user?.id, ids.join(",")];
  }, [myClubIds, user?.id]);

  const annsQ = useQuery({
    queryKey: annKey,
    queryFn: () => getAnnouncementsForClubs(Array.from(myClubIds.values())),
    enabled: !!user && myClubIds.size > 0,
  });

  // --- Duyuru form state ---
  const [annClub, setAnnClub] = useState<string>("");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);

  useEffect(() => {
    if (!annClub && myPresidentClubIds.length > 0) {
      setAnnClub(myPresidentClubIds[0]);
    }
  }, [annClub, myPresidentClubIds]);

  const createAnn = useMutation({
    mutationFn: () => createAnnouncement(annClub, { title: annTitle, content: annContent, pinned: annPinned }),
    onSuccess: () => {
      setAnnTitle(""); setAnnContent(""); setAnnPinned(false);
      qc.invalidateQueries({ queryKey: annKey as any });
      setShowAnnForm(false);
      push({ message: "Duyuru yayınlandı ✅" });
    },
    onError: () => {
      push({ message: "Duyuru yayınlanamadı", type: "error" });
    }
  });

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  if (!user) return <div style={{ padding: 16 }}>Giriş gerekli.</div>;

  const myClubs: Club[] = useMemo(() => {
    return (clubsQ.data ?? []).filter((c) => myClubIds.has(c.id));
  }, [clubsQ.data, myClubIds]);

  // --- Filtreler ---
  const upcomingFiltered: EventItem[] = useMemo(() => {
    const base = upcomingQ.data ?? [];
    const term = q.trim().toLowerCase();
    return base
      .filter(e => !filterClub || e.clubId === filterClub)
      .filter(e =>
        !term ||
        e.title.toLowerCase().includes(term) ||
        (e.location || "").toLowerCase().includes(term)
      );
  }, [upcomingQ.data, q, filterClub]);

  // Haftalık: tarih başlığına göre grupla
  const weeklyGrouped = useMemo(() => {
    const list = weeklyQ.data ?? [];
    const map = new Map<string, EventItem[]>();
    list.forEach(e => {
      const d = new Date(e.startAt);
      const key = d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "2-digit" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [weeklyQ.data]);

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  // --- Kart stili ---
  const cardStyle: React.CSSProperties = {
    background: theme === "dark" ? "#1f2937" : "#fff",
    border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
    borderRadius: 12,
    boxShadow: theme === "dark" ? "0 2px 6px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.05)",
    padding: 16,
    transition: "all .3s ease",
  };

  return (
    <div style={{
      padding: 24,
      display: "grid",
      gap: 20,
      background: theme === "dark" ? "#111827" : "#f9fafb",
      color: theme === "dark" ? "#e5e7eb" : "#111",
      minHeight: "100vh",
      transition: "background .3s,color .3s"
    }}>
      {/* Başlık + tarih + kısayollar */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>👋 Hoş geldin, {user.name || user.email}</div>
          <div style={{ fontSize: 13, color: theme === "dark" ? "#9ca3af" : "#555" }}>{todayLabel}</div>
        </div>
        <div style={{ flex: 1 }} />
        <Link to="/profile" style={navBtn(theme)}>Profilim</Link>
        <Link to="/clubs" style={navBtn(theme)}>Kulüpler</Link>
      </header>
      {/* === Kampüs Akışı === */}
<CampusFeed userId={user.id} myClubIds={Array.from(myClubIds.values())} />


      {/* Hızlı istatistik kartları */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <StatCard title="Kulüplerim" value={myClubs.length} loading={clubsQ.isLoading} hint="Üye olduğun kulüpler" to="/clubs" theme={theme}/>
        <StatCard title={`Yaklaşan Etkinlik (${days}g)`} value={upcomingQ.data?.length ?? 0} loading={upcomingQ.isLoading} hint={`${days} gün içinde`} theme={theme}/>
        <StatCard title="Duyurular" value={annsQ.data?.length ?? 0} loading={annsQ.isLoading} hint="Kulüplerinden gelen" theme={theme}/>
      </section>

      {/* Filtreler */}
      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
        <input
          placeholder="Etkinliklerde ara (başlık/konum)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={input(theme)}
        />
        <select
          value={filterClub}
          onChange={(e) => setFilterClub(e.target.value)}
          style={input(theme)}
        >
          <option value="">Tüm Kulüpler</option>
          {myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={String(days)}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={input(theme)}
        >
          <option value="7">7 gün</option>
          <option value="14">14 gün</option>
          <option value="30">30 gün</option>
        </select>
      </section>

      {/* Hızlı aksiyonlar — yalnızca BAŞKAN */}
      {myPresidentClubIds.length > 0 && (
        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <strong>⚙️ Hızlı Aksiyonlar</strong>
            <span style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666" }}>(yalnızca kulüp başkanları)</span>
            <div style={{ flex: 1 }} />
            <Link
              to={`/clubs/${myPresidentClubIds[0]}/events`}
              style={btn(theme)}
            >
              Yeni Etkinlik Oluştur
            </Link>
            <button
              onClick={() => setShowAnnForm(s => !s)}
              style={btn(theme)}
            >
              {showAnnForm ? "İptal" : "Duyuru Yayınla"}
            </button>
          </div>

          {showAnnForm && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
              {myPresidentClubIds.length > 1 ? (
                <select
                  value={annClub}
                  onChange={(e) => setAnnClub(e.target.value)}
                  style={input(theme)}
                >
                  {myPresidentClubIds.map((cid) => {
                    const name = clubsQ.data?.find(c => c.id === cid)?.name || "Kulüp";
                    return <option key={cid} value={cid}>{name}</option>;
                  })}
                </select>
              ) : (
                <input
                  readOnly
                  value={clubsQ.data?.find(c => c.id === myPresidentClubIds[0])?.name || "Kulüp"}
                  style={{ ...input(theme), background: theme === "dark" ? "#0b1220" : "#fafafa" }}
                />
              )}

              <input
                placeholder="Duyuru başlığı"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                style={input(theme)}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} />
                Üste sabitle (pinned)
              </label>
              <textarea
                placeholder="Kısa içerik (opsiyonel)"
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                rows={3}
                style={{ ...input(theme), resize: "vertical", gridColumn: "1 / -1" }}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  onClick={() => createAnn.mutate()}
                  disabled={(!annClub && myPresidentClubIds.length > 1) || !annTitle || createAnn.isPending}
                  style={mainBtn(theme)}
                >
                  {createAnn.isPending ? "Yayınlanıyor..." : "Yayınla"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Yaklaşan etkinlikler */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📅 Yaklaşan Etkinlikler</h3>
        {upcomingQ.isLoading ? (
          <div>Yükleniyor…</div>
        ) : upcomingFiltered.length === 0 ? (
          <Empty text={q || filterClub ? "Filtrelere uygun etkinlik bulunamadı." : "Yaklaşan etkinlik bulunmuyor."} theme={theme}/>
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {upcomingFiltered.map((e) => (
              <EventRow key={e.id} e={e} clubs={clubsQ.data ?? []} userId={user.id} />
            ))}
          </ul>
        )}
      </section>
      {/* === Kampüs Haritası === */}
<CampusMap userId={user.id} />


      {/* Duyurular — düzenle/sil başkana */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📢 Duyurular</h3>
        {annsQ.isLoading ? (
          <div>Yükleniyor…</div>
        ) : (annsQ.data?.length ?? 0) === 0 ? (
          <Empty text="Kulüplerinden duyuru bulunmuyor." theme={theme}/>
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
                          <span style={{
                            fontSize: 11,
                            color: "#b91c1c",
                            marginLeft: 6,
                            border: "1px solid #fca5a5",
                            padding: "2px 6px",
                            borderRadius: 999
                          }}>
                            Sabit
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666", marginTop: 2 }}>
                        {formatDateTime(a.createdAt)}
                      </div>
                      {a.content && <div style={{ fontSize: 14, marginTop: 8 }}>{a.content}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <ClubPill clubs={clubsQ.data ?? []} clubId={a.clubId} theme={theme}/>
                      {isPresidentHere && (
                        <>
                          <button
                            onClick={async () => {
                              const title = window.prompt("Yeni başlık:", a.title);
                              if (!title) return;
                              await updateAnnouncement(a.id, { title });
                              qc.invalidateQueries({ queryKey: annKey as any });
                              push({ message: "Duyuru güncellendi ✅" });
                            }}
                            style={btn(theme)}
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Bu duyuruyu silmek istiyor musun?")) return;
                              await deleteAnnouncement(a.id);
                              qc.invalidateQueries({ queryKey: annKey as any });
                              push({ message: "Duyuru silindi", type: "info" });
                            }}
                            style={{ ...btn(theme), color: "#b91c1c" }}
                          >
                            Sil
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

      {/* Bu Hafta */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>🗓 Bu Hafta</h3>
        {weeklyQ.isLoading ? (
          <div>Yükleniyor…</div>
        ) : weeklyGrouped.length === 0 ? (
          <Empty text="Önümüzdeki 7 gün içinde etkinlik yok." theme={theme}/>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {weeklyGrouped.map(([dateLabel, items]) => (
              <div key={dateLabel} style={{ border: theme === "dark" ? "1px solid #374151" : "1px solid #eee", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{dateLabel}</div>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>
                  {items.map((e) => (
                    <li key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#666" }}>
                          {formatTime(e.startAt)} – {formatTime(e.endAt)} {e.location ? `| ${e.location}` : ""}
                        </div>
                      </div>
                      <ClubPill clubs={clubsQ.data ?? []} clubId={e.clubId} theme={theme}/>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Kulüplerim */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>🏛 Kulüplerim</h3>
        {clubsQ.isLoading ? (
          <div>Yükleniyor…</div>
        ) : myClubs.length === 0 ? (
          <Empty text="Herhangi bir kulübe üye değilsin. Kulüpler sayfasından katılabilirsin." theme={theme}/>
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {myClubs.map((c) => (
              <li key={c.id} style={{ ...rowCard(theme), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: theme === "dark" ? "#9ca3af" : "#555" }}>{c.description || "—"}</div>
                </div>
                <Link to={`/clubs/${c.id}/events`} style={btn(theme)}>
                  Etkinlikler
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* === Yardımcı stiller === */
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

/* === Bileşenler === */

function EventRow({ e, clubs, userId }: { e: EventItem; clubs: Club[]; userId: string }) {
  const { push } = useToast();
  const [count, setCount] = useState(() => getAttendanceCount(e.id));
  const [attending, setAttending] = useState(() => isAttending(e.id, userId));
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    try {
      if (attending) {
        const c = await unattendEvent(e.id, userId);
        setCount(c);
        setAttending(false);
        push({ message: "Katılımınız kaldırıldı", type: "info" });
      } else {
        const c = await attendEvent(e.id, userId);
        setCount(c);
        setAttending(true);
        push({ message: "Etkinliğe katılıyorsunuz ✅" });
      }
    } catch {
      push({ message: "İşlem başarısız", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li style={rowCard()}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{e.title}</div>
          <div style={{ fontSize: 13, color: "#555" }}>
            {formatDateTime(e.startAt)} – {formatDateTime(e.endAt)} {e.location ? `| ${e.location}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{count} kişi katılıyor</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ClubPill clubs={clubs} clubId={e.clubId} />

          {/* Takvime Ekle (.ics) */}
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
            style={{ ...btn("light"), borderColor: "#ddd" }}
          >
            Takvime Ekle
          </button>

          {/* RSVP */}
          <button
            onClick={onToggle}
            disabled={busy}
            style={{
              ...btn("light"),
              background: attending ? "#e0f2fe" : "#fff",
              color: attending ? "#075985" : "inherit",
              minWidth: 110,
            }}
          >
            {busy ? "..." : attending ? "Vazgeç" : "Katılıyorum"}
          </button>
        </div>
      </div>
    </li>
  );
}

function StatCard({
  title, value, loading, hint, to, theme,
}: { title: string; value: number; loading?: boolean; hint?: string; to?: string; theme: "light" | "dark" | string }) {
  const body = (
    <div style={{
      border: theme === "dark" ? "1px solid #374151" : "1px solid #eee",
      borderRadius: 12,
      padding: 16,
      background: theme === "dark" ? "#1f2937" : "#fff",
      boxShadow: theme === "dark" ? "0 2px 6px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.05)",
    }}>
      <div style={{ fontSize: 13, color: theme === "dark" ? "#9ca3af" : "#666", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{loading ? "…" : value}</div>
      {hint && <div style={{ fontSize: 12, color: theme === "dark" ? "#9ca3af" : "#888", marginTop: 6 }}>{hint}</div>}
    </div>
  );
  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        {body}
      </Link>
    );
  }
  return body;
}

function Empty({ text, theme = "light" }: { text: string; theme?: "light" | "dark" | string }) {
  return (
    <div style={{
      border: theme === "dark" ? "1px dashed #374151" : "1px dashed #ddd",
      borderRadius: 12,
      padding: 16,
      color: theme === "dark" ? "#9ca3af" : "#666",
      fontSize: 14
    }}>
      {text}
    </div>
  );
}

function clubEmoji(name?: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("futbol")) return "⚽";
  if (n.includes("spor")) return "🎮";          // E-Spor
  if (n.includes("masa tenisi")) return "🏓";
  if (n.includes("zeka") || n.includes("ai")) return "🤖";
  if (n.includes("güvenlik")) return "🛡️";
  return "🏷️";
}

function ClubPill({ clubs, clubId, theme = "light" }: { clubs: Club[]; clubId: string; theme?: "light" | "dark" | string }) {
  const club = clubs.find((c) => c.id === clubId);
  const name = club?.name || "Kulüp";
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
        gap: 6
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
    boxShadow: theme === "dark" ? "0 2px 6px rgba(0,0,0,.25)" : "0 4px 16px rgba(0,0,0,.05)",
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
