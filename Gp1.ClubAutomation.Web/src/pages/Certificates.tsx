import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { getEventsIAttend, getClubs } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

export default function Certificates() {
  const { user } = useAuth();
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  const items = useMemo(() => {
    if (!user) return [];
    try {
      return getEventsIAttend(user.id);
    } catch {
      return [];
    }
  }, [user]);

  if (!user) return <div style={{ padding:16 }}>Giriş gerekli.</div>;

  function openCertificate(title: string, clubName: string, dateStr: string, userName: string) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Sertifika</title>
<style>
  body { margin:0; background:#f8fafc; font-family: Inter, Arial, sans-serif; }
  .paper { width:900px; margin:40px auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:40px; box-shadow:0 10px 40px rgba(0,0,0,.08); }
  h1 { text-align:center; margin:0 0 16px 0; font-size:28px; }
  h2 { text-align:center; margin:0 0 8px 0; font-size:20px; color:#374151; }
  .line { height:1px; background:#e5e7eb; margin:24px 0; }
  .meta { text-align:center; color:#6b7280; margin-top:6px; }
  .signature { display:flex; justify-content:space-between; margin-top:48px; color:#374151; }
  .sign { text-align:center; width:45%; }
  .sign .name { margin-top:40px; border-top:1px solid #e5e7eb; padding-top:6px; }
  .badge { text-align:center; margin-bottom:16px; font-size:40px; }
  @media print { body { background:#fff; } .paper { box-shadow:none; margin:0; width:auto; border:none; } }
</style>
</head>
<body>
  <div class="paper">
    <div class="badge">🎓</div>
    <h1>KATILIM SERTİFİKASI</h1>
    <h2>${userName} adlı öğrencimiz,</h2>
    <h2><b>${clubName}</b> kulübünün <b>"${title}"</b> etkinliğine katılmıştır.</h2>
    <div class="line"></div>
    <div class="meta">Tarih: ${dateStr}</div>
    <div class="signature">
      <div class="sign"><div>Kulüp Başkanı</div><div class="name">${clubName}</div></div>
      <div class="sign"><div>Öğrenci</div><div class="name">${userName}</div></div>
    </div>
  </div>
  <script>window.print()</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer,width=980,height=700");
  // URL revoke'u, yeni pencerede yüklendikten bir süre sonra yapmak daha güvenli:
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}


  function clubName(id: string) {
    const c = clubsQ.data?.find(x => x.id === id);
    return c?.name || "Kulüp";
  }

  return (
    <div style={{ padding:16 }}>
      <h2 style={{ margin:"0 0 12px 0" }}>Sertifikalar</h2>
      {items.length === 0 ? (
        <div style={{ border:"1px dashed #ddd", borderRadius:12, padding:16, color:"#666" }}>
          Henüz katıldığın bir etkinlik bulunmuyor. Home sayfasında etkinliklere “Katılıyorum” diyerek katılımlarını işaretleyebilirsin.
        </div>
      ) : (
        <ul style={{ listStyle:"none", padding:0, display:"grid", gap:8 }}>
          {items.map(ev => {
            const dateStr = new Date(ev.startAt).toLocaleString();
            const cn = clubName(ev.clubId);
            return (
              <li key={ev.id} style={{
                border:"1px solid #eee", borderRadius:10, padding:12, boxShadow:"0 4px 16px rgba(0,0,0,.05)",
                display:"flex", justifyContent:"space-between", alignItems:"center", gap:8
              }}>
                <div>
                  <div style={{ fontWeight:700 }}>{ev.title}</div>
                  <div style={{ fontSize:13, color:"#555" }}>{cn} • {dateStr}</div>
                </div>
                <button
                  onClick={() => openCertificate(ev.title, cn, dateStr, user.name || user.email)}
                  style={{ padding:"6px 10px", border:"1px solid #ddd", borderRadius:8, background:"#fff" }}
                >
                  Sertifika Oluştur
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
