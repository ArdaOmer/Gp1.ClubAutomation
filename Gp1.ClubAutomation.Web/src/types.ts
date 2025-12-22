export type Role = "Member" | "President";

export type Membership = {
  clubId: number;
  role: Role;
};

export type User = {
  id: number;
  email: string;
  name?: string;
  memberships?: Membership[];

  department?: string;
  grade?: number;
  birthDate?: string;
  phone?: string;
  bio?: string;
  avatarDataUrl?: string;
};

export type Club = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
};

export type EventItem = {
  id: number;
  clubId: number;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isPublished: boolean;
};

export type Announcement = {
  id: number;
  clubId: number;
  title: string;
  content?: string;
  createdAt: string;
  pinned?: boolean;
};
