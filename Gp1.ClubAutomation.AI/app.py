from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re

app = FastAPI(title="GP1 AI", version="1.1")

# --- Pinned tags from FE ---
AI_INTERESTS = [
    "Sports",
    "Arts",
    "Music",
    "Technology",
    "Software & AI",
    "Robotics",
    "Entrepreneurship",
    "Social Responsibility",
    "Volunteerism",
    "Culture",
    "Photography",
    "Gaming",
    "Health & Wellness",
    "Science",
    "Language",
]

# --- Normalization turkish characters + basic cleanup ---
TR_MAP = str.maketrans({
    "ı": "i", "İ": "i",
    "ş": "s", "Ş": "s",
    "ğ": "g", "Ğ": "g",
    "ü": "u", "Ü": "u",
    "ö": "o", "Ö": "o",
    "ç": "c", "Ç": "c",
})

def norm(s: str) -> str:
    s = (s or "").translate(TR_MAP).lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s

# --- Interest -> keyword pool (TR/EN + variations) ---
INTEREST_KEYWORDS: Dict[str, List[str]] = {
    "Sports": [
        "spor", "futbol", "soccer", "football", "basketbol", "basketball", "voleybol", "volleyball",
        "tenis", "tennis", "masa tenisi", "ping pong", "badminton", "yuzme", "swimming",
        "kosu", "running", "atletizm", "athletics", "fitness", "turnuva", "tournament",
        "mac", "match", "lig", "league", "takim", "team", "kondisyon", "antrenman", "training"
    ],
    "Arts": [
        "sanat", "resim", "cizim", "karakalem", "heykel", "seramik", "ebru", "illustration",
        "tasarim", "design", "atolye", "workshop", "galeri", "gallery", "dijital sanat", "digital art",
        "tiyatro", "theatre", "sahne", "drama"
    ],
    "Music": [
        "muzik", "music", "konser", "concert", "gitar", "guitar", "piyano", "piano", "bateri", "drum",
        "keman", "violin", "baglama", "koro", "choir", "orkestra", "orchestra", "vokal", "vocal"
    ],
    "Technology": [
        "teknoloji", "technology", "inovasyon", "innovation", "elektronik", "electronics",
        "donanim", "hardware", "muhendislik", "engineering", "iot", "nesnelerin interneti",
        "arduino", "raspberry", "sensor", "sensör", "devre", "circuit"
    ],
    "Software & AI": [
        "yazilim", "software", "programlama", "programming", "kod", "coding", "developer",
        "web", "backend", "frontend", "mobil", "mobile", "algoritma", "algorithm",
        "yapay zeka", "artificial intelligence", "ai", "makine ogrenmesi", "machine learning", "ml",
        "derin ogrenme", "deep learning", "nlp", "goruntu isleme", "computer vision",
        "python", "c#", "java", "javascript", "react", "node", ".net"
    ],
    "Robotics": [
        "robotik", "robotics", "robot", "otonom", "autonomous", "mekatronik", "mechatronics",
        "servo", "motor", "sensor", "sensör", "drone", "embedded", "gomulu", "kontrol", "control"
    ],
    "Entrepreneurship": [
        "girisimcilik", "entrepreneurship", "startup", "is fikri", "business idea", "yatirim",
        "investor", "pitch", "demo day", "is modeli", "business model", "pazarlama", "marketing",
        "growth", "urun", "product"
    ],
    "Social Responsibility": [
        "sosyal sorumluluk", "social responsibility", "farkindalik", "awareness", "toplumsal",
        "dayanisma", "social impact", "surdurulebilirlik", "sustainability", "cevre", "environment",
        "iklim", "climate", "erisilebilirlik", "accessibility", "esitlik", "equality"
    ],
    "Volunteerism": [
        "gonulluluk", "volunteer", "gönüllü", "donation", "bagis", "yardim", "charity",
        "dernek", "vakif", "ngo", "foundation", "saha calismasi", "support", "destek"
    ],
    "Culture": [
        "kultur", "culture", "festival", "tarih", "history", "gezi", "trip", "muze", "museum",
        "tiyatro", "theatre", "sinema", "cinema", "edebiyat", "literature", "soylesi", "talk"
    ],
    "Photography": [
        "fotograf", "photography", "kamera", "camera", "cekım", "cekim", "shoot", "lens",
        "portre", "portrait", "manzara", "landscape", "kadraj", "composition", "photoshop", "lightroom"
    ],
    "Gaming": [
        "oyun", "game", "gaming", "esports", "e-spor", "turnuva", "tournament",
        "valorant", "cs", "dota", "lol", "fifa", "pubg", "minecraft", "discord", "lan party"
    ],
    "Health & Wellness": [
        "saglik", "health", "wellness", "iyi yasam", "mental saglik", "mental health",
        "psikoloji", "psychology", "meditasyon", "meditation", "mindfulness",
        "yoga", "pilates", "beslenme", "nutrition", "stres", "stress", "uyku", "sleep"
    ],
    "Science": [
        "bilim", "science", "arastirma", "research", "laboratuvar", "lab", "deney", "experiment",
        "fizik", "physics", "kimya", "chemistry", "biyoloji", "biology", "matematik", "math",
        "konferans", "conference", "seminer", "seminar"
    ],
    "Language": [
        "dil", "language", "ingilizce", "english", "almanca", "german", "fransizca", "french",
        "ispanyolca", "spanish", "italyanca", "italian", "japonca", "japanese", "korece", "korean",
        "cince", "chinese", "speaking", "konusma", "pratik", "practice", "ceviri", "translation", "tandem"
    ],
}

