import { FormEvent, useState } from "react";
import { loginApi } from "../lib/api";
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
    setErr(null); setLoading(true);
    try { const res = await loginApi({ email, password }); login(res.token, res.user); nav("/"); }
    catch (e: any) { setErr(e?.message ?? "Giriş başarısız."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f6f7fb"}}>
      <form onSubmit={onSubmit} style={{width:360,background:"#fff",padding:24,borderRadius:12,boxShadow:"0 8px 30px rgba(0,0,0,.08)"}}>
        <h1 style={{fontSize:22,marginBottom:16}}>Hoş geldin! Lütfen giriş yap.</h1>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="E-posta" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10,border:"1px solid #ddd",borderRadius:8}} required />
          <input placeholder="Şifre" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:10,border:"1px solid #ddd",borderRadius:8}} required />
          <button disabled={loading} style={{padding:10,border:"none",borderRadius:8,background:"#3b82f6",color:"#fff",cursor:"pointer"}}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
          {import.meta.env.VITE_USE_MOCK === "1" && <p style={{fontSize:12,color:"#666"}}>Mock: <b>test@uni.edu / 123456</b></p>}
          {err && <div style={{color:"#b00020"}}>{err}</div>}
        </div>
      </form>
    </div>
  );
}
