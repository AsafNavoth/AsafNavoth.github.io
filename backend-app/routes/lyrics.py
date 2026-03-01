from flask import Blueprint, Response, jsonify, request
import requests
from requests.exceptions import HTTPError

from anki_deck import (
    NoDefinitionsError,
    NoVocabularyCardsError,
    build_anki_deck_from_lyrics_data,
    build_anki_notes_json,
)
from config import LRCLIB_BASE_URL, MAX_LYRICS_CHARS
from decorators import log_route
from lyrics_tokenizer import JamdictNotAvailableError, extract_lyrics_text

lyrics_bp = Blueprint('lyrics', __name__)


def _validate_lyrics_request(lyrics_data):
    """Validate lyrics request body. Returns (response, status) if invalid, else None."""
    if not lyrics_data:
        return jsonify({'error': 'Request body must contain lyrics data'}), 400
    lyrics_text = extract_lyrics_text(lyrics_data)
    if len(lyrics_text) > MAX_LYRICS_CHARS:
        return jsonify({'error': f'Lyrics text is too long. Max {MAX_LYRICS_CHARS} characters.'}), 413
    return None


def _handle_anki_errors(exception):
    """Handle JamdictNotAvailableError, NoVocabularyCardsError, NoDefinitionsError. Returns (response, status) or None."""
    if isinstance(exception, JamdictNotAvailableError):
        return jsonify({'error': str(exception)}), 503
    if isinstance(exception, (NoVocabularyCardsError, NoDefinitionsError)):
        return jsonify({'error': str(exception)}), 422
    return None


@lyrics_bp.route('/lyrics/<int:lyrics_id>')
@log_route
def get_lyrics(lyrics_id):
    lrclib_response = requests.get(
        f'{LRCLIB_BASE_URL}/api/get/{lyrics_id}',
        timeout=10,
    )

    try:
        lrclib_response.raise_for_status()
    except HTTPError:
        return jsonify(lrclib_response.json()), lrclib_response.status_code

    data = lrclib_response.json()
    return jsonify(data)


@lyrics_bp.route('/lyrics/anki', methods=['POST'])
@log_route
def export_anki():
    """Export lyrics vocabulary as an Anki deck (.apkg file).
    Accepts lyrics data (plainLyrics/syncedLyrics, trackName, artistName).
    Tokenizes on the backend when building the deck."""
    lyrics_data = request.get_json()
    if invalid := _validate_lyrics_request(lyrics_data):
        return invalid

    try:
        apkg_bytes = build_anki_deck_from_lyrics_data(lyrics_data)
    except (JamdictNotAvailableError, NoVocabularyCardsError, NoDefinitionsError) as e:
        if error_response := _handle_anki_errors(e):
            return error_response
        raise

    return Response(
        apkg_bytes,
        mimetype='application/octet-stream',
        headers={'Content-Disposition': 'attachment; filename="utanki.apkg"'},
    )


@lyrics_bp.route('/lyrics/anki/notes', methods=['POST'])
@log_route
def export_anki_notes():
    """Export lyrics vocabulary as JSON for AnkiConnect.
    Accepts lyrics data (plainLyrics/syncedLyrics, trackName, artistName).
    Returns deckName, modelName, and notes with Word/Definition fields."""
    lyrics_data = request.get_json()
    if invalid := _validate_lyrics_request(lyrics_data):
        return invalid

    try:
        result = build_anki_notes_json(lyrics_data)
        return jsonify(result)
    except (JamdictNotAvailableError, NoVocabularyCardsError, NoDefinitionsError) as e:
        if error_response := _handle_anki_errors(e):
            return error_response
        raise
