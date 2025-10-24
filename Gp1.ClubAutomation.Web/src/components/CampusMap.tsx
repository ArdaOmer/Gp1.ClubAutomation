// src/components/CampusMap.tsx
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingEventsForUser, getClubs } from "../lib/api";
import type { Club, EventItem } from "../types";


 const campusMap = "/campus-map.png";

// === HARİTA ÜZERİ KONUM EŞLEME ===
// xPct / yPct DEĞERLERİ % (0–100) OLARAK VERİLİR (responsive çalışır)
type Pos = { xPct: number; yPct: number; label?: string };
const locationMap: Record<string, Pos> = {
  "A Blok": { xPct: 10, yPct: 72, label: "A Blok" },
  "Gençlik Merkezi": { xPct: 64, yPct: 58, label: "Gençlik Merkezi" },
  "Kütüphane": { xPct: 53, yPct: 74, label: "Kütüphane" },
  "Stadyum": { xPct: 97, yPct: 43, label: "Stadyum" },
  "Spor Salonu":{xPct:78,yPct:90,label:"Spor Salonu"},
  "Konferans Salonu": { xPct: 29, yPct: 36, label: "Konferans Salonu" },
  "Cey Park": {xPct:42,yPct:68,label:"Cey Park"},
  // İstediğin kadar ekleyebilirsin…
};

// Geliştirici modu: Haritaya tıklayınca % koordinatlarını konsola yazar.
// İstersen .env’de VITE_MAP_DEV_CLICK="1" yaparsın, yoksa false kalır.
const DEV_CLICK = import.meta.env.VITE_MAP_DEV_CLICK === "1";

export default function CampusMap({ userId }: { userId: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Etkinlikler (30 gün) ve kulüp isimleri
  const eventsQ = useQuery({
    queryKey: ["map_events", userId],
    queryFn: () => getUpcomingEventsForUser(userId, 30),
    enabled: !!userId,
  });
  const clubsQ = useQuery({ queryKey: ["clubs"], queryFn: getClubs });

  const [hovered, setHovered] = useState<EventItem | null>(null);

  const clubName = (cid: string) =>
    clubsQ.data?.find((c: Club) => c.id === cid)?.name ?? "Kulüp";

  // location alanı locationMap’te olan etkinlikleri al
  const mappedEvents = useMemo(
    () => (eventsQ.data ?? []).filter((e) => !!e.location && !!locationMap[e.location!]),
    [eventsQ.data]
  );

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!DEV_CLICK || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    // Koordinatı konsola bas (kopyalayıp locationMap’e eklemen için)
    console.log(`{ xPct: ${xPct.toFixed(2)}, yPct: ${yPct.toFixed(2)} }`);
  }

  return (
    <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>🗺️ Kampüs Haritası</h3>
        <span style={{ fontSize: 12, color: "#666" }}>
          (Konum bilgisi girilen etkinlikler harita üzerinde gösterilir)
        </span>
      </div>

      {eventsQ.isLoading ? (
        <div>Etkinlikler yükleniyor…</div>
      ) : mappedEvents.length === 0 ? (
        <div style={{ color: "#666" }}>
          Yer bilgisi bulunan yaklaşan etkinlik yok. Etkinlik eklerken
          <b> location</b> olarak <i>A Blok, B Blok, Kütüphane…</i> gibi tanımları kullan.
        </div>
      ) : (
        <div
          ref={wrapRef}
          onClick={onMapClick}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 900,
            margin: "0 auto",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,.06)",
          }}
        >
          {/* Harita görseli */}
          <img
            src={campusMap}
            alt="Kampüs Haritası"
            style={{ width: "100%", height: "auto", display: "block" }}
            draggable={false}
          />

          {/* PIN'ler */}
          {mappedEvents.map((e) => {
            const pos = locationMap[e.location!];
            return (
              <button
                key={e.id}
                onMouseEnter={() => setHovered(e)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  background: "#2563eb",
                  boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                  cursor: "pointer",
                }}
                title={`${e.title} • ${e.location}`}
              />
            );
          })}

          {/* Tooltip */}
          {hovered && hovered.location && locationMap[hovered.location] && (
            <div
              style={{
                position: "absolute",
                left: `calc(${locationMap[hovered.location].xPct}% + 12px)`,
                top: `calc(${locationMap[hovered.location].yPct}% - 8px)`,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
                boxShadow: "0 10px 30px rgba(0,0,0,.12)",
                fontSize: 13,
                zIndex: 10,
                width: 220,
                pointerEvents: "none",
              }}
            >
              <div style={{ fontWeight: 700 }}>{hovered.title}</div>
              <div style={{ color: "#555", marginTop: 2 }}>
                {new Date(hovered.startAt).toLocaleString("tr-TR")}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                {clubName(hovered.clubId)} • {hovered.location}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Küçük bir açıklama */}
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        Not: Haritada görünmesi için etkinliğin <b>location</b> alanının <i>locationMap</i>’te tanımlı olması gerekir.
      </div>
    </section>
  );
}
