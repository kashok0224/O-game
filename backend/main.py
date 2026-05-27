from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this to your Vercel URL before deploying
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "scores.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


init_db()


class ScoreSubmission(BaseModel):
    name: str
    score: int


@app.post("/scores")
def save_score(submission: ScoreSubmission):
    name = submission.name.strip()[:32]  # cap length, avoid junk input
    score = max(0, min(submission.score, 999999))  # clamp to sane range
    with get_db() as conn:
        conn.execute("INSERT INTO scores (name, score) VALUES (?, ?)", (name, score))
        conn.commit()
    return {"status": "ok"}


@app.get("/scores")
def get_top_scores():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 10"
        ).fetchall()
    return [dict(row) for row in rows]
