import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { useAuth } from "../auth/AuthContext";
import { getAnnouncementsForClubs, getMyMemberships } from "../lib/api";
import type { Announcement } from "../types";

type AnnLite = Pick<
  Announcement,
  "id" | "clubId" | "title" | "createdAt" | "pinned" | "content"
>;

type NotifCtx = {
  unread: boolean;
  markAllRead: () => void;
  announcements: AnnLite[];
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<NotifCtx | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // Clubs the user is a member of
  const [clubIds, setClubIds] = useState<number[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<AnnLite[]>([]);
  const [loading, setLoading] = useState(false);

  // LocalStorage key associated with the user
  const LS_KEY = user ? `read_ann_${user.id}` : "";

  // Read announcement IDs
  const [readIdsState, setReadIdsState] = useState<number[]>([]);

  // refresh trigger
  const [reloadKey, setReloadKey] = useState(0);

  // refresh(): Reload the announcements
  const refresh = useCallback(() => {
    setReloadKey((x) => x + 1);
  }, []);

  // markAllRead(): Mark all available announcements as read.
  const markAllRead = useCallback(() => {
    if (!user) return;
    const allIds = announcements.map((a) => a.id);
    setReadIdsState(allIds);
    localStorage.setItem(LS_KEY, JSON.stringify(allIds));
  }, [user, announcements, LS_KEY]);

  // Read list when user changes
  useEffect(() => {
    if (!user) {
      setReadIdsState([]);
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_KEY) || "");
      const ids = Array.isArray(parsed)
        ? parsed
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n))
        : [];
      setReadIdsState(ids);
    } catch {
      setReadIdsState([]);
    }
  }, [user, LS_KEY]);

  // ✅ Load user's club memberships (ASYNC + SAFE)
  useEffect(() => {
    if (!user) {
      setClubIds([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const memberships = await getMyMemberships(user.id); // Promise<Membership[]>
        const ids = (Array.isArray(memberships) ? memberships : [])
          .map((m) => Number(m.clubId))
          .filter((n) => Number.isFinite(n));

        if (!cancelled) setClubIds(ids);
      } catch (err) {
        // Prevent the app from crashing if there is no endpoint or if there is an error.
        console.warn("getMyMemberships failed, fallback to []", err);
        if (!cancelled) setClubIds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ✅ Load announcements
  useEffect(() => {
    if (!user || clubIds.length === 0) {
      setAnnouncements([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const anns = await getAnnouncementsForClubs(clubIds);
        if (!cancelled) setAnnouncements(Array.isArray(anns) ? anns : []);
      } catch (err) {
        console.warn("getAnnouncementsForClubs failed, fallback to []", err);
        if (!cancelled) setAnnouncements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, clubIds, reloadKey]);

  // Are there any unread ones?
  const unread = useMemo(() => {
    if (!announcements.length) return false;
    return announcements.some((a) => !readIdsState.includes(a.id));
  }, [announcements, readIdsState]);

  return (
    <Ctx.Provider
      value={{
        unread,
        markAllRead,
        announcements,
        loading,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export function useNotifications() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotifications must be used within NotificationProvider.");
  return v;
}
