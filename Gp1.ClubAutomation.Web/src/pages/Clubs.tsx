import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClub, getClubs } from "../lib/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyMemberships } from "../lib/api";

export default function Clubs(){
  const qc = useQueryClient();
  const { user } = useAuth();

  // Kullanıcının üyeliklerini oku (localStorage veya user.memberships)
  const myMs = user ? getMyMemberships(user.id) : [];
  const isAnyPresident = myMs.some(m => m.role === "President");

  const { data, isLoading } = useQuery({ queryKey: ["clubs"], queryFn: getClubs });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const m = useMutation({
    mutationFn: () => createClub({ name, description: desc }),
    onSuccess: () => {
      setName("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["clubs"] });
    }
  });

  return (
    <div style={{padding:16}}>
      <h2 style={{marginBottom:12}}>Kulüpler</h2>

      {/* Kulüp oluşturma formu: yalnızca en az bir kulüpte President olan kullanıcıya görünür */}
      {isAnyPresident ? (
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input
            placeholder="Kulüp adı"
            value={name}
            onChange={e=>setName(e.target.value)}
            style={{padding:8,border:"1px solid #ddd",borderRadius:8}}
          />
          <input
            placeholder="Açıklama"
            value={desc}
            onChange={e=>setDesc(e.target.value)}
            style={{padding:8,border:"1px solid #ddd",borderRadius:8,flex:1}}
          />
          <button
            onClick={()=>m.mutate()}
            disabled={!name || m.isPending}
            style={{padding:"8px 12px",border:"none",borderRadius:8,background:"#22c55e",color:"#fff"}}
          >
            {m.isPending ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      ) : (
        <div style={{marginBottom:16,fontSize:13,color:"#666"}}>
          (Yalnızca kulüp başkanları yeni kulüp oluşturabilir.)
        </div>
      )}

      {isLoading ? "Yükleniyor..." : (
        <ul style={{display:"grid",gap:8}}>
          {(data ?? []).map(c => (
            <li key={c.id} style={{border:"1px solid #eee",borderRadius:10,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:600}}>{c.name}</div>
                  <div style={{fontSize:13,color:"#555"}}>{c.description || "—"}</div>
                </div>
                <Link
                  to={`/clubs/${c.id}/events`}
                  style={{textDecoration:"none",padding:"6px 10px",border:"1px solid #ddd",borderRadius:8}}
                >
                  Etkinlikler
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
