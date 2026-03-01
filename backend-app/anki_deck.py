"""Generate Anki decks from tokenized lyrics with jamdict definitions."""

import html
import logging
import os
import tempfile

import genanki

from lyrics_tokenizer import extract_lyrics_text, tokenize_lyrics

logger = logging.getLogger(__name__)

# Stable IDs for the model and deck (generated once, hardcoded)
MODEL_ID = 1607392319
DECK_ID = 2059400111

MAX_DEFINITIONS = 5

# Model/field names (must match frontend)
ANKI_MODEL_NAME = 'Lyrics Vocabulary'
FIELD_WORD = 'Word'
FIELD_DEFINITION = 'Definition'

# Error messages (used in routes for response handling)
ERROR_NO_VOCABULARY_CARDS = 'No vocabulary cards could be generated from the lyrics'
ERROR_NO_DEFINITIONS = 'No definitions found for any word in the lyrics'
NO_DEFINITION_FOUND = 'No definition found'


class NoVocabularyCardsError(Exception):
    """Raised when lyrics yield no tokenizable vocabulary."""

    def __init__(self, message: str = ERROR_NO_VOCABULARY_CARDS):
        super().__init__(message)


class NoDefinitionsError(Exception):
    """Raised when tokenized words have no jamdict definitions."""

    def __init__(self, message: str = ERROR_NO_DEFINITIONS):
        super().__init__(message)


def _format_jamdict_result(result: dict) -> str:
    """Format jamdict result as HTML for Anki card back."""
    parts = []

    # Word entries (JMdict)
    for entry in result.get('entries', []):
        kanji_texts = [k.get('text', '') for k in entry.get('kanji', []) if k.get('text')]
        kana_texts = [k.get('text', '') for k in entry.get('kana', []) if k.get('text')]
        headword = ' '.join(kanji_texts) if kanji_texts else ' '.join(kana_texts)
        if kana_texts and kanji_texts and kana_texts != kanji_texts:
            headword = f"{' '.join(kanji_texts)} ({' '.join(kana_texts)})"
        elif kana_texts and not kanji_texts:
            headword = ' '.join(kana_texts)

        glosses = []
        for sense in entry.get('senses', []):
            for g in sense.get('SenseGloss', []):
                text = g.get('text', '')
                if text and (not g.get('lang') or g.get('lang') == 'eng'):
                    glosses.append(html.escape(text))
                    if len(glosses) >= MAX_DEFINITIONS:
                        break
            if len(glosses) >= MAX_DEFINITIONS:
                break

        if headword or glosses:
            parts.append(f'<div class="entry"><b>{html.escape(headword)}</b><br>{"; ".join(glosses[:MAX_DEFINITIONS])}</div>')

    # Named entities (JMnedict)
    for entry in result.get('names', []):
        kanji_texts = [k.get('text', '') for k in entry.get('kanji', []) if k.get('text')]
        kana_texts = [k.get('text', '') for k in entry.get('kana', []) if k.get('text')]
        headword = ' '.join(kanji_texts or kana_texts)

        glosses = []
        for sense in entry.get('senses', []):
            for g in sense.get('SenseGloss', []):
                text = g.get('text', '')
                if text:
                    glosses.append(html.escape(text))
                    if len(glosses) >= MAX_DEFINITIONS:
                        break
            if len(glosses) >= MAX_DEFINITIONS:
                break

        if headword or glosses:
            parts.append(f'<div class="entry"><b>{html.escape(headword)}</b> (name)<br>{"; ".join(glosses[:MAX_DEFINITIONS])}</div>')

    # Kanji characters (KANJIDIC)
    for char in result.get('chars', []):
        literal = char.get('literal', '')
        meanings = char.get('meanings', [])[:MAX_DEFINITIONS]
        if literal and meanings:
            parts.append(f'<div class="char"><b>{html.escape(literal)}</b> (kanji): {"; ".join(html.escape(m) for m in meanings)}</div>')

    if not parts:
        return html.escape(NO_DEFINITION_FOUND)

    return '<br>'.join(parts)


