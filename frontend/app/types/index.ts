export interface Movie {
  title: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genres: string[];
  languages: string[];
  year: number;
  runtime: number | null;
  original_language: string;
  poster?: string | null;
  similarity?: number;
}

export interface FiltersData {
  genres: string[];
  languages: string[];
  year_min: number;
  year_max: number;
}

export interface RecommendResponse {
  movie: string;
  recommendations: Movie[];
}

export interface MoviesResponse {
  movies: string[];
  total: number;
}

export interface FilterState {
  genre: string;
  language: string;
  yearMin: number;
  yearMax: number;
  minRating: number;
  numRecs: number;
  sortBy: string;
}
