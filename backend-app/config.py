import os

LRCLIB_BASE_URL = 'https://lrclib.net'
LRCLIB_ALLOWED_SEARCH_PARAMS = {'q', 'track_name', 'artist_name', 'album_name'}

# Jamdict database path. Default: data/jamdict.db relative to backend-app.
# Override with JAMDICT_DB_PATH env var for server deployment (e.g. /app/data/jamdict.db).
JAMDICT_DB_PATH = os.environ.get(
    'JAMDICT_DB_PATH',
    os.path.join(os.path.dirname(__file__), 'data', 'jamdict.db'),
)
