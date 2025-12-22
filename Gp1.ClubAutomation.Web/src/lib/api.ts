// src/lib/api.ts
import axios from "axios";
import type { Club, EventItem, Membership, User, Announcement } from "../types";

/* =========================================================
   GENERAL SETTINGS
   ========================================================= */
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

/* =========================================================
   NORMALIZE HELPERS
   ========================================================= */
function pick<T = any>(obj: any, camel: string, pascal?: string): T {
  if (!obj) return undefined as any;
  const p = pascal ?? camel.charAt(0).toUpperCase() + camel.slice(1);
  return (obj[camel] ?? obj[p]) as T;
}

function normalizeClub(x: any): Club {
  return {
    id: Number(pick(x, "id", "Id")),
    name: String(pick(x, "name", "Name") ?? ""),
    description: pick(x, "description", "Description") ?? undefined,
    isActive: Boolean(pick(x, "isActive", "IsActive") ?? true),
  };
}

function normalizeEvent(x: any): EventItem {
  return {
    id: Number(pick(x, "id", "Id")),
    clubId: Number(pick(x, "clubId", "ClubId")),
    title: String(pick(x, "title", "Title") ?? ""),
    description: pick(x, "description", "Description") ?? undefined,
    location: pick(x, "location", "Location") ?? undefined,
    startAt: String(pick(x, "startAt", "StartAt")),
    endAt: String(pick(x, "endAt", "EndAt")),
    isPublished: Boolean(pick(x, "isPublished", "IsPublished") ?? true),
  };
}

function normalizeAnnouncement(x: any): Announcement {
  return {
    id: Number(pick(x, "id", "Id")),
    clubId: Number(pick(x, "clubId", "ClubId")),
    title: String(pick(x, "title", "Title") ?? ""),
    content: pick(x, "content", "Content") ?? undefined,
    createdAt: String(pick(x, "createdAt", "CreatedAt")),
    pinned: Boolean(pick(x, "pinned", "Pinned") ?? false),
  };
}

function normalizeMembership(x: any): Membership {
  return {
    clubId: Number(pick(x, "clubId", "ClubId")),
    role: (pick(x, "role", "Role") ?? "Member") as Membership["role"],
  };
}

/* =========================================================
   AUTH / LOGIN
   ========================================================= */
export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string; user: User };

export async function loginApi(body: LoginReq): Promise<LoginRes> {
  // Backend response: { token, user: { id, username, email, fullName, isAdmin, ... } }
  const { data } = await api.post<any>("/auth/login", body);

  const token = String(data?.token ?? "");
  const rawUser = data?.user ?? {};

  // User shape that FE was waiting for
  const user: User = {
    id: Number(pick(rawUser, "id", "Id")),
    // Backend might be returning username/fullName -> we map to name
    name: String(
      pick(rawUser, "name", "Name") ??
      pick(rawUser, "fullName", "FullName") ??
      pick(rawUser, "username", "Username") ??
      ""
    ),
    email: String(pick(rawUser, "email", "Email") ?? ""),
    memberships: Array.isArray(rawUser?.memberships)
      ? rawUser.memberships.map(normalizeMembership)
      : [],
    // optional profile fields (remains empty if there is no backend)
    //department: pick(rawUser, "department", "Department") ?? undefined,
    //grade: pick(rawUser, "grade", "Grade") ?? undefined,
    //birthDate: pick(rawUser, "birthDate", "BirthDate") ?? undefined,
    //phone: pick(rawUser, "phone", "Phone") ?? undefined,
    //bio: pick(rawUser, "bio", "Bio") ?? undefined,
    //avatarDataUrl: pick(rawUser, "avatarDataUrl", "AvatarDataUrl") ?? undefined,
  };

  return { token, user };
}

// ✅ Profile update (me)
export async function updateMe(payload: {
  name?: string;
  department?: string;
  grade?: number;
  birthDate?: string;       // "YYYY-MM-DD"
  phone?: string;
  bio?: string;
  avatarDataUrl?: string;
}) {
  const { data } = await api.put("/users/me", payload);
  return data;
}

// GET /api/users/me  -> UserDto
export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}

/* =========================================================
   MEMBERSHIPS
   ========================================================= */

/**
 * GET /api/memberships?userId=1
 * return [{ clubId: 2, role: "Member" }, ...]
 */
export async function getMyMemberships(userId: number): Promise<Membership[]> {
  const { data } = await api.get<any[]>("/memberships", { params: { userId } });
  return (data ?? []).map(normalizeMembership);
}

/* =========================================================
   CLUBS
   ========================================================= */
