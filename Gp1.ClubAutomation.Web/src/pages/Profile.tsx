import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getMyMemberships, updateMe, getClubs } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

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
  const [name, setName] = useState(user?.name ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [grade, setGrade] = useState<number | "">((user?.grade as number) ?? "");
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatarDataUrl);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setDepartment(user.department ?? "");
    setGrade((user.grade as number) ?? "");
    setBirthDate(user.birthDate ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setAvatar(user.avatarDataUrl);
  }, [user]);

  if (!user) return <div style={{ padding: 16 }}>Giriş gerekli.</div>;

  const memberships = getMyMemberships(user.id);

  const clubNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (clubsQ.data ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clubsQ.data]);

  // --- Basit doğrulamalar ---
  const nameValid = name.trim().length >= 3;
  const gradeValid = grade === "" || (typeof grade === "number" && grade >= 1 && grade <= 6);
  const birthValid = !birthDate || new Date(birthDate) <= new Date();
  const phoneValid = !phone || /^\+?90?5\d{9}$/.test(phone.replace(/\s+/g, ""));
  const formValid = nameValid && gradeValid && birthValid && phoneValid;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    if (!formValid) {
      setErrMsg("Lütfen formu kontrol edin.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        name: name.trim(),
        department: department?.trim() || undefined,
        grade: typeof grade === "number" ? grade : undefined,
        birthDate: birthDate || undefined,
        phone: phone?.trim() || undefined,
        bio: bio?.trim() || undefined,
        avatarDataUrl: avatar || undefined,
      };
      const updated = await updateMe(payload);
      updateUser(updated); // state + localStorage senkron
      setMsg("Profil güncellendi.");
    } catch {
      setErrMsg("Kaydetme sırasında bir sorun oluştu.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const initials = (user.name || user.email || "?").split(" ")[0].slice(0, 2).toUpperCase();

  async function onAvatarChange(f: File | undefined) {
    setAvatarErr(null);
    if (!f) return;
    const okTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!okTypes.includes(f.type)) {
      setAvatarErr("Sadece PNG veya JPG yükleyin.");
      return;
    }
    if (f.size > 1.5 * 1024 * 1024) {
      setAvatarErr("Dosya boyutu 1.5 MB'ı geçmemeli.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(f);
      setAvatar(dataUrl);
    } catch {
      setAvatarErr("Görsel okunamadı.");
    }
  }

  function clearAvatar() {
    setAvatar(undefined);
  }

  return (
    <div style={{ padding: 16, maxWidth: 880, margin: "0 auto" }}>
      {/* Üst başlık + avatar */}
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
          <h2 style={{ margin: 0 }}>Profilim</h2>
          <div style={{ fontSize: 13, color: "#666" }}>{user.email}</div>
        </div>
      </div>

      {/* Avatar yükleme alanı */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <label
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            cursor: "pointer",
            background: "#fff",
          }}
        >
          Fotoğraf Yükle
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={(e) => onAvatarChange(e.target.files?.[0])}
          />
        </label>
        {avatar && (
          <button
            onClick={clearAvatar}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
            Kaldır
          </button>
        )}
        {avatarErr && <span style={{ color: "#b91c1c", fontSize: 12 }}>{avatarErr}</span>}
      </div>

      {/* Profil formu */}
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginBottom: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Ad Soyad</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="Ad Soyad"
            required
          />
          {!nameValid && <span style={{ color: "#b91c1c", fontSize: 12 }}>En az 3 karakter olmalı.</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>E-posta</span>
          <input
            value={user.email}
            readOnly
            style={{ padding: 10, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Bölüm</span>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="Örn: Bilgisayar Mühendisliği"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Sınıf</span>
          <select
            value={grade === "" ? "" : String(grade)}
            onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : "")}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
           <option value="">Seçilmedi</option>
            <option value="1">1. Sınıf</option>
            <option value="2">2. Sınıf</option>
            <option value="3">3. Sınıf</option>
            <option value="4">4. Sınıf</option>
            <option value="5">5. Sınıf</option>
            <option value="6">6. Sınıf</option>
            <option value="7">Hazırlık</option>
            <option value="8">Yüksek Lisans</option>
          </select>
          {!gradeValid && <span style={{ color: "#b91c1c", fontSize: 12 }}>Sınıf 1–6 arası olmalı.</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Doğum Tarihi</span>
          <input
            type="date"
            value={birthDate || ""}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
          {!birthValid && <span style={{ color: "#b91c1c", fontSize: 12 }}>Gelecek tarih olamaz.</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Telefon</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="+90 5__ ___ __ __"
          />
          {!phoneValid && (
            <span style={{ color: "#b91c1c", fontSize: 12 }}>
              Geçerli bir GSM numarası girin (örn: +905321234567 / 05321234567).
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
          <span>Hakkımda</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, resize: "vertical" }}
            placeholder="Kısaca kendinden bahsedebilirsin…"
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
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {msg && <span style={{ fontSize: 13, color: "#10b981" }}>{msg}</span>}
          {errMsg && <span style={{ fontSize: 13, color: "#b91c1c" }}>{errMsg}</span>}
        </div>
      </form>

      {/* Üyelikler */}
      <section>
        <h3 style={{ marginTop: 0 }}>Üyeliklerim</h3>

        {clubsQ.isLoading ? (
          <div style={{ color: "#666" }}>Kulüpler yükleniyor…</div>
        ) : memberships.length === 0 ? (
          <div style={{ color: "#666" }}>Herhangi bir kulübe üye değilsin.</div>
        ) : (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
            {memberships.map((m) => {
              const clubName = clubNameMap.get(m.clubId) || `Kulüp (${m.clubId.slice(0, 6)}…)`;
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
