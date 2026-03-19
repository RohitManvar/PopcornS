import pickle
import ast
import os
import pandas as pd
import numpy as np
import requests
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from functools import lru_cache

app = FastAPI(title="Popcorn API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

OMDB_KEY  = "e80b3c2d"
TMDB_KEY  = "71b4aad1ba4567b150fcc24992459c45"
BASE_DIR  = os.getenv("BASE_DIR", os.path.dirname(os.path.dirname(__file__)))


# ── Load artifacts ────────────────────────────────────────────────────────────

def load_artifacts():
    with open(os.path.join(BASE_DIR, "artificats", "movie_list.pkl"), "rb") as f:
        movies = pickle.load(f).reset_index(drop=True)
    with open(os.path.join(BASE_DIR, "artificats", "similarity.pkl"), "rb") as f:
        sim = pickle.load(f)
        if hasattr(sim, "values"):
            sim = sim.values
    return movies, sim


def parse_list_col(val):
    try:
        items = ast.literal_eval(val)
        return [i["name"] for i in items if "name" in i]
    except Exception:
        return []


def load_metadata():
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "tmdb_5000_movies.csv"))
    df["genres_list"]    = df["genres"].apply(parse_list_col)
    df["languages_list"] = df["spoken_languages"].apply(parse_list_col)
    df["year"]           = pd.to_datetime(df["release_date"], errors="coerce").dt.year.fillna(0).astype(int)
    return df[["title", "overview", "vote_average", "vote_count", "popularity",
               "genres_list", "languages_list", "year", "runtime",
               "original_language"]]


movies_df, similarity = load_artifacts()
meta_df = load_metadata()

# ── Poster cache ──────────────────────────────────────────────────────────────

@lru_cache(maxsize=2000)
def fetch_poster(title: str) -> Optional[str]:
    try:
        res = requests.get(
            f"http://www.omdbapi.com/?t={title}&apikey={OMDB_KEY}",
            timeout=6,
        )
        data = res.json()
        if data.get("Response") == "True" and data.get("Poster") not in (None, "N/A"):
            return data["Poster"]
    except Exception:
        pass
    return None


def enrich(title: str) -> dict:
    row = meta_df[meta_df["title"] == title]
    if row.empty:
        return {"title": title}
    r = row.iloc[0]
    runtime = r.get("runtime", None)
    return {
        "title":             title,
        "overview":          r.get("overview", ""),
        "vote_average":      round(float(r.get("vote_average", 0)), 1),
        "vote_count":        int(r.get("vote_count", 0)),
        "popularity":        round(float(r.get("popularity", 0)), 2),
        "genres":            r.get("genres_list", []),
        "languages":         r.get("languages_list", []),
        "year":              int(r.get("year", 0)),
        "runtime":           int(runtime) if pd.notna(runtime) and runtime else None,
        "original_language": r.get("original_language", ""),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/movies")
def list_movies(
    q:        str  = Query("", description="Search query"),
    genre:    str  = Query("", description="Filter by genre"),
    language: str  = Query("", description="Filter by original_language code"),
    year_min: int  = Query(0,  description="Min release year"),
    year_max: int  = Query(9999, description="Max release year"),
    min_rating: float = Query(0.0, description="Min vote_average"),
):
    titles = movies_df["title"].tolist()

    # Apply metadata filters
    filtered = meta_df.copy()
    if q:
        filtered = filtered[filtered["title"].str.contains(q, case=False, na=False)]
    if genre:
        filtered = filtered[filtered["genres_list"].apply(lambda g: genre in g)]
    if language:
        filtered = filtered[filtered["original_language"] == language]
    if year_min:
        filtered = filtered[filtered["year"] >= year_min]
    if year_max < 9999:
        filtered = filtered[filtered["year"] <= year_max]
    if min_rating > 0:
        filtered = filtered[filtered["vote_average"] >= min_rating]

    filtered_titles = set(filtered["title"].tolist())
    result = [t for t in titles if t in filtered_titles]
    return {"movies": result, "total": len(result)}


@app.get("/api/filters")
def get_filters():
    genres   = sorted({g for gl in meta_df["genres_list"] for g in gl})
    languages = sorted(meta_df["original_language"].dropna().unique().tolist())
    year_min  = int(meta_df["year"].min())
    year_max  = int(meta_df["year"].max())
    return {
        "genres":    genres,
        "languages": languages,
        "year_min":  year_min,
        "year_max":  year_max,
    }


@app.get("/api/movie/{title}")
def get_movie(title: str):
    data = enrich(title)
    if not data.get("overview"):
        raise HTTPException(status_code=404, detail="Movie not found")
    data["poster"] = fetch_poster(title)
    return data


@app.get("/api/recommend/{title}")
def recommend(
    title:   str,
    n:       int   = Query(10, ge=5, le=20),
    sort_by: str   = Query("similarity"),   # similarity | rating | popularity | year
):
    try:
        idx = movies_df[movies_df["title"] == title].index[0]
    except IndexError:
        raise HTTPException(status_code=404, detail=f"'{title}' not found in model")

    scores  = list(enumerate(similarity[idx]))
    scores  = sorted(scores, key=lambda x: x[1], reverse=True)[1:n + 1]

    results = []
    for i, score in scores:
        t    = movies_df.iloc[i]["title"]
        data = enrich(t)
        data["similarity"] = round(float(score), 4)
        results.append(data)

    if sort_by == "rating":
        results.sort(key=lambda x: x.get("vote_average", 0), reverse=True)
    elif sort_by == "popularity":
        results.sort(key=lambda x: x.get("popularity", 0), reverse=True)
    elif sort_by == "year":
        results.sort(key=lambda x: x.get("year", 0), reverse=True)

    # Fetch posters in result (cached)
    for r in results:
        r["poster"] = fetch_poster(r["title"])

    return {"movie": title, "recommendations": results}


@app.get("/api/poster/{title}")
def get_poster(title: str):
    return {"poster": fetch_poster(title)}


@app.get("/api/trending")
def trending(
    sort: str = Query("popularity"),  # popularity | rating
    n:    int  = Query(10, ge=5, le=20),
):
    df = meta_df.copy()
    if sort == "rating":
        df = df[df["vote_count"] >= 100]
        df = df.nlargest(n, "vote_average")
    else:
        df = df.nlargest(n, "popularity")
    results = []
    for _, row in df.iterrows():
        data = enrich(row["title"])
        data["poster"] = fetch_poster(row["title"])
        results.append(data)
    return {"movies": results}


@lru_cache(maxsize=500)
def fetch_trailer(title: str) -> Optional[str]:
    try:
        search = requests.get(
            "https://api.themoviedb.org/3/search/movie",
            params={"api_key": TMDB_KEY, "query": title},
            timeout=6,
        )
        results = search.json().get("results", [])
        if not results:
            return None
        movie_id = results[0]["id"]
        videos = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}/videos",
            params={"api_key": TMDB_KEY},
            timeout=6,
        )
        items = videos.json().get("results", [])
        trailer = next(
            (v for v in items if v["type"] == "Trailer" and v["site"] == "YouTube"),
            None,
        )
        if trailer:
            return f"https://www.youtube.com/embed/{trailer['key']}"
    except Exception:
        pass
    return None


@app.get("/api/trailer/{title}")
def get_trailer(title: str):
    return {"trailer": fetch_trailer(title)}
