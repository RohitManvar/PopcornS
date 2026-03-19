from tenacity import retry, wait_fixed, stop_after_attempt
import pickle as p
import streamlit as st
import requests as r
import numpy as np
import pandas as pd
import ast

# ── Page Config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="CineMatch – Movie Recommender",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ──────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* ---- Base ---- */
[data-testid="stAppViewContainer"] {
    background: linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%);
    min-height: 100vh;
}
[data-testid="stSidebar"] {
    background: rgba(10,10,30,0.95);
    border-right: 1px solid rgba(255,255,255,0.07);
}
[data-testid="stSidebar"] .block-container { padding-top: 1rem; }

/* ---- Header ---- */
.main-title {
    font-size: 2.8rem;
    font-weight: 900;
    text-align: center;
    background: linear-gradient(90deg, #f7971e, #ffd200, #f7971e);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 4s linear infinite;
    margin-bottom: 4px;
    letter-spacing: -1px;
}
@keyframes shine { to { background-position: 200% center; } }
.subtitle {
    text-align: center;
    font-size: 1rem;
    color: #666;
    margin-bottom: 28px;
    letter-spacing: 2px;
    text-transform: uppercase;
}

/* ---- Movie Cards ---- */
.movie-card {
    text-align: center;
    padding: 10px 8px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    margin-bottom: 16px;
    transition: all 0.25s ease;
    height: 100%;
}
.movie-card:hover {
    border-color: rgba(247,151,30,0.4);
    box-shadow: 0 8px 28px rgba(247,151,30,0.15);
    transform: translateY(-4px);
}
.movie-card-title {
    font-size: 0.82rem;
    font-weight: 600;
    margin: 8px 0 6px;
    color: #e0e0e0;
    line-height: 1.3;
    min-height: 32px;
}
.rating-badge {
    display: inline-block;
    background: linear-gradient(135deg, #f7971e, #ffd200);
    color: #000;
    font-weight: 800;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 20px;
    margin: 2px;
}
.year-badge {
    display: inline-block;
    background: rgba(255,255,255,0.1);
    color: #aaa;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 20px;
    margin: 2px;
}
.genre-badge {
    display: inline-block;
    background: rgba(247,151,30,0.12);
    color: #f7971e;
    border: 1px solid rgba(247,151,30,0.25);
    font-size: 0.62rem;
    padding: 1px 6px;
    border-radius: 8px;
    margin: 1px;
}

/* ---- Section Headers ---- */
.section-header {
    font-size: 1.3rem;
    font-weight: 700;
    color: #ffd200;
    margin: 28px 0 16px;
    padding-left: 14px;
    border-left: 4px solid #ffd200;
}

/* ---- Detail Panel ---- */
.detail-panel {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 18px;
    padding: 22px;
    margin-bottom: 24px;
}
.detail-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 6px;
}
.detail-overview {
    color: #aaa;
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 10px 0;
}
.stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
.stat-box {
    flex: 1;
    min-width: 80px;
    background: rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 10px 14px;
    text-align: center;
}
.stat-label { font-size: 0.65rem; color: #666; text-transform: uppercase; letter-spacing: 1px; display: block; }
.stat-value { font-size: 1.1rem; font-weight: 700; color: #ffd200; display: block; }

/* ---- Watchlist ---- */
.watchlist-pill {
    display: inline-block;
    background: rgba(247,151,30,0.12);
    border: 1px solid rgba(247,151,30,0.3);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.8rem;
    color: #f7971e;
    margin: 3px 3px;
}

/* ---- Sidebar labels ---- */
.sidebar-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 4px;
}

/* ---- No poster placeholder ---- */
.no-poster {
    background: rgba(255,255,255,0.04);
    border: 1px dashed rgba(255,255,255,0.1);
    border-radius: 10px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    font-size: 2rem;
}

/* ---- Streamlit overrides ---- */
div[data-testid="stSelectbox"] label,
div[data-testid="stMultiSelect"] label,
div[data-testid="stSlider"] label { color: #ccc !important; font-size: 0.88rem !important; }
</style>
""", unsafe_allow_html=True)

# ── Helpers ──────────────────────────────────────────────────────────────────

OMDB_KEY = "e80b3c2d"

@retry(wait=wait_fixed(2), stop=stop_after_attempt(3))
def fetch_poster(movie_title: str):
    """Fetch poster URL from OMDb API."""
    try:
        res = r.get(
            f"http://www.omdbapi.com/?t={movie_title}&apikey={OMDB_KEY}",
            timeout=6,
        )
        data = res.json()
        if data.get("Response") == "True" and data.get("Poster") not in (None, "N/A"):
            return data["Poster"]
    except Exception:
        pass
    return None


def parse_list_col(val):
    """Parse a stringified list of dicts → list of name strings."""
    try:
        items = ast.literal_eval(val)
        return [i["name"] for i in items if "name" in i]
    except Exception:
        return []


@st.cache_data(show_spinner=False)
def load_metadata():
    """Load TMDB CSV and return an enriched DataFrame."""
    try:
        df = pd.read_csv("data/tmdb_5000_movies.csv")
        df["genres_list"]    = df["genres"].apply(parse_list_col)
        df["languages_list"] = df["spoken_languages"].apply(parse_list_col)
        df["year"]           = pd.to_datetime(df["release_date"], errors="coerce").dt.year.fillna(0).astype(int)
        df["original_language_name"] = df["original_language"].str.upper()
        return df[["title", "overview", "vote_average", "vote_count",
                   "popularity", "genres_list", "languages_list",
                   "year", "runtime", "original_language",
                   "original_language_name"]]
    except Exception:
        return pd.DataFrame()


@st.cache_resource(show_spinner=False)
def load_artifacts():
    try:
        with open("artificats/movie_list.pkl", "rb") as f:
            movies = p.load(f).reset_index(drop=True)
        with open("artificats/similarity.pkl", "rb") as f:
            sim = p.load(f)
            if hasattr(sim, "values"):
                sim = sim.values
        return movies, sim
    except Exception as e:
        st.error(f"Failed to load model artifacts: {e}")
        return None, None


def get_meta(title: str, meta_df: pd.DataFrame) -> dict:
    """Return metadata dict for a movie title."""
    row = meta_df[meta_df["title"] == title]
    if row.empty:
        return {}
    return row.iloc[0].to_dict()


def recommend(movie: str, movies_df, sim_matrix, meta_df: pd.DataFrame, n: int, sort_by: str):
    """Return top-n recommended movies with metadata."""
    try:
        idx = movies_df[movies_df["title"] == movie].index[0]
    except IndexError:
        st.error(f"'{movie}' not found in the recommendation model.")
        return []

    scores = list(enumerate(sim_matrix[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)[1:n + 1]

    results = []
    for i, score in scores:
        title = movies_df.iloc[i]["title"]
        meta  = get_meta(title, meta_df)
        results.append({"title": title, "similarity": round(score, 3), **meta})

    if sort_by == "⭐ Rating":
        results.sort(key=lambda x: x.get("vote_average", 0), reverse=True)
    elif sort_by == "🔥 Popularity":
        results.sort(key=lambda x: x.get("popularity", 0), reverse=True)
    elif sort_by == "📅 Year (Newest)":
        results.sort(key=lambda x: x.get("year", 0), reverse=True)

    return results


# ── Load Data ────────────────────────────────────────────────────────────────
movies_df, similarity = load_artifacts()
meta_df = load_metadata()

# ── Session State ────────────────────────────────────────────────────────────
if "watchlist" not in st.session_state:
    st.session_state.watchlist = []

# ── Header ───────────────────────────────────────────────────────────────────
st.markdown("<div class='main-title'>🎬 CineMatch</div>", unsafe_allow_html=True)
st.markdown("<div class='subtitle'>Intelligent Movie Discovery Engine</div>", unsafe_allow_html=True)

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🎛️ Filters")
    st.markdown("---")

    # Genre filter
    all_genres = sorted({g for genres in meta_df["genres_list"] for g in genres}) if not meta_df.empty else []
    selected_genres = st.multiselect("🎭 Genres", all_genres, placeholder="All genres")

    st.markdown("")

    # Language filter
    all_langs = sorted(meta_df["original_language"].dropna().unique().tolist()) if not meta_df.empty else []
    lang_options = ["All"] + all_langs
    selected_lang = st.selectbox("🌐 Original Language", lang_options)

    st.markdown("")

    # Year range filter
    min_year = int(meta_df["year"].min()) if not meta_df.empty else 1900
    max_year = int(meta_df["year"].max()) if not meta_df.empty else 2024
    year_range = st.slider("📅 Release Year", min_year, max_year, (1990, max_year))

    st.markdown("")

    # Rating filter
    min_rating = st.slider("⭐ Min Rating (0–10)", 0.0, 10.0, 0.0, step=0.5)

    st.markdown("---")
    st.markdown("## ⚙️ Options")

    num_recs = st.slider("🔢 Recommendations", 5, 20, 10, step=5)

    sort_by = st.selectbox(
        "📊 Sort By",
        ["🎯 Similarity", "⭐ Rating", "🔥 Popularity", "📅 Year (Newest)"],
    )

    st.markdown("---")

    # Watchlist in sidebar
    st.markdown("## 🍿 My Watchlist")
    if st.session_state.watchlist:
        for wm in st.session_state.watchlist:
            col_w1, col_w2 = st.columns([5, 1])
            with col_w1:
                st.markdown(f"<div class='watchlist-pill'>🎬 {wm}</div>", unsafe_allow_html=True)
            with col_w2:
                if st.button("✕", key=f"rm_{wm}", help="Remove"):
                    st.session_state.watchlist.remove(wm)
                    st.rerun()
        if st.button("🗑️ Clear All", use_container_width=True):
            st.session_state.watchlist = []
            st.rerun()
    else:
        st.markdown("<span style='color:#555;font-size:0.85rem;'>No movies saved yet.</span>", unsafe_allow_html=True)

# ── Build filtered movie list ─────────────────────────────────────────────────
if movies_df is not None:
    all_titles = movies_df["title"].tolist()

    if not meta_df.empty:
        # Apply filters to restrict the searchable list
        filtered_meta = meta_df.copy()
        if selected_genres:
            filtered_meta = filtered_meta[
                filtered_meta["genres_list"].apply(
                    lambda g: any(x in g for x in selected_genres)
                )
            ]
        if selected_lang != "All":
            filtered_meta = filtered_meta[filtered_meta["original_language"] == selected_lang]
        filtered_meta = filtered_meta[
            (filtered_meta["year"] >= year_range[0]) & (filtered_meta["year"] <= year_range[1])
        ]
        filtered_meta = filtered_meta[filtered_meta["vote_average"] >= min_rating]
        filtered_titles = set(filtered_meta["title"].tolist())
        display_list = [t for t in all_titles if t in filtered_titles]
    else:
        display_list = all_titles

    if not display_list:
        st.warning("⚠️ No movies match the selected filters. Try widening your criteria.")
        display_list = all_titles

else:
    display_list = []

# ── Search & Select ───────────────────────────────────────────────────────────
col_search, col_btn = st.columns([4, 1])
with col_search:
    selected_movie = st.selectbox(
        "🔍 Search or select a movie",
        display_list,
        help="Type to search. Filters in the sidebar narrow this list.",
    )
with col_btn:
    st.markdown("<br>", unsafe_allow_html=True)
    go = st.button("✨ Recommend", use_container_width=True, type="primary")

# ── Movie Detail Panel ────────────────────────────────────────────────────────
if selected_movie and not meta_df.empty:
    meta = get_meta(selected_movie, meta_df)
    if meta:
        st.markdown("<div class='section-header'>📋 Selected Movie</div>", unsafe_allow_html=True)
        with st.container():
            d_col1, d_col2 = st.columns([1, 3])
            with d_col1:
                with st.spinner("Loading poster…"):
                    poster = fetch_poster(selected_movie)
                if poster:
                    st.image(poster, use_container_width=True)
                else:
                    st.markdown("<div class='no-poster'>🎬</div>", unsafe_allow_html=True)

                # Watchlist toggle
                in_wl = selected_movie in st.session_state.watchlist
                if in_wl:
                    if st.button("✅ In Watchlist", use_container_width=True):
                        st.session_state.watchlist.remove(selected_movie)
                        st.rerun()
                else:
                    if st.button("➕ Add to Watchlist", use_container_width=True):
                        st.session_state.watchlist.append(selected_movie)
                        st.rerun()

            with d_col2:
                st.markdown(f"<div class='detail-title'>{selected_movie}</div>", unsafe_allow_html=True)

                # Genre badges
                if meta.get("genres_list"):
                    badges = "".join(
                        f"<span class='genre-badge'>{g}</span>"
                        for g in meta["genres_list"]
                    )
                    st.markdown(badges, unsafe_allow_html=True)

                # Stats row
                rating  = meta.get("vote_average", "—")
                year    = meta.get("year", "—")
                runtime = meta.get("runtime", "—")
                lang    = str(meta.get("original_language", "—")).upper()

                st.markdown(f"""
                <div class='stat-row'>
                    <div class='stat-box'>
                        <span class='stat-label'>Rating</span>
                        <span class='stat-value'>⭐ {rating}</span>
                    </div>
                    <div class='stat-box'>
                        <span class='stat-label'>Year</span>
                        <span class='stat-value'>{year}</span>
                    </div>
                    <div class='stat-box'>
                        <span class='stat-label'>Runtime</span>
                        <span class='stat-value'>{int(runtime) if str(runtime).replace('.','').isdigit() else '—'} min</span>
                    </div>
                    <div class='stat-box'>
                        <span class='stat-label'>Language</span>
                        <span class='stat-value'>{lang}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                # Overview
                overview = meta.get("overview", "")
                if overview:
                    st.markdown(
                        f"<div class='detail-overview'>{overview}</div>",
                        unsafe_allow_html=True,
                    )

# ── Recommendations ───────────────────────────────────────────────────────────
if go:
    if not display_list:
        st.error("No movies available.")
    elif movies_df is None or similarity is None:
        st.error("Model artifacts not loaded.")
    else:
        st.markdown(
            f"<div class='section-header'>🎯 Top {num_recs} Recommendations for <em>{selected_movie}</em></div>",
            unsafe_allow_html=True,
        )
        with st.spinner("Finding the best matches…"):
            results = recommend(selected_movie, movies_df, similarity, meta_df, num_recs, sort_by)

        if not results:
            st.warning("No recommendations found.")
        else:
            COLS = 5
            for row_start in range(0, len(results), COLS):
                cols = st.columns(COLS)
                for col_i, col in enumerate(cols):
                    idx = row_start + col_i
                    if idx >= len(results):
                        break
                    movie_data = results[idx]
                    title  = movie_data["title"]
                    rating = movie_data.get("vote_average", "")
                    year   = movie_data.get("year", "")
                    genres = movie_data.get("genres_list", [])[:2]
                    sim_score = movie_data.get("similarity", "")

                    with col:
                        poster_url = fetch_poster(title)
                        rating_html = f"<span class='rating-badge'>⭐ {rating}</span>" if rating else ""
                        year_html   = f"<span class='year-badge'>{year}</span>" if year and year != 0 else ""
                        genres_html = "".join(f"<span class='genre-badge'>{g}</span>" for g in genres)
                        sim_html    = f"<span class='year-badge'>🎯 {sim_score}</span>" if sim_score else ""

                        poster_section = (
                            f'<img src="{poster_url}" style="width:100%;border-radius:10px;object-fit:cover;max-height:230px;">'
                            if poster_url
                            else "<div style='height:180px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:rgba(255,255,255,0.03);border-radius:10px;'>🎬</div>"
                        )

                        st.markdown(f"""
                        <div class='movie-card'>
                            {poster_section}
                            <div class='movie-card-title'>{title}</div>
                            {rating_html}{year_html}
                            <br>{genres_html}
                            <br>{sim_html}
                        </div>
                        """, unsafe_allow_html=True)

                        # ── Button row: Info + Watchlist ──
                        btn_c1, btn_c2 = st.columns(2)
                        with btn_c1:
                            with st.popover("📋 Info", use_container_width=True):
                                # Fetch full meta for this recommendation
                                rmeta = get_meta(title, meta_df)
                                if poster_url:
                                    st.image(poster_url, use_container_width=True)
                                st.markdown(f"### {title}")
                                if rmeta.get("genres_list"):
                                    st.markdown(" ".join(
                                        f"`{g}`" for g in rmeta["genres_list"]
                                    ))
                                r_rating  = rmeta.get("vote_average", "—")
                                r_year    = rmeta.get("year", "—")
                                r_runtime = rmeta.get("runtime", "—")
                                r_lang    = str(rmeta.get("original_language", "—")).upper()
                                st.markdown(f"""
| Field | Value |
|-------|-------|
| ⭐ Rating | **{r_rating} / 10** |
| 📅 Year | {r_year} |
| ⏱ Runtime | {int(r_runtime) if str(r_runtime).replace('.','').isdigit() else '—'} min |
| 🌐 Language | {r_lang} |
| 🎯 Similarity | {sim_score} |
                                """)
                                overview = rmeta.get("overview", "")
                                if overview:
                                    st.markdown("**Overview**")
                                    st.markdown(f"_{overview}_")

                        with btn_c2:
                            in_wl = title in st.session_state.watchlist
                            btn_label = "✅" if in_wl else "➕"
                            btn_help  = "Remove from watchlist" if in_wl else "Add to watchlist"
                            if st.button(btn_label, key=f"wl_{title}_{idx}", help=btn_help, use_container_width=True):
                                if in_wl:
                                    st.session_state.watchlist.remove(title)
                                else:
                                    st.session_state.watchlist.append(title)
                                st.rerun()

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center;color:#444;font-size:0.8rem;'>Built with Streamlit · Powered by TMDB &amp; OMDb · Content-Based Filtering</div>",
    unsafe_allow_html=True,
)
