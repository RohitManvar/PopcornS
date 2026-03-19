"""
Run this script ONCE before deploying to Vercel.
It converts the large pkl files into small JSON files (~3-5 MB total)
that can be committed to git and deployed with the Next.js app.

Usage:
    python generate_data.py
"""

import pickle
import json
import ast
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR  = os.path.join(BASE_DIR, "frontend", "data")
os.makedirs(OUT_DIR, exist_ok=True)

print("Loading artifacts...")
with open(os.path.join(BASE_DIR, "artificats", "movie_list.pkl"), "rb") as f:
    movies = pickle.load(f).reset_index(drop=True)

with open(os.path.join(BASE_DIR, "artificats", "similarity.pkl"), "rb") as f:
    sim = pickle.load(f)
    if hasattr(sim, "values"):
        sim = sim.values

print("Loading metadata...")
def parse_list_col(val):
    try:
        items = ast.literal_eval(val)
        return [i["name"] for i in items if "name" in i]
    except Exception:
        return []

meta_df = pd.read_csv(os.path.join(BASE_DIR, "data", "tmdb_5000_movies.csv"))
meta_df["genres_list"]    = meta_df["genres"].apply(parse_list_col)
meta_df["languages_list"] = meta_df["spoken_languages"].apply(parse_list_col)
meta_df["year"]           = pd.to_datetime(meta_df["release_date"], errors="coerce").dt.year.fillna(0).astype(int)

print("Building metadata dict...")
movies_meta: dict = {}
for _, row in meta_df.iterrows():
    runtime = row.get("runtime", None)
    movies_meta[row["title"]] = {
        "title":             row["title"],
        "overview":          str(row.get("overview", "") or ""),
        "vote_average":      round(float(row.get("vote_average", 0) or 0), 1),
        "vote_count":        int(row.get("vote_count", 0) or 0),
        "popularity":        round(float(row.get("popularity", 0) or 0), 2),
        "genres":            row["genres_list"],
        "languages":         row["languages_list"],
        "year":              int(row["year"]),
        "runtime":           int(runtime) if pd.notna(runtime) and runtime else None,
        "original_language": str(row.get("original_language", "") or ""),
    }

print("Building top-20 similarity index...")
TOP_K  = 20
titles = movies["title"].tolist()
similar: dict = {}
for i, title in enumerate(titles):
    scores = sorted(enumerate(sim[i]), key=lambda x: x[1], reverse=True)[1:TOP_K + 1]
    similar[title] = [[titles[j], round(float(score), 4)] for j, score in scores]
    if (i + 1) % 500 == 0:
        print(f"  {i + 1}/{len(titles)} done")

print("Writing JSON files...")
with open(os.path.join(OUT_DIR, "movies_metadata.json"), "w", encoding="utf-8") as f:
    json.dump(movies_meta, f, ensure_ascii=False)

with open(os.path.join(OUT_DIR, "similar_movies.json"), "w", encoding="utf-8") as f:
    json.dump({"titles": titles, "similar": similar}, f, ensure_ascii=False)

meta_size = os.path.getsize(os.path.join(OUT_DIR, "movies_metadata.json")) / 1024 / 1024
sim_size  = os.path.getsize(os.path.join(OUT_DIR, "similar_movies.json"))  / 1024 / 1024
print(f"\nDone!")
print(f"  movies_metadata.json : {meta_size:.1f} MB")
print(f"  similar_movies.json  : {sim_size:.1f} MB")
print(f"\nNow commit frontend/data/ and deploy to Vercel.")
