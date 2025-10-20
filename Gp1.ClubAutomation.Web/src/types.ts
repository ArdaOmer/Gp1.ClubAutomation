export type Role = "Member" | "President";

export type Membership = {
  clubId: string;
  role: Role;
};

export type User = {
  id: string;
  name: string;
  email: string;
  memberships: Membership[];

  // ⬇️ yeni profil alanları (opsiyonel)
  department?: string;   // Bölüm
  grade?: number;        // Sınıf (1-6 arası ör.)
  birthDate?: string;    // ISO (YYYY-MM-DD)
  phone?: string;        // Telefon
  bio?: string;          // Hakkımda
  avatarDataUrl?: string;
};

export type Club = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export type EventItem = {
  id: string;
  clubId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isPublished: boolean;
};
export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  content?: string;
  createdAt: string;  // ISO
  pinned?: boolean;
};

