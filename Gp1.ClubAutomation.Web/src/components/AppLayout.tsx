import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <div>
      <nav style={{display:"flex",gap:12,alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #eee"}}>
        <b>Kulüp Otomasyonu</b>
        <Link to="/">Home</Link>
        <Link to="/profile">Profilim</Link>
        <Link to="/clubs">Kulüpler</Link>
        <div style={{flex:1}} />
        <button onClick={logout} style={{padding:"6px 10px",border:"1px solid #ddd",borderRadius:8,background:"#fff",cursor:"pointer"}}>Çıkış</button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
<Link to="/clubs">Kulüpler</Link>
