import { FormEvent, useState } from "react";
import { loginApi, persistMembershipsFromUser } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await loginApi({ email, password });

      // Adı e-postadan üretelim
      const nameFromEmail = email
        .split("@")[0]
        .split(/[._-]/g)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      // Mock kulüpleri al
      const clubs = JSON.parse(localStorage.getItem("mock_clubs") || "[]") as {
        id: string;
        name: string;
      }[];

      let memberships: { clubId: string; role: "Member" | "President" }[] = [];

      // 🎯 Kullanıcıya göre roller:
      if (email === "test@uni.edu") {
        // 1. kulübün başkanı, diğerlerinde üye
        if (clubs.length > 0) {
          memberships.push({ clubId: clubs[0].id, role: "President" });
          for (let i = 1; i < clubs.length; i++) {
            memberships.push({ clubId: clubs[i].id, role: "Member" });
          }
        }
      } else if (email === "test1@uni.edu") {
        // Bu kullanıcı sadece öğrenci, tüm kulüplerde Member
        for (let i = 0; i < clubs.length; i++) {
          memberships.push({ clubId: clubs[i].id, role: "Member" });
        }
      } else {
        // Diğer kullanıcılar da sadece Member olsun
        for (let i = 0; i < clubs.length; i++) {
          memberships.push({ clubId: clubs[i].id, role: "Member" });
        }
      }

      // Kullanıcı nesnesini oluştur
      const user = { ...res.user, name: nameFromEmail, memberships };

      // AuthContext'e kaydet + localStorage eşitle
      login(res.token, user as any);
      persistMembershipsFromUser(user as any);

      nav("/");
    } catch (e: any) {
      setErr(e?.message ?? "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f7fb",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 16 }}>
          Hoş geldin! Lütfen giriş yap.
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
            required
          />
          <input
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
            required
          />
          <button
            disabled={loading}
            style={{
              padding: 10,
              border: "none",
              borderRadius: 8,
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          {/* Kullanıcı ipucu */}
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Mock girişler:  
            <br />✅ Başkan → <b>test@uni.edu / 123456</b>  
            <br />👤 Öğrenci → <b>test1@uni.edu / 123456</b>
          </div>

          {err && <div style={{ color: "#b00020" }}>{err}</div>}
        </div>
      </form>
    </div>
  );
}