# ----------- Models -----------
class ClubIn(BaseModel):
    clubId: int
    name: str
    description: Optional[str] = None

class RecommendRequest(BaseModel):
    interests: List[str]          # FE -> ["Sports","Gaming",...]
    clubs: List[ClubIn] = []      # ✅ BE -> DB’den çekip buraya koyacak

class ScoresResponse(BaseModel):
    scores: List[Dict[str, Any]]  # [{"clubId":1,"score":0.92}, ...]

@app.get("/health")
def health():
    return {"status": "ok", "service": "gp1-ai"}

@app.post("/recommend-clubs", response_model=ScoresResponse)
def recommend(req: RecommendRequest):
    # 1) Validate / filter interests
    selected = [i for i in (req.interests or []) if i in INTEREST_KEYWORDS]

    clubs = req.clubs or []
    if not clubs:
        return {"scores": []}

    # 2) If no valid interest selected => low score (still return all clubs)
    if not selected:
        return {"scores": [{"clubId": c.clubId, "score": 0.1} for c in clubs]}

    # 3) Collect keyword pool
    keyword_list: List[str] = []
    for interest in selected:
        keyword_list.extend(INTEREST_KEYWORDS.get(interest, []))
    keyword_list = [norm(k) for k in keyword_list]

    # 4) Score each club
    results = []
    for c in clubs:
        text = norm(c.name + " " + (c.description or ""))

        hits = 0
        for kw in keyword_list:
            if not kw:
                continue
            if kw in text:
                if kw in ["futbol", "football", "soccer"]:
                    hits += 4
                elif kw in ["spor", "sport", "tournament", "turnuva", "match", "mac"]:
                    hits += 2
                else:
                    hits += 1

        results.append({"clubId": c.clubId, "raw": hits})

    # 5) Normalize 0..1
    max_hits = max((r["raw"] for r in results), default=0)

    scores = []
    for r in results:
        score = (r["raw"] / max_hits) if max_hits > 0 else 0.1
        score = max(score, 0.05)  # don’t allow 0
        scores.append({"clubId": r["clubId"], "score": round(float(score), 4)})

    scores.sort(key=lambda x: x["score"], reverse=True)
    return {"scores": scores}