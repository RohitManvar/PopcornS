"""
Downloads ML artifacts from Google Drive if they don't exist locally.
Runs automatically before the server starts (see Procfile).

Required env vars:
  MOVIE_LIST_GDRIVE_ID  - Google Drive file ID for movie_list.pkl
  SIMILARITY_GDRIVE_ID  - Google Drive file ID for similarity.pkl
"""

import os
import gdown

BASE_DIR = os.getenv("BASE_DIR", os.path.dirname(os.path.dirname(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artificats")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

files = {
    "movie_list.pkl": os.getenv("MOVIE_LIST_GDRIVE_ID"),
    "similarity.pkl": os.getenv("SIMILARITY_GDRIVE_ID"),
}

for filename, file_id in files.items():
    dest = os.path.join(ARTIFACTS_DIR, filename)
    if os.path.exists(dest):
        print(f"[artifacts] {filename} already exists, skipping download.")
        continue
    if not file_id:
        print(f"[artifacts] WARNING: no env var set for {filename}, skipping.")
        continue
    print(f"[artifacts] Downloading {filename} from Google Drive...")
    gdown.download(id=file_id, output=dest, quiet=False)
    print(f"[artifacts] {filename} downloaded.")
