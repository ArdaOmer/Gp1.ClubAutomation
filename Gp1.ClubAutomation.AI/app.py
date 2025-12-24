from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re

app = FastAPI(title="GP1 AI", version="1.2")

# =========================================================
# 1) FE Pinned Tags to AI Club (DON'T TOUCH)
# =========================================================
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

# =========================================================
# 2) Turkish characters to normalize + Basic cleaning
# =========================================================
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

# =========================================================
# 3) Interest -> keyword pool (TR + EN + variations)
#    Note: This list for matching.
# =========================================================
INTEREST_KEYWORDS: Dict[str, List[str]] = {
    "Sports": [
        # TR
        "spor", "futbol", "basketbol", "voleybol", "tenis", "masa tenisi", "badminton",
        "yuzme", "koşu", "kosu", "atletizm", "kondisyon", "antrenman", "turnuva", "mac", "lig", "takim",
        # EN
        "sport", "sports", "football", "soccer", "basketball", "volleyball", "tennis", "ping pong",
        "swimming", "running", "athletics", "fitness", "training", "tournament", "match", "league", "team",
    ],
    "Arts": [
        # TR
        "sanat", "resim", "cizim", "çizim", "karakalem", "heykel", "seramik", "ebru",
        "tasarim", "tasarım", "atolye", "galeri", "dijital sanat", "tiyatro", "sahne", "drama",
        # EN
        "art", "arts", "painting", "drawing", "sketch", "sculpture", "ceramic", "marbling",
        "design", "workshop", "gallery", "digital art", "theatre", "stage", "drama",
        # Extra
        "illustration", "illustrator",
    ],
    "Music": [
        # TR
        "muzik", "müzik", "konser", "gitar", "piyano", "bateri", "keman", "baglama", "bağlama",
        "koro", "orkestra", "vokal", "sarki", "şarkı",
        # EN
        "music", "concert", "guitar", "piano", "drum", "drums", "violin", "choir", "orchestra", "vocal", "song",
    ],
    "Technology": [
        # TR
        "teknoloji", "inovasyon", "elektronik", "donanim", "donanım", "muhendislik", "mühendislik",
        "nesnelerin interneti", "sensor", "sensör", "devre",
        # EN
        "technology", "innovation", "electronics", "hardware", "engineering", "internet of things",
        "sensor", "circuit",
        # Common terms
        "iot", "arduino", "raspberry", "raspberry pi",
    ],
    "Software & AI": [
        # TR
        "yazilim", "yazılım", "programlama", "kod", "gelistirici", "geliştirici",
        "web", "backend", "frontend", "mobil", "algoritma",
        "yapay zeka", "yapay zekâ", "makine ogrenmesi", "makine öğrenmesi", "derin ogrenme", "derin öğrenme",
        "goruntu isleme", "görüntü işleme",
        # EN
        "software", "programming", "coding", "code", "developer",
        "web", "backend", "frontend", "mobile", "algorithm",
        "artificial intelligence", "ai", "machine learning", "ml", "deep learning", "nlp",
        "computer vision",
        # Technologies
        "python", "c#", "java", "javascript", "typescript", "react", "node", ".net", "dotnet",
    ],
    "Robotics": [
        # TR
        "robotik", "robot", "otonom", "otonom sistem", "mekatronik", "servo", "motor",
        "sensor", "sensör", "drone", "gomulu", "gömülü", "kontrol",
        # EN
        "robotics", "robot", "autonomous", "mechatronics", "servo", "motor",
        "sensor", "drone", "embedded", "control",
    ],
    "Entrepreneurship": [
        # TR
        "girisim", "girişim", "girisimcilik", "girişimcilik", "startup", "is fikri", "iş fikri",
        "yatirim", "yatırım", "yatirimci", "yatırımcı", "sunum", "pitch", "demo day",
        "is modeli", "iş modeli", "pazarlama", "urun", "ürün",
        # EN
        "entrepreneurship", "startup", "business idea", "investment", "investor", "pitch", "demo day",
        "business model", "marketing", "product", "growth",
    ],
    "Social Responsibility": [
        # TR
        "sosyal sorumluluk", "farkindalik", "farkındalık", "toplumsal", "dayanisma", "dayanışma",
        "surdurulebilirlik", "sürdürülebilirlik", "cevre", "çevre", "iklim",
        "erisilebilirlik", "erişilebilirlik", "esitlik", "eşitlik",
        # EN
        "social responsibility", "awareness", "social impact", "sustainability", "environment",
        "climate", "accessibility", "equality",
    ],
    "Volunteerism": [
        # TR
        "gonulluluk", "gönüllülük", "gonullu", "gönüllü", "bagis", "bağış", "yardim", "yardım",
        "dernek", "vakif", "vakıf", "saha calismasi", "saha çalışması", "destek",
        # EN
        "volunteerism", "volunteer", "donation", "charity", "ngo", "foundation", "field work", "support",
    ],
    "Culture": [
        # TR
        "kultur", "kültür", "festival", "tarih", "gezi", "muze", "müze",
        "tiyatro", "sinema", "edebiyat", "soylesi", "söyleşi",
        # EN
        "culture", "festival", "history", "trip", "museum", "theatre", "cinema", "literature", "talk",
    ],
    "Photography": [
        # TR
        "fotograf", "fotoğraf", "kamera", "cekım", "çekim", "lens", "portre", "manzara",
        "kadraj", "kompozisyon",
        # EN
        "photography", "photo", "camera", "shoot", "lens", "portrait", "landscape", "composition",
        # Araçlar
        "photoshop", "lightroom",
    ],
    "Gaming": [
        # TR
        "oyun", "e-spor", "turnuva", "lan party",
        # EN
        "game", "gaming", "esports", "tournament", "lan party",
        # Game names
        "valorant", "cs", "csgo", "counter strike", "dota", "lol", "league of legends", "fifa", "pubg", "minecraft",
        "discord",
    ],
    "Health & Wellness": [
        # TR
        "saglik", "sağlık", "iyi yasam", "iyi yaşam", "mental saglik", "mental sağlık",
        "psikoloji", "meditasyon", "farkindalik", "farkındalık",
        "yoga", "pilates", "beslenme", "stres", "uyku",
        # EN
        "health", "wellness", "well-being", "mental health", "psychology", "meditation", "mindfulness",
        "yoga", "pilates", "nutrition", "stress", "sleep",
    ],
    "Science": [
        # TR
        "bilim", "arastirma", "araştırma", "laboratuvar", "deney",
        "fizik", "kimya", "biyoloji", "matematik",
        "konferans", "seminer",
        # EN
        "science", "research", "laboratory", "lab", "experiment",
        "physics", "chemistry", "biology", "math", "mathematics",
        "conference", "seminar",
    ],
    "Language": [
        # TR
        "dil", "ingilizce", "almanca", "fransizca", "fransızca", "ispanyolca", "italyanca",
        "japonca", "korece", "cince", "çince",
        "konusma", "konuşma", "pratik", "ceviri", "çeviri", "tandem",
        # EN
        "language", "english", "german", "french", "spanish", "italian", "japanese", "korean", "chinese",
        "speaking", "practice", "translation", "tandem",
    ],
}

