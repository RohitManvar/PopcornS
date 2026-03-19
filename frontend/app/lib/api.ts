import axios from "axios";
import type { Movie, FiltersData, RecommendResponse, MoviesResponse } from "../types";

// On Vercel: API routes are on the same domain, baseURL is empty string.
// Locally with FastAPI backend: set NEXT_PUBLIC_API_URL=http://localhost:8000
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
});

export async function fetchFilters(): Promise<FiltersData> {
  const { data } = await api.get<FiltersData>("/api/filters");
  return data;
}

export async function fetchMovies(params: {
  q?: string;
  genre?: string;
  language?: string;
  year_min?: number;
  year_max?: number;
  min_rating?: number;
}): Promise<MoviesResponse> {
  const { data } = await api.get<MoviesResponse>("/api/movies", { params });
  return data;
}

export async function fetchMovie(title: string): Promise<Movie> {
  const { data } = await api.get<Movie>(`/api/movie/${encodeURIComponent(title)}`);
  return data;
}

export async function fetchRecommendations(
  title: string,
  n: number,
  sort_by: string
): Promise<RecommendResponse> {
  const { data } = await api.get<RecommendResponse>(
    `/api/recommend/${encodeURIComponent(title)}`,
    { params: { n, sort_by } }
  );
  return data;
}

export async function fetchTrending(sort = "popularity"): Promise<{ movies: Movie[] }> {
  const { data } = await api.get("/api/trending", { params: { sort } });
  return data;
}

export async function fetchTrailer(title: string): Promise<{ trailer: string | null }> {
  const { data } = await api.get(`/api/trailer/${encodeURIComponent(title)}`);
  return data;
}
