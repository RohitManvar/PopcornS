# 🍿 Popcorn — Intelligent Movie Discovery

A machine learning-powered movie recommender built with **Next.js + TypeScript** (frontend) and **FastAPI** (backend).
Suggests movies based on content-based filtering, fetches posters from **OMDb API**, and trailers from **TMDB API**.

---

## Features

- 🎯 **Smart Recommendations** — Content-based filtering using cosine similarity on 4800+ movies
- 🔥 **Trending Now** — Home page shows top popular movies before any search
- 🎲 **Surprise Me** — Random movie picker button for when you can't decide
- 🎬 **Trailer Button** — Watch YouTube trailers directly in-app via TMDB API
- 🖼️ **Movie Posters** — Fetched dynamically from OMDb API
- 🗂️ **Genre Quick-Filter** — Click any genre badge to instantly filter by it
- 🔍 **Search with Dropdown** — Autocomplete search with keyboard support (`/` to focus, `Esc` to close)
- 🎛️ **Filters** — Filter by genre, language, year range, and minimum rating
- ⚙️ **Options** — Control number of recommendations (5–20) and sort order (similarity / rating / popularity / year)
- 🍿 **Watchlist** — Save movies locally, export as `.txt`, shown in sidebar
- 🕒 **Recently Viewed** — Automatically tracks the last 10 movies you opened
- 🔗 **Share** — Copy a link to any movie with one click
- 🔔 **Toast Notifications** — Feedback for every watchlist/share action
- 💀 **Skeleton Loading** — Smooth placeholder cards while content loads
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Data Fetching | TanStack React Query, Axios |
| Backend | FastAPI, Uvicorn |
| ML | Scikit-learn (CountVectorizer + Cosine Similarity) |
| Data | TMDB Dataset (4800+ movies) |
| Posters | OMDb API |
| Trailers | TMDB API |
| Persistence | localStorage (watchlist, recently viewed) |

---

## Project Structure

```
Movie-Recommender-System/
├── backend/
│   ├── main.py               # FastAPI app (all endpoints)
│   ├── download_artifacts.py # Downloads ML models from Google Drive
│   ├── requirements.txt
│   ├── Procfile              # Railway start command
│   └── railway.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Home page
│   │   ├── movie/[title]/page.tsx    # Movie detail page
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── RecommendationGrid.tsx
│   │   │   ├── MovieCard.tsx
│   │   │   ├── MovieCardSkeleton.tsx
│   │   │   ├── TrailerModal.tsx
│   │   │   └── Toast.tsx
│   │   └── lib/api.ts
│   └── next.config.ts
├── artificats/
│   ├── movie_list.pkl        # Processed movie list
│   └── similarity.pkl        # Cosine similarity matrix (177 MB)
└── data/
    ├── tmdb_5000_movies.csv
    └── tmdb_5000_credits.csv
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/RohitManvar/movie-recommendation-system.git
cd Movie-Recommender-System-main
```

### 2. Generate ML artifacts (first time only)

Open and run `Movie Recommender.ipynb` in Jupyter. This creates:
- `artificats/movie_list.pkl`
- `artificats/similarity.pkl`

### 3. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/movies` | List movies with optional filters |
| GET | `/api/filters` | Available genres, languages, year range |
| GET | `/api/movie/{title}` | Single movie details |
| GET | `/api/recommend/{title}` | Recommendations for a movie |
| GET | `/api/trending` | Top movies by popularity or rating |
| GET | `/api/trailer/{title}` | YouTube trailer URL via TMDB |
| GET | `/api/poster/{title}` | Movie poster URL via OMDb |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) — set root directory to `frontend/` |
| Backend | [Railway](https://railway.app) — set root directory to `backend/` |

### Environment variables

**Backend (Railway):**
```
MOVIE_LIST_GDRIVE_ID=<Google Drive file ID for movie_list.pkl>
SIMILARITY_GDRIVE_ID=<Google Drive file ID for similarity.pkl>
ALLOWED_ORIGINS=https://your-app.vercel.app
BASE_DIR=/app
```

**Frontend (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

> **Note:** `similarity.pkl` is 177 MB and cannot be pushed to GitHub. Upload it to Google Drive and set the env vars above so Railway downloads it on startup.

---

## Dataset

[TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) — 4800+ movies with genres, cast, crew, keywords, and ratings.
