import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClub, getClubs, getMyMemberships, joinClub, leaveClub } from "../lib/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Clubs(){
  const qc = useQueryClient();
  const { user } = useAuth();

  // render yenilemek için ufak tetik
  const [bump, setBump] = useState(0);

  const myMs = user ? getMyMemberships(user.id) : [];
  const isAnyPresident = myMs.some(m => m.role === "President");
  const isMember = (clubId: string) => myMs.some(m => m.clubId === clubId);

  const { data, isLoading } = useQuery({ queryKey: ["clubs", bump], queryFn: getClubs });

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [q, setQ] = useState(""); // arama

  const m = useMutation({
    mutationFn: () => createClub({ name, description: desc }),
    onSuccess: () => {
      setName(""); setDesc("");
      qc.invalidateQueries({ queryKey: ["clubs"] });
    }
  });

  const handleJoin = (clubId: string) => { if (!user) return; joinClub(user.id, clubId); setBump(x=>x+1); };
  const handleLeave = (clubId: string) => { if (!user) return; leaveClub(user.id, clubId); setBump(x=>x+1); };

  return (
    <div style={{padding:16}}>
      <h2 style={{marginBottom:12}}>Kulüpler</h2>

      {isAnyPresident ? (
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input placeholder="Kulüp adı" value={name} onChange={e=>setName(e.target.value)}
                 style={{padding:8,border:"1px solid #ddd",borderRadius:8}} />
          <input placeholder="Açıklama" value={desc} onChange={e=>setDesc(e.target.value)}
                 style={{padding:8,border:"1px solid #ddd",borderRadius:8,flex:1}} />
          <button onClick={()=>m.mutate()} disabled={!name || m.isPending}
                  style={{padding:"8px 12px",border:"none",borderRadius:8,background:"#22c55e",color:"#fff"}}>
            {m.isPending ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      ) : (
        <div style={{marginBottom:16,fontSize:13,color:"#666"}}>
          (Yalnızca kulüp başkanları yeni kulüp oluşturabilir.)
        </div>
      )}

      {/* Arama */}
      <div style={{ marginBottom:12 }}>
        <input
          placeholder="Kulüplerde ara…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{ width:"100%", padding:8, border:"1px solid #ddd", borderRadius:8 }}
        />
      </div>

      {isLoading ? "Yükleniyor..." : (
        <ul style={{display:"grid",gap:8, listStyle:"none", padding:0}}>
          {(data ?? [])
            .filter(c => {
              const s = q.trim().toLowerCase();
              if (!s) return true;
              return c.name.toLowerCase().includes(s) || (c.description||"").toLowerCase().includes(s);
            })
            .map(c => (
            <li key={c.id} style={{border:"1px solid #eee",borderRadius:10,padding:12,
              boxShadow:"0 4px 16px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", gap:8}}>
                <div>
                  <div style={{fontWeight:600}}>{c.name}</div>
                  <div style={{fontSize:13,color:"#555"}}>{c.description || "—"}</div>
                </div>

                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  {user && (
                    isMember(c.id) ? (
                      <button onClick={()=>handleLeave(c.id)}
                              style={{padding:"6px 10px",border:"1px solid #ddd",borderRadius:8,background:"#fff"}}>
                        Ayrıl
                      </button>
                    ) : (
                      <button onClick={()=>handleJoin(c.id)}
                              style={{padding:"6px 10px",border:"1px solid #ddd",borderRadius:8,background:"#fff"}}>
                        Katıl
                      </button>
                    )
                  )}

                  <Link to={`/clubs/${c.id}/events`}
                        style={{textDecoration:"none",padding:"6px 10px",border:"1px solid #ddd",borderRadius:8}}>
                    Etkinlikler
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