# =========================================================
# 4) Label-based weighted scoring (each label balanced)
# =========================================================
WEIGHTED_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    "Sports": {
        "strong": ["futbol","football","soccer","basketbol","basketball","voleybol","volleyball","tenis","tennis","yuzme","swimming","fitness"],
        "medium": ["spor","sport","sports","turnuva","tournament","mac","match","lig","league","takim","team","antrenman","training","atletizm","athletics","running","kosu"],
        "weak": ["kondisyon","badminton","ping pong","masa tenisi"],
    },
    "Arts": {
        "strong": ["resim","painting","cizim","drawing","illustration","heykel","sculpture","seramik","ceramic","dijital sanat","digital art","tiyatro","theatre"],
        "medium": ["sanat","art","arts","tasarim","design","atolye","workshop","galeri","gallery","sahne","stage","drama"],
        "weak": ["karakalem","ebru","marbling","kompozisyon","composition"],
    },
    "Music": {
        "strong": ["muzik","music","gitar","guitar","piyano","piano","keman","violin","bateri","drum","drums","orkestra","orchestra"],
        "medium": ["konser","concert","koro","choir","vokal","vocal","sarki","song","stage","sahne"],
        "weak": ["baglama","bağlama","nota","note","prova","rehearsal"],
    },
    "Technology": {
        "strong": ["iot","nesnelerin interneti","internet of things","arduino","raspberry","raspberry pi","electronics","elektronik","donanim","hardware"],
        "medium": ["teknoloji","technology","inovasyon","innovation","muhendislik","engineering","devre","circuit","sensor","sensör"],
        "weak": ["prototype","prototip","maker"],
    },
    "Software & AI": {
        "strong": ["yapay zeka","yapay zekâ","artificial intelligence","ai","machine learning","makine ogrenmesi","makine öğrenmesi","ml","deep learning","derin ogrenme","derin öğrenme","nlp","computer vision","goruntu isleme","görüntü işleme"],
        "medium": ["yazilim","yazılım","software","programlama","programming","kod","coding","developer","web","backend","frontend","mobil","mobile","algoritma","algorithm"],
        "weak": ["python","c#","java","javascript","typescript","react","node",".net","dotnet"],
    },
    "Robotics": {
        "strong": ["robotik","robotics","mekatronik","mechatronics","otonom","autonomous","drone"],
        "medium": ["robot","servo","motor","kontrol","control","sensor","sensör","embedded","gomulu","gömülü"],
        "weak": ["arduino","raspberry"],
    },
    "Entrepreneurship": {
        "strong": ["girisim","girişim","girisimcilik","girişimcilik","entrepreneurship","startup","pitch","demo day","yatirim","yatırım","investor","yatirimci","yatırımcı"],
        "medium": ["is fikri","iş fikri","business idea","is modeli","iş modeli","business model","pazarlama","marketing","urun","ürün","product","growth"],
        "weak": ["networking","mentorship","mentor"],
    },
    "Social Responsibility": {
        "strong": ["sosyal sorumluluk","social responsibility","sustainability","surdurulebilirlik","sürdürülebilirlik","iklim","climate","environment","cevre","çevre","social impact"],
        "medium": ["farkindalik","farkındalık","awareness","dayanisma","dayanışma","toplumsal","esitlik","eşitlik","equality","accessibility","erisilebilirlik","erişilebilirlik"],
        "weak": ["kampanya","campaign","etkinlik","event"],
    },
    "Volunteerism": {
        "strong": ["gonulluluk","gönüllülük","gonullu","gönüllü","volunteerism","volunteer","charity","yardim","yardım","bagis","bağış","donation"],
        "medium": ["dernek","vakif","vakıf","ngo","foundation","destek","support","saha calismasi","saha çalışması","field work"],
        "weak": ["community","topluluk"],
    },
    "Culture": {
        "strong": ["kultur","kültür","culture","festival","muze","müze","museum","tarih","history","edebiyat","literature"],
        "medium": ["tiyatro","theatre","sinema","cinema","soylesi","söyleşi","talk","gezi","trip"],
        "weak": ["etkinlik","event"],
    },
    "Photography": {
        "strong": ["fotograf","fotoğraf","photography","camera","kamera","lens","photoshop","lightroom"],
        "medium": ["portre","portrait","manzara","landscape","cekım","çekim","shoot","kadraj","composition","kompozisyon"],
        "weak": ["editing","duzenleme","düzenleme"],
    },
    "Gaming": {
        "strong": ["gaming","esports","e-spor","valorant","cs","csgo","counter strike","dota","lol","league of legends","fifa","pubg","minecraft"],
        "medium": ["oyun","game","turnuva","tournament","discord","lan party"],
        "weak": ["community","topluluk"],
    },
    "Health & Wellness": {
        "strong": ["mental health","mental saglik","mental sağlık","mindfulness","meditation","meditasyon","yoga","pilates"],
        "medium": ["saglik","sağlık","health","wellness","beslenme","nutrition","stres","stress","uyku","sleep","psikoloji","psychology","iyi yasam","iyi yaşam"],
        "weak": ["fitness","spor"],
    },
    "Science": {
        "strong": ["research","arastirma","araştırma","laboratuvar","laboratory","lab","deney","experiment","konferans","conference","seminer","seminar"],
        "medium": ["bilim","science","fizik","physics","kimya","chemistry","biyoloji","biology","matematik","math","mathematics"],
        "weak": ["workshop","atolye"],
    },
    "Language": {
        "strong": ["english","ingilizce","german","almanca","french","fransizca","fransızca","spanish","ispanyolca","italian","italyanca","japanese","japonca","korean","korece","chinese","cince","çince"],
        "medium": ["language","dil","speaking","konusma","konuşma","pratik","practice","ceviri","çeviri","translation","tandem"],
        "weak": ["club","kulup","kulüp"],
    },
}

