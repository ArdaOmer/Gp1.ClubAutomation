export type Role = "Member" | "President"; 
export type Membership = {
  clubId: string;
  role: Role;
};

export type User = {
  id: string;
  name: string;
  email: string;
  memberships: Membership[]; // kullanıcı hangi kulüpte hangi role sahip
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