def _get_anki_model() -> genanki.Model:
    """Return the note model for lyrics vocabulary cards."""
    return genanki.Model(
        MODEL_ID,
        ANKI_MODEL_NAME,
        fields=[
            {'name': FIELD_WORD},
            {'name': FIELD_DEFINITION},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '{{Word}}',
                'afmt': '{{FrontSide}}<hr id="answer">{{Definition}}',
            },
        ],
        css='.entry, .char { margin-bottom: 0.5em; }',
    )


def _build_notes_from_tokenized(
    tokenized: list[tuple[str, dict]],
) -> list[tuple[str, str]]:
    """Return list of (word, definition_html) for words that have definitions."""
    no_definition = html.escape(NO_DEFINITION_FOUND)
    notes = []
    for word, result in tokenized:
        definition_html = _format_jamdict_result(result)
        if definition_html == no_definition:
            continue
        notes.append((html.escape(word), definition_html))
    return notes


def build_anki_deck(
    tokenized_lyrics: list[tuple[str, dict]],
    deck_name: str | None = None,
) -> bytes:
    """Build an Anki deck from tokenized lyrics. Returns .apkg file bytes."""
    deck_name = deck_name or ANKI_MODEL_NAME
    logger.info("build_anki_deck: deck_name=%r cards=%d", deck_name, len(tokenized_lyrics))
    if not tokenized_lyrics:
        raise NoVocabularyCardsError()

    notes = _build_notes_from_tokenized(tokenized_lyrics)
    if not notes:
        logger.warning("build_anki_deck: no definitions for any of %d words", len(tokenized_lyrics))
        raise NoDefinitionsError()

    model = _get_anki_model()
    deck = genanki.Deck(DECK_ID, deck_name)
    for word, definition_html in notes:
        note = genanki.Note(model=model, fields=[word, definition_html])
        deck.add_note(note)

    package = genanki.Package(deck)
    with tempfile.NamedTemporaryFile(suffix='.apkg', delete=False) as tmp:
        tmp_path = tmp.name
    try:
        package.write_to_file(tmp_path)
        with open(tmp_path, 'rb') as f:
            apkg_bytes = f.read()
        logger.info("build_anki_deck: wrote apkg size=%d", len(apkg_bytes))
        return apkg_bytes
    finally:
        os.unlink(tmp_path)


def _prepare_lyrics_data(
    lyrics_data: dict, deck_name: str | None = None
) -> tuple[list[tuple[str, dict]], str]:
    """Extract lyrics text, tokenize, and compute deck name. Returns (tokenized, deck_name)."""
    lyrics_text = extract_lyrics_text(lyrics_data)
    tokenized = tokenize_lyrics(lyrics_text)

    track_name = lyrics_data.get('trackName', 'Unknown')
    artist_name = lyrics_data.get('artistName', '')
    name = f'{track_name} - {artist_name}' if artist_name else track_name
    deck_name = deck_name or name

    return tokenized, deck_name


def build_anki_deck_from_lyrics_data(lyrics_data: dict, deck_name: str | None = None) -> bytes:
    """Build an Anki deck from raw lyrics API data."""
    logger.debug("build_anki_deck_from_lyrics_data: starting")
    tokenized, deck_name = _prepare_lyrics_data(lyrics_data, deck_name)
    logger.debug("build_anki_deck_from_lyrics_data: tokenized %d words", len(tokenized))
    return build_anki_deck(tokenized, deck_name=deck_name)


def build_anki_notes_json(lyrics_data: dict, deck_name: str | None = None) -> dict:
    """Build note data for AnkiConnect. Returns dict with deckName, modelName, notes."""
    logger.debug("build_anki_notes_json: starting")
    tokenized, deck_name = _prepare_lyrics_data(lyrics_data, deck_name)
    logger.debug("build_anki_notes_json: tokenized %d words", len(tokenized))

    note_pairs = _build_notes_from_tokenized(tokenized)
    if not note_pairs:
        if not tokenized:
            raise NoVocabularyCardsError()
        raise NoDefinitionsError()

    notes = [
        {'fields': {FIELD_WORD: word, FIELD_DEFINITION: definition_html}}
        for word, definition_html in note_pairs
    ]
    logger.info("build_anki_notes_json: deck_name=%r notes=%d", deck_name, len(notes))
    return {
        'deckName': deck_name,
        'modelName': ANKI_MODEL_NAME,
        'notes': notes,
    }