def tier_weight(tier: str) -> int:
    return 4 if tier == "strong" else 2 if tier == "medium" else 1

# =========================================================
# 5) Request/Response models
# =========================================================
class ClubIn(BaseModel):
    clubId: int
    name: str
    description: Optional[str] = None

class RecommendRequest(BaseModel):
    interests: List[str]               # FE -> ["Sports","Gaming",...]
    clubs: List[ClubIn] = []           # BE -> Pulls from DB

class ScoresResponse(BaseModel):
    scores: List[Dict[str, Any]]       # [{"clubId":1,"score":0.92}, ...]

# =========================================================
# 6) Endpoints
# =========================================================
@app.get("/health")
def health():
    return {"status": "ok", "service": "gp1-ai"}

@app.post("/recommend-clubs", response_model=ScoresResponse)
def recommend(req: RecommendRequest):
    # 1) Interests verify
    selected = [i for i in (req.interests or []) if i in AI_INTERESTS]

    # 2) If clubs are empty => the score will be empty (meaning BE forgot to send clubs)
    clubs = req.clubs or []
    if not clubs:
        return {"scores": []}

    # 3) If interest is not selected => all will receive the same low score.
    if not selected:
        return {"scores": [{"clubId": c.clubId, "score": 0.1} for c in clubs]}

    # 4) Set scores
    results = []
    for c in clubs:
        text = norm(f"{c.name} {c.description or ''}")

        hits = 0
        for interest in selected:
            w = WEIGHTED_KEYWORDS.get(interest)
            if not w:
                # fallback: According to the classic keyword list (it should still find something)
                for raw_kw in INTEREST_KEYWORDS.get(interest, []):
                    kw = norm(raw_kw)
                    if kw and kw in text:
                        hits += 1
                continue

            for tier in ("strong", "medium", "weak"):
                for raw_kw in w.get(tier, []):
                    kw = norm(raw_kw)
                    if kw and kw in text:
                        hits += tier_weight(tier)

        results.append({"clubId": c.clubId, "raw": hits})

    # 5) normalize 0..1
    max_hits = max((r["raw"] for r in results), default=0)

    scores = []
    for r in results:
        score = (r["raw"] / max_hits) if max_hits > 0 else 0.1
        score = max(score, 0.05)  # not equal zero
        scores.append({"clubId": r["clubId"], "score": round(float(score), 4)})

    scores.sort(key=lambda x: x["score"], reverse=True)
    return {"scores": scores}
