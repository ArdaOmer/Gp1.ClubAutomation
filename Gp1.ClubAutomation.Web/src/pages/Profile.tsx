import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getMyMemberships, getClubs, updateMe } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import type { Membership } from "../types";

/*
=== NAME VERIFICATION ===
Turkish characters (A–Z + ÇĞİÖŞÜ çğıöşü), spaces, hyphens (-) and typographic apostrophes (’) are allowed.
2–50 characters. Numbers and other symbols are not allowed.
*/

const NAME_PATTERN = /^[A-Za-zÇĞİÖŞÜçğıöşü\s'-]{2,50}$/u;

function normalizeName(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, " ") // multiple spaces -> single space
    .replace(/\s*-\s*/g, "-") // - remove the spaces around it
    .replace(/\s*'\s*/g, "’"); // plain apostrophe -> typographic '
}

function isValidName(v: string) {
  return NAME_PATTERN.test(v);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  // We read from "any" so that we can keep these fields in the FE even if they don't exist in the user type.
  const u = user as any;

  const [name, setName] = useState(u?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const [department, setDepartment] = useState(u?.department ?? "");
  const [grade, setGrade] = useState<number | "">(typeof u?.grade === "number" ? u.grade : "");
  const [birthDate, setBirthDate] = useState(u?.birthDate ?? "");
  const [phone, setPhone] = useState(u?.phone ?? "");
  const [bio, setBio] = useState(u?.bio ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(u?.avatarDataUrl);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  // ✅ Asynchronously retrieve memberships (the old bug was causing this)
  const membershipsQ = useQuery({
    queryKey: ["memberships", user?.id],
    queryFn: () => getMyMemberships(user!.id),
    enabled: !!user,
  });

  const memberships: Membership[] = Array.isArray(membershipsQ.data) ? membershipsQ.data : [];

  useEffect(() => {
    if (!user) return;
    const uu = user as any;
    setName(uu.name ?? "");
    setDepartment(uu.department ?? "");
    setGrade(typeof uu.grade === "number" ? uu.grade : "");
    setBirthDate(uu.birthDate ?? "");
    setPhone(uu.phone ?? "");
    setBio(uu.bio ?? "");
    setAvatar(uu.avatarDataUrl);
  }, [user]);

  if (!user) return <div style={{ padding: 16 }}>Login required.</div>;

  const clubNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (clubsQ.data ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clubsQ.data]);

  // --- Simple verifications ---
  const nameValid = isValidName(normalizeName(name));
  const gradeValid = grade === "" || (typeof grade === "number" && grade >= 1 && grade <= 6);
  const birthValid = !birthDate || new Date(birthDate) <= new Date();
  const phoneValid = !phone || /^\+?90?5\d{9}$/.test(phone.replace(/\s+/g, ""));
  const formValid = nameValid && gradeValid && birthValid && phoneValid;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg(null);

    const n = normalizeName(name);
    setName(n);

    if (!isValidName(n)) {
      setNameError("Only letters, spaces, - and ’ are allowed (2–50 characters).");
      setErrMsg("Please check the form.");
      return;
    } else {
      setNameError(null);
    }

    if (!formValid) {
      setErrMsg("Please check the form.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        name: n,
        department: department?.trim() || undefined,
        grade: typeof grade === "number" ? grade : undefined,
        birthDate: birthDate || undefined,
        phone: phone?.trim() || undefined,
        bio: bio?.trim() || undefined,
        avatarDataUrl: avatar || undefined,
      };

      const updated = await updateMe(payload);

      // ✅ push user from backend to state + localStorage
      updateUser(updated);

      setMsg("Profile updated.");
    } catch {
      setErrMsg("Something went wrong while saving.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const initials = (u?.name || u?.email || "?").split(" ")[0].slice(0, 2).toUpperCase();

  async function onAvatarChange(f: File | undefined) {
    setAvatarErr(null);
    if (!f) return;

    const okTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!okTypes.includes(f.type)) {
      setAvatarErr("Please upload only PNG or JPG.");
      return;
    }
    if (f.size > 1.5 * 1024 * 1024) {
      setAvatarErr("File size must not exceed 1.5 MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(f);
      setAvatar(dataUrl);
    } catch {
      setAvatarErr("Image could not be read.");
    }
  }

  function clearAvatar() {
    setAvatar(undefined);
  }

  return (
    <div style={{ padding: 16, maxWidth: 880, margin: "0 auto" }}>
      {/* Header + avatar */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {avatar ? (
            <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>My Profile</h2>
          <div style={{ fontSize: 13, color: "#666" }}>{u?.email}</div>
        </div>
      </div>

      {/* Upload avatar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <label style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: "#fff" }}>
          Upload Photo
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={(e) => onAvatarChange(e.target.files?.[0])}
          />
        </label>

        {avatar && (
          <button onClick={clearAvatar} style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}>
            Remove
          </button>
        )}

        {avatarErr && <span style={{ color: "#b91c1c", fontSize: 12 }}>{avatarErr}</span>}
      </div>

      {/* Profile form */}
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginBottom: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Full Name</span>
          <input
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (v.length === 0) setNameError("Name is required.");
              else if (!isValidName(normalizeName(v)))
                setNameError("Only letters, spaces, - and ’ are allowed (2–50 characters).");
              else setNameError(null);
            }}
            onBlur={() => {
              const n = normalizeName(name);
              setName(n);
              if (!isValidName(n)) setNameError("Please enter a valid name (letters, spaces, - and ’ only).");
              else setNameError(null);
            }}
            style={{ padding: 10, border: `1px solid ${nameError ? "#ef4444" : "#ddd"}`, borderRadius: 8 }}
            placeholder="e.g., Omer"
            required
            inputMode="text"
            autoComplete="name"
          />
          {nameError && <span style={{ color: "#b91c1c", fontSize: 12 }}>{nameError}</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input value={u?.email} readOnly style={{ padding: 10, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Department</span>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="e.g., Computer Engineering"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Grade</span>
          <select
            value={grade === "" ? "" : String(grade)}
            onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : "")}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
            <option value="">Not selected</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
            <option value="6">6th Year</option>
            <option value="7">Preparatory</option>
            <option value="8">Master’s</option>
          </select>
          {!gradeValid && <span style={{ color: "#b91c1c", fontSize: 12 }}>Grade must be between 1–6.</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Date of Birth</span>
          <input
            type="date"
            value={birthDate || ""}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
          {!birthValid && <span style={{ color: "#b91c1c", fontSize: 12 }}>Date cannot be in the future.</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="+90 5__ ___ __ __"
          />
          {!phoneValid && (
            <span style={{ color: "#b91c1c", fontSize: 12 }}>
              Enter a valid mobile number (e.g., +905321234567 / 05321234567).
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
          <span>About Me</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, resize: "vertical" }}
            placeholder="You can briefly introduce yourself…"
          />
        </label>

        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            disabled={saving || !formValid}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: 8,
              background: formValid ? "#3b82f6" : "#94a3b8",
              color: "#fff",
              cursor: formValid ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {msg && <span style={{ fontSize: 13, color: "#10b981" }}>{msg}</span>}
          {errMsg && <span style={{ fontSize: 13, color: "#b91c1c" }}>{errMsg}</span>}
        </div>
      </form>

      {/* Memberships */}
      <section>
        <h3 style={{ marginTop: 0 }}>My Memberships</h3>

        {clubsQ.isLoading || membershipsQ.isLoading ? (
          <div style={{ color: "#666" }}>Loading…</div>
        ) : memberships.length === 0 ? (
          <div style={{ color: "#666" }}>You are not a member of any club.</div>
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {memberships.map((m) => {
              const clubName = clubNameMap.get(m.clubId) || `Club (${m.clubId})`;
              const isPresident = m.role === "President";

              return (
                <li
                  key={m.clubId}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{clubName}</div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      background: isPresident ? "#fee2e2" : "#e0f2fe",
                      color: isPresident ? "#b91c1c" : "#075985",
                      border: "1px solid #eee",
                    }}
                  >
                    {m.role}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
