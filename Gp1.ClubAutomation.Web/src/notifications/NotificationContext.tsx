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

type AnnLite = {
  id: string;
  clubId: string;
  title: string;
  createdAt: string;
  pinned?: boolean;
  content?: string;
};

type NotifCtx = {
  unread: boolean;
  markAllRead: () => void;
  announcements: AnnLite[];
  loading: boolean;
  refresh: () => void; // YENİ: dışarıdan "duyuruları tekrar yükle" çağırmak için
};

const Ctx = createContext<NotifCtx | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // Kullanıcının üye olduğu kulüpler
  const [clubIds, setClubIds] = useState<string[]>([]);

  // Duyurular
  const [announcements, setAnnouncements] = useState<AnnLite[]>([]);
  const [loading, setLoading] = useState(false);

  // User'a bağlı localStorage anahtarı
  const LS_KEY = user ? `read_ann_${user.id}` : "";

  // Okunmuş duyuru ID'lerini state olarak tutuyoruz
  const [readIdsState, setReadIdsState] = useState<string[]>([]);

  // Bu state'i sadece tetikleyici olarak kullanacağız
  const [reloadKey, setReloadKey] = useState(0);

  // ============== YARDIMCI FONKSİYONLAR ==============

  // refresh(): dışarıdan çağrıldığında reloadKey++ yapıyoruz
  // bu da aşağıdaki useEffect'i tekrar çalıştırıyor (= duyuruları yeniden çekiyor)
  const refresh = useCallback(() => {
    setReloadKey((x) => x + 1);
  }, []);

  // markAllRead(): tüm mevcut duyuruları okundu say
  const markAllRead = useCallback(() => {
    if (!user) return;
    const allIds = announcements.map((a) => a.id);
    setReadIdsState(allIds);
    localStorage.setItem(LS_KEY, JSON.stringify(allIds));
  }, [user, announcements, LS_KEY]);

  // ============== EFFECTLER ==============

  // Kullanıcı değişince, o kullanıcının okunmuş listesine bak
  useEffect(() => {
    if (!user) {
      setReadIdsState([]);
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_KEY) || "") as string[];
      setReadIdsState(Array.isArray(parsed) ? parsed : []);
    } catch {
      setReadIdsState([]);
    }
  }, [user, LS_KEY]);

  // Kullanıcının kulüp üyeliklerini yükle
  useEffect(() => {
    if (!user) {
      setClubIds([]);
      return;
    }
    const ms = getMyMemberships(user.id); // lokal memberships mock
    setClubIds(ms.map((m) => m.clubId));
  }, [user]);

  // Duyuruları yükle (ilk açılışta + her refresh() çağrısında)
  useEffect(() => {
    if (!user || clubIds.length === 0) {
      setAnnouncements([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // kulüplerimden gelen duyurular
        const anns = await getAnnouncementsForClubs(clubIds);

        if (!cancelled) {
          // buradaki sırayı burada çok önemsemiyoruz,
          // sort işini gösterdiğimiz yerde de yapabiliyoruz (Home, AnnouncementsPage vs)
          setAnnouncements(anns);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, clubIds, reloadKey]); // <-- reloadKey burada önemli!

  // okunmamış var mı?
  const unread = useMemo(() => {
    if (!announcements.length) return false;
    // eğer announcement.id readIdsState içinde yoksa unread kabul ediyoruz
    return announcements.some((a) => !readIdsState.includes(a.id));
  }, [announcements, readIdsState]);

  // Provider value
  return (
    <Ctx.Provider
      value={{
        unread,
        markAllRead,
        announcements,
        loading,
        refresh, // dışarıya açtık
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export function useNotifications() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      "useNotifications NotificationProvider içinde kullanılmalı."
    );
  }
  return v;
}
