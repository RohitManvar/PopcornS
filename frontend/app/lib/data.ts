import fs from "fs";
import path from "path";

export interface MovieMeta {
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
}

interface SimilarData {
  titles: string[];
  similar: Record<string, [string, number][]>;
}

// Module-level cache — persists across warm invocations on the same instance
let _meta: Record<string, MovieMeta> | null = null;
let _similar: SimilarData | null = null;

function dataDir() {
  return path.join(process.cwd(), "data");
}

export function getMeta(): Record<string, MovieMeta> {
  if (!_meta) {
    _meta = JSON.parse(fs.readFileSync(path.join(dataDir(), "movies_metadata.json"), "utf-8"));
  }
  return _meta!;
}

export function getSimilar(): SimilarData {
  if (!_similar) {
    _similar = JSON.parse(fs.readFileSync(path.join(dataDir(), "similar_movies.json"), "utf-8"));
  }
  return _similar!;
}