export async function getClubs(): Promise<Club[]> {
  const { data } = await api.get<any[]>("/clubs");
  return (data ?? []).map(normalizeClub);
}

export async function createClub(input: Pick<Club, "name" | "description">): Promise<Club> {
  const { data } = await api.post<any>("/clubs", input);
  return normalizeClub(data);
}

export async function getClub(id: number): Promise<Club | null> {
  const { data } = await api.get<any>(`/clubs/${id}`);
  return data ? normalizeClub(data) : null;
}


// userId ve clubId: number
export async function joinClub(userId: number, clubId: number): Promise<void> {
  await api.post("/memberships/join", { userId, clubId });
}

export async function leaveClub(userId: number, clubId: number): Promise<void> {
  await api.post("/memberships/leave", { userId, clubId });
}


/* =========================================================
   EVENTS
   ========================================================= */
export async function getEventsByClub(clubId: number): Promise<EventItem[]> {
  const { data } = await api.get<any[]>(`/clubs/${clubId}/events`);
  return (data ?? []).map(normalizeEvent);
}

export async function createEvent(
  clubId: number,
  input: Pick<EventItem, "title" | "description" | "location" | "startAt" | "endAt">
): Promise<EventItem> {
  const { data } = await api.post<any>(`/clubs/${clubId}/events`, input);
  return normalizeEvent(data);
}

export async function updateEvent(
  clubId: number,
  eventId: number,
  patch: Partial<Pick<EventItem, "title" | "description" | "location" | "startAt" | "endAt">>
): Promise<EventItem> {
  const { data } = await api.patch<any>(`/clubs/${clubId}/events/${eventId}`, patch);
  return normalizeEvent(data);
}

export async function deleteEvent(clubId: number, eventId: number): Promise<void> {
  await api.delete(`/clubs/${clubId}/events/${eventId}`);
}

// Dashboard helpers
export async function getAllEvents(): Promise<EventItem[]> {
  const { data } = await api.get<any[]>("/events");
  return (data ?? []).map(normalizeEvent);
}

export async function getUpcomingEventsForUser(userId: number, daysAhead = 14): Promise<EventItem[]> {
  const { data } = await api.get<any[]>("/events/upcoming", {
    params: { days: daysAhead, userId },
  });
  return (data ?? []).map(normalizeEvent);
}

/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */
export async function getAnnouncementsForClubs(clubIds: number[]): Promise<Announcement[]> {
  // Backend’s clubIds format: "1,2,3"
  const { data } = await api.get<any[]>("/announcements", {
    params: { clubIds: clubIds.join(",") },
  });
  return (data ?? []).map(normalizeAnnouncement);
}

export async function createAnnouncement(
  clubId: number,
  input: Pick<Announcement, "title" | "content" | "pinned">
): Promise<Announcement> {
  const { data } = await api.post<any>(`/clubs/${clubId}/announcements`, input);
  return normalizeAnnouncement(data);
}

export async function updateAnnouncement(
  id: number,
  patch: Partial<Announcement>
): Promise<Announcement> {
  const { data } = await api.patch<any>(`/announcements/${id}`, patch);
  return normalizeAnnouncement(data);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/announcements/${id}`);
}

/* =========================================================
   RSVP (PARTICIPATION) - BACKEND
   ========================================================= */

// GET /api/events/{eventId}/attendance/count  -> number
export async function getAttendanceCount(eventId: number): Promise<number> {
  const { data } = await api.get<number>(`/events/${eventId}/attendance/count`);
  return data;
}

// GET /api/events/{eventId}/attendance/is-attending?userId=1 -> boolean
export async function isAttending(eventId: number, userId: number): Promise<boolean> {
  const { data } = await api.get<boolean>(
    `/events/${eventId}/attendance/is-attending`,
    { params: { userId } }
  );
  return data;
}

// POST /api/events/{eventId}/attendance/attend?userId=1 -> number (new count)
export async function attendEvent(eventId: number, userId: number): Promise<number> {
  const { data } = await api.post<number>(
    `/events/${eventId}/attendance/attend`,
    null,
    { params: { userId } }
  );
  return data;
}

// POST /api/events/{eventId}/attendance/unattend?userId=1 -> number (new count)
export async function unattendEvent(eventId: number, userId: number): Promise<number> {
  const { data } = await api.post<number>(
    `/events/${eventId}/attendance/unattend`,
    null,
    { params: { userId } }
  );
  return data;
}

// GET /api/users/{userId}/attendances
export async function getEventsIAttend(userId: number) {
  const { data } = await api.get(`/users/${userId}/attendances`);
  return data as EventItem[];
}