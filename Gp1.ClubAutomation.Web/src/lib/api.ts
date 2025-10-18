import axios from "axios";
import type { Club, EventItem } from "../types";
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

export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string; user: { id: string; name: string; email: string } };

export async function loginApi(body: LoginReq): Promise<LoginRes> {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 700));

    
    const allowed = [
      { email: "test@uni.edu", id: "u1", name: "Test User" },   // Kulüp başkanı
      { email: "test1@uni.edu", id: "u2", name: "Test1 User" }  // Normal öğrenci
    ];

    const found = allowed.find(u => u.email.toLowerCase() === body.email.toLowerCase());

    if (found && body.password === "123456") {
      return {
        token: "mock-token-" + found.id,
        user: { id: found.id, name: found.name, email: found.email }
      };
    }

    throw new Error("E-posta veya şifre hatalı.");
  }

  // Gerçek backend bağlandığında burası çalışacak
  const { data } = await api.post<LoginRes>("/auth/login", body);
  return data;
}

// --- ek: yardımcılar ---


const LS_CLUBS = "mock_clubs";
const LS_EVENTS = "mock_events";

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return crypto.randomUUID?.() || Math.random().toString(36).slice(2); }
function delay(ms=400) { return new Promise(r => setTimeout(r, ms)); }

// --- ek: seed (ilk çalıştırmada örnek veriler) ---
(function seed(){
  const clubs = read<Club[]>(LS_CLUBS, []);
  if (clubs.length === 0) {
    const c1 = { id: uid(), name: "Yapay Zeka Kulübü", description: "ML/AI etkinlikleri", isActive: true };
    const c2 = { id: uid(), name: "Siber Güvenlik Kulübü", description: "CTF & atölyeler", isActive: true };
    write(LS_CLUBS, [c1, c2]);
    const now = new Date();
    const e1: EventItem = {
      id: uid(), clubId: c1.id, title: "AI 101",
      description: "Tanışma ve roadmap", location: "A-201",
      startAt: new Date(now.getTime()+86400000).toISOString(),
      endAt: new Date(now.getTime()+90000000).toISOString(),
      isPublished: true
    };
    write(LS_EVENTS, [e1]);
  }
})();

// --- ek: Clubs API (mock) ---
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

// --- ek: Events API (mock) ---
export async function getEventsByClub(clubId: string): Promise<EventItem[]> {
  if (useMock) { await delay(); return read<EventItem[]>(LS_EVENTS, []).filter(e=>e.clubId===clubId); }
  const { data } = await api.get<EventItem[]>(`/clubs/${clubId}/events`);
  return data;
}

export async function createEvent(clubId: string, input: Pick<EventItem,"title"|"description"|"location"|"startAt"|"endAt">): Promise<EventItem> {
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
import type { Membership, User } from "../types";

const LS_MEMBERS_PREFIX = "mock_members_"; // kullanıcıya özel üyelikler

function readUserMemberships(userId: string): Membership[] {
  try { return JSON.parse(localStorage.getItem(LS_MEMBERS_PREFIX + userId) || "") as Membership[]; } catch { return []; }
}
function writeUserMemberships(userId: string, ms: Membership[]) {
  localStorage.setItem(LS_MEMBERS_PREFIX + userId, JSON.stringify(ms));
}

// Girişte LocalStorage'a da yansıtmak istersen (opsiyonel)
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
  let ms = readUserMemberships(userId).filter(m => m.clubId !== clubId);
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
// ---- Profile (mock) ----
import type { User } from "../types";

export async function getMe(): Promise<User | null> {
  await delay(200);
  try { return JSON.parse(localStorage.getItem("user") || "null") as User | null; }
  catch { return null; }
}

export async function updateMe(input: Partial<User>): Promise<User> {
  await delay(300);
  const curr = JSON.parse(localStorage.getItem("user") || "{}");
  const next = { ...curr, ...input };
  localStorage.setItem("user", JSON.stringify(next));
  return next as User;
}



