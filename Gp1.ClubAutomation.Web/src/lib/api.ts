// src/lib/api.ts
import axios from "axios";
import type { Club, EventItem, Membership, User, Announcement } from "../types";

/** ====== Genel ayarlar ====== */
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const useMock = String(import.meta.env.VITE_USE_MOCK) === "1";
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

/** ====== Küçük yardımcılar (mock storage) ====== */
const LS_CLUBS = "mock_clubs";
const LS_EVENTS = "mock_events";
const LS_ANN   = "mock_announcements";
const LS_MEMBERS_PREFIX = "mock_members_"; // kullanıcıya özel üyelikler
const LS_ATTEN_PREFIX   = "mock_attend_";  // etkinlik katılımcıları

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return crypto.randomUUID?.() || Math.random().toString(36).slice(2); }
function delay(ms=300) { return new Promise(r => setTimeout(r, ms)); }

/** ===================== AUTH ===================== */
export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string; user: { id: string; name: string; email: string } };

// İki örnek kullanıcı: test@uni.edu (başkan), test1@uni.edu (öğrenci)
export async function loginApi(body: LoginReq): Promise<LoginRes> {
  if (useMock) {
    await delay(500);
    const ok =
      (body.email === "test@uni.edu"  && body.password === "123456") ||
      (body.email === "test1@uni.edu" && body.password === "123456");
    if (!ok) throw new Error("E-posta veya şifre hatalı.");

    const nameFromEmail = body.email
      .split("@")[0]
      .split(/[._-]/g)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

    return {
      token: "mock-token-" + uid(),
      user: { id: body.email === "test@uni.edu" ? "u1" : "u2", name: nameFromEmail, email: body.email }
    };
  }
  const { data } = await api.post<LoginRes>("/auth/login", body);
  return data;
}

