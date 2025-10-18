import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getMyMemberships, updateMe, getClubs } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Kulüp listesini çek (isimleri göstermek için)
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  useEffect(() => { setName(user?.name ?? ""); }, [user]);

  if (!user) return <div style={{ padding: 16 }}>Giriş gerekli.</div>;

  // Üyelikler (user + localStorage birleştirilmiş halde dönüyor)
  const memberships = getMyMemberships(user.id);

  // clubId -> clubName eşlemesi
  const clubNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (clubsQ.data ?? []).forEach(c => map.set(c.id, c.name));
    return map;
  }, [clubsQ.data]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const updated = await updateMe({ name });
      updateUser({ name: updated.name });
      setMsg("Profil güncellendi.");
    } catch {
      setMsg("Kaydetme sırasında bir sorun oluştu.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const initials = (user.name || user.email || "?")
    .split(" ")[0].slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: "#e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Profilim</h2>
          <div style={{ fontSize: 13, color: "#666" }}>{user.email}</div>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Ad Soyad</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            placeholder="Ad Soyad"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>E-posta</span>
          <input
            value={user.email}
            readOnly
            style={{ padding: 10, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}
          />
        </label>

        <div>
          <button
            disabled={saving}
            style={{ padding: "10px 14px", border: "none", borderRadius: 8, background: "#3b82f6", color: "#fff" }}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {msg && <span style={{ marginLeft: 10, fontSize: 13, color: "#10b981" }}>{msg}</span>}
        </div>
      </form>

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
                <li key={m.clubId}
                    style={{ border: "1px solid #eee", borderRadius: 10, padding: 12,
                             display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontWeight: 600 }}>{clubName}</div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 999, fontSize: 12,
                    background: isPresident ? "#fee2e2" : "#e0f2fe",
                    color: isPresident ? "#b91c1c" : "#075985",
                    border: "1px solid #eee"
                  }}>
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
