import logging

from flask import Blueprint, Response, jsonify, request
import requests
from requests.exceptions import HTTPError

from anki_deck import build_anki_deck_from_lyrics_data
from config import LRCLIB_BASE_URL
from lyrics_tokenizer import JamdictNotAvailableError

logger = logging.getLogger(__name__)
lyrics_bp = Blueprint('lyrics', __name__)


@lyrics_bp.route('/lyrics/<int:lyrics_id>')
def get_lyrics(lyrics_id):
    logger.info("get_lyrics: fetching lyrics_id=%s", lyrics_id)
    lrclib_response = requests.get(
        f'{LRCLIB_BASE_URL}/api/get/{lyrics_id}',
        timeout=10,
    )

    try:
        lrclib_response.raise_for_status()
    except HTTPError:
        logger.warning("get_lyrics: lrclib returned %s for lyrics_id=%s", lrclib_response.status_code, lyrics_id)
        return jsonify(lrclib_response.json()), lrclib_response.status_code

    data = lrclib_response.json()
    has_plain = bool((data.get('plainLyrics') or '').strip())
    has_synced = bool((data.get('syncedLyrics') or '').strip())
    logger.info("get_lyrics: success lyrics_id=%s track=%r plain=%s synced=%s", lyrics_id, data.get('trackName'), has_plain, has_synced)
    return jsonify(data)


@lyrics_bp.route('/lyrics/anki', methods=['POST'])
def export_anki():
    """Export lyrics vocabulary as an Anki deck (.apkg file).
    Accepts lyrics data (plainLyrics/syncedLyrics, trackName, artistName).
    Tokenizes on the backend when building the deck."""
    lyrics_data = request.get_json()
    if not lyrics_data:
        logger.warning("export_anki: no request body")
        return jsonify({'error': 'Request body must contain lyrics data'}), 400

    track_name = lyrics_data.get('trackName', 'Unknown')
    logger.info("export_anki: building deck track=%r keys=%s", track_name, list(lyrics_data.keys()))

    try:
        apkg_bytes = build_anki_deck_from_lyrics_data(lyrics_data)
        logger.info("export_anki: success track=%r apkg_size=%d", track_name, len(apkg_bytes))
    except JamdictNotAvailableError as e:
        logger.error("export_anki: jamdict unavailable track=%r err=%s", track_name, e)
        return jsonify({'error': str(e)}), 503
    except ValueError as e:
        err = str(e)
        if 'No definitions found' in err or 'No vocabulary cards' in err:
            logger.warning("export_anki: %s track=%r", err, track_name)
            return jsonify({'error': err}), 422
        logger.exception("export_anki: ValueError track=%r", track_name)
        raise

    filename = f'{track_name.replace("/", "-")}.apkg'

    return Response(
        apkg_bytes,
        mimetype='application/octet-stream',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )
