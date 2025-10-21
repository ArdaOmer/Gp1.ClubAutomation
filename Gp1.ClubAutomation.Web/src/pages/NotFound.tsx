import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ minHeight:"60vh", display:"grid", placeItems:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, fontWeight:800, marginBottom:8 }}>404</div>
        <div style={{ color:"#555", marginBottom:16 }}>Aradığın sayfa bulunamadı.</div>
        <Link to="/" style={{ padding:"8px 12px", border:"1px solid #ddd", borderRadius:8, textDecoration:"none" }}>
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
