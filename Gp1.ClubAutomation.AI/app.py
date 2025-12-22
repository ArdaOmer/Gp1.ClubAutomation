from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


class SurveyAnswers(BaseModel):
    answers: dict


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "gp1-ai"}


@app.post("/recommend-clubs")
def recommend_clubs(payload: SurveyAnswers):
    return {
        "recommended_clubs": [
            {"id": "club-ai", "name": "AI Kulübü", "score": 0.92},
            {"id": "club-cyber", "name": "Siber Güvenlik Kulübü", "score": 0.81},
        ]
    }