/** ===================== SEED ===================== */
// İlk kez açıldığında örnek kulüp/etkinlik/duyuru yükle
(function seed() {
  // Kulüpler + Etkinlikler
  const clubs = read<Club[]>(LS_CLUBS, []);
  if (clubs.length === 0) {
    const c1: Club = { id: uid(), name: "Yapay Zeka Kulübü",   description: "ML/AI etkinlikleri",            isActive: true };
    const c2: Club = { id: uid(), name: "Siber Güvenlik Kulübü",description: "CTF & atölyeler",              isActive: true };
    const c3: Club = { id: uid(), name: "Futbol Kulübü",        description: "Antrenmanlar ve turnuvalar",   isActive: true };
    const c4: Club = { id: uid(), name: "E-Spor Kulübü",        description: "LOL, Valorant, CS2 turnuvaları",isActive: true };
    const c5: Club = { id: uid(), name: "Masa Tenisi Kulübü",   description: "Kampüs içi mini turnuvalar",    isActive: true };
    write(LS_CLUBS, [c1, c2, c3, c4, c5]);

    const now = Date.now();
    const e1: EventItem = {
      id: uid(), clubId: c1.id, title: "AI 101",
      description: "Tanışma ve roadmap", location: "A-201",
      startAt: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endAt:   new Date(now + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      isPublished: true
    };
    const e2: EventItem = {
      id: uid(), clubId: c3.id, title: "Kampüs Turnuvası",
      description: "Futbol açılış maçı", location: "Stadyum",
      startAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endAt:   new Date(now + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      isPublished: true
    };
    const e3: EventItem = {
      id: uid(), clubId: c4.id, title: "Valorant Scrim Gecesi",
      description: "Takımlar arası antrenman", location: "Lab-B",
      startAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endAt:   new Date(now + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      isPublished: true
    };
    write(LS_EVENTS, [e1, e2, e3]);
  }

  // Duyurular
  const anns = read<Announcement[]>(LS_ANN, []);
  if (anns.length === 0) {
    const currentClubs = read<Club[]>(LS_CLUBS, []);
    if (currentClubs.length > 0) {
      const now = Date.now();
      const demo: Announcement[] = [
        { id: uid(), clubId: currentClubs[0].id, title: "Hoş geldiniz! 🎉", content: "Yeni dönem etkinlik takvimimiz yakında.",
          createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), pinned: true },
        { id: uid(), clubId: currentClubs[0].id, title: "Mentorluk başvuruları", content: "AI 101 sonrası formu doldurun.",
          createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(), pinned: false },
      ];
      write(LS_ANN, demo);
    }
  }
})();

/** ===================== Clubs ===================== */
export async function getClubs(): Promise<Club[]> {
  if (useMock) { await delay(); return read<Club[]>(LS_CLUBS, []); }
  const { data } = await api.get<Club[]>("/clubs");
  return data;
}

export async function createClub(input: Pick<Club,"name"|"description">): Promise<Club> {
  if (useMock) {
    await delay();
    const list = read<Club[]>(LS_CLUBS, []);
    const club: Club = { id: uid(), name: input.name, description: input.description, isActive: true };
    list.push(club); write(LS_CLUBS, list);
    return club;
  }
  const { data } = await api.post<Club>("/clubs", input);
  return data;
}

export async function getClub(id: string): Promise<Club | null> {
  if (useMock) { await delay(); return read<Club[]>(LS_CLUBS, []).find(c=>c.id===id) || null; }
  const { data } = await api.get<Club>(`/clubs/${id}`);
  return data;
}

/** ===================== Events ===================== */
export async function getEventsByClub(clubId: string): Promise<EventItem[]> {
  if (useMock) { await delay(); return read<EventItem[]>(LS_EVENTS, []).filter(e=>e.clubId===clubId); }
  const { data } = await api.get<EventItem[]>(`/clubs/${clubId}/events`);
  return data;
}

export async function createEvent(
  clubId: string,
  input: Pick<EventItem,"title"|"description"|"location"|"startAt"|"endAt">
): Promise<EventItem> {
  if (useMock) {
    await delay();
    const list = read<EventItem[]>(LS_EVENTS, []);
    const ev: EventItem = { id: uid(), clubId, isPublished: false, ...input };
    list.push(ev); write(LS_EVENTS, list);
    return ev;
  }
  const { data } = await api.post<EventItem>(`/clubs/${clubId}/events`, input);
  return data;
}
// Etkinlik sil
export async function deleteEvent(clubId: string, eventId: string): Promise<void> {
  if (useMock) {
    await delay(120);
    const all = read<EventItem[]>(LS_EVENTS, []);
    const next = all.filter(e => !(e.id === eventId && e.clubId === clubId));
    write(LS_EVENTS, next);
    return;
  }
  await api.delete(`/clubs/${clubId}/events/${eventId}`);
}


// Dashboard helpers
export async function getAllEvents(): Promise<EventItem[]> {
  if (useMock) { await delay(); return read<EventItem[]>(LS_EVENTS, []); }
  const { data } = await api.get<EventItem[]>("/events");
  return data;
}

export async function getUpcomingEventsForUser(userId: string, daysAhead = 14): Promise<EventItem[]> {
  if (useMock) {
    await delay(150);
    const all = read<EventItem[]>(LS_EVENTS, []);
    const memberships = getMyMemberships(userId);
    const clubIds = new Set(memberships.map(m => m.clubId));
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return all
      .filter(e => clubIds.has(e.clubId))
      .filter(e => {
        const start = new Date(e.startAt);
        return start >= now && start <= until;
      })
      .sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
  const { data } = await api.get<EventItem[]>(`/events/upcoming`, { params: { days: daysAhead, userId } });
  return data;
}

/** ===================== Memberships (mock) ===================== */
function readUserMemberships(userId: string): Membership[] {
  try { return JSON.parse(localStorage.getItem(LS_MEMBERS_PREFIX + userId) || "") as Membership[]; } catch { return []; }
}
function writeUserMemberships(userId: string, ms: Membership[]) {
  localStorage.setItem(LS_MEMBERS_PREFIX + userId, JSON.stringify(ms));
}

export function persistMembershipsFromUser(user: User) {
  writeUserMemberships(user.id, user.memberships || []);
}

export function getMyMemberships(userId: string): Membership[] {
  return readUserMemberships(userId);
}

export function joinClub(userId: string, clubId: string) {
  const ms = readUserMemberships(userId);
  if (!ms.find(m => m.clubId === clubId)) {
    ms.push({ clubId, role: "Member" });
    writeUserMemberships(userId, ms);
  }
  return ms;
}

export function leaveClub(userId: string, clubId: string) {
  const ms = readUserMemberships(userId).filter(m => m.clubId !== clubId);
  writeUserMemberships(userId, ms);
  return ms;
}

export function hasRole(user: User | null, clubId: string, role: "President" | "Member") {
  if (!user) return false;
  const local = readUserMemberships(user.id);
  const source = local.length ? local : (user.memberships || []);
  const m = source.find(x => x.clubId === clubId);
  if (!m) return false;
  if (role === "Member") return true;
  return m.role === "President";
}

/** ===================== Profile (mock) ===================== */
// Not: Kalıcı profil backend gelince yapılacak. Şimdilik sadece oturumdaki user'ı güncelliyoruz.
export async function updateMe(input: Partial<User>): Promise<User> {
  await delay(300);
  const curr = JSON.parse(localStorage.getItem("user") || "{}");
  const next = { ...curr, ...input };
  localStorage.setItem("user", JSON.stringify(next));
  return next as User;
}

/** ===================== Announcements (mock) ===================== */
function readAnns(): Announcement[] {
  try { return JSON.parse(localStorage.getItem(LS_ANN) || "") as Announcement[]; } catch { return []; }
}
function writeAnns(list: Announcement[]) { localStorage.setItem(LS_ANN, JSON.stringify(list)); }

export async function getAnnouncementsForClubs(clubIds: string[]): Promise<Announcement[]> {
  if (useMock) {
    await delay(150);
    const ids = new Set(clubIds);
    return readAnns()
      .filter(a => ids.has(a.clubId))
      .sort((a, b) => {
        if (!!b.pinned - +!!a.pinned !== 0) return (!!b.pinned ? 1 : 0) - (!!a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  const { data } = await api.get<Announcement[]>("/announcements", { params: { clubIds: clubIds.join(",") } });
  return data;
}

export async function createAnnouncement(
  clubId: string,
  input: Pick<Announcement, "title" | "content" | "pinned">
): Promise<Announcement> {
  if (useMock) {
    await delay(200);
    const list = readAnns();
    const a: Announcement = {
      id: uid(),
      clubId,
      title: input.title,
      content: input.content,
      pinned: !!input.pinned,
      createdAt: new Date().toISOString(),
    };
    list.unshift(a);
    writeAnns(list);
    return a;
  }
  const { data } = await api.post<Announcement>(`/clubs/${clubId}/announcements`, input);
  return data;
}

export async function updateAnnouncement(id: string, patch: Partial<Announcement>): Promise<Announcement> {
  if (useMock) {
    await delay(150);
    const list = readAnns();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Duyuru bulunamadı");
    const next = { ...list[idx], ...patch };
    list[idx] = next;
    writeAnns(list);
    return next;
  }
  const { data } = await api.patch<Announcement>(`/announcements/${id}`, patch);
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (useMock) {
    await delay(150);
    const list = readAnns().filter(a => a.id !== id);
    writeAnns(list);
    return;
  }
  await api.delete(`/announcements/${id}`);
}

/** ===================== Event RSVP (mock) ===================== */
function readAttendees(eventId: string): string[] {
  try { return JSON.parse(localStorage.getItem(LS_ATTEN_PREFIX + eventId) || "") as string[]; } catch { return []; }
}
function writeAttendees(eventId: string, ids: string[]) {
  localStorage.setItem(LS_ATTEN_PREFIX + eventId, JSON.stringify(ids));
}

export function getAttendanceCount(eventId: string): number {
  return readAttendees(eventId).length;
}
export function isAttending(eventId: string, userId: string): boolean {
  return readAttendees(eventId).includes(userId);
}
export async function attendEvent(eventId: string, userId: string): Promise<number> {
  await delay(120);
  const ids = new Set(readAttendees(eventId));
  ids.add(userId);
  writeAttendees(eventId, Array.from(ids));
  return ids.size;
}
export async function unattendEvent(eventId: string, userId: string): Promise<number> {
  await delay(120);
  const next = readAttendees(eventId).filter(id => id !== userId);
  writeAttendees(eventId, next);
  return next.length;
}
// Katıldığım tüm etkinlikleri getir
export function getEventsIAttend(userId: string): EventItem[] {
  const events = read<EventItem[]>(LS_EVENTS, []);
  return events.filter(e => readAttendees(e.id).includes(userId));
}
export async function updateEvent(
  clubId: string,
  eventId: string,
  patch: Partial<Pick<EventItem,"title"|"description"|"location"|"startAt"|"endAt">>
): Promise<EventItem> {
  if (useMock) {
    await delay(120);
    const list = read<EventItem[]>(LS_EVENTS, []);
    const idx = list.findIndex(e => e.id === eventId && e.clubId === clubId);
    if (idx === -1) throw new Error("Etkinlik bulunamadı");
    const next = { ...list[idx], ...patch };
    list[idx] = next;
    write(LS_EVENTS, list);
    return next;
  }
  const { data } = await api.patch<EventItem>(`/clubs/${clubId}/events/${eventId}`, patch);
  return data;
}


