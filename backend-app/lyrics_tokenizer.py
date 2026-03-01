import logging
import re
import unicodedata

from jamdict import Jamdict
from sudachipy import Dictionary, SplitMode

from config import JAMDICT_DB_PATH
from decorators import log_call

logger = logging.getLogger(__name__)


class JamdictNotAvailableError(Exception):
    """Raised when jamdict database cannot be loaded."""


_tokenizer = None
_jamdict = None


def _get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = Dictionary().create()
    return _tokenizer


def _get_jamdict():
    global _jamdict
    if _jamdict is None:
        try:
            logger.debug("_get_jamdict: loading db_path=%s", JAMDICT_DB_PATH)
            _jamdict = Jamdict(db_file=JAMDICT_DB_PATH)
            logger.info("_get_jamdict: loaded successfully")
        except Exception as e:
            logger.error("_get_jamdict: failed to load err=%s", e)
            _jamdict = False  # Mark as failed so we don't retry
    return _jamdict if _jamdict else None


def _empty_lookup_result() -> dict:
    """Return empty jamdict result for fallback when lookup fails."""
    return {'entries': [], 'names': [], 'chars': [], 'found': False}


def _lookup_word(jam, word: str) -> dict:
    """Look up a word in jamdict, returning empty result on failure."""
    try:
        result = jam.lookup(word)
        return _lookup_result_to_dict(result)
    except Exception:
        return _empty_lookup_result()


def _lookup_result_to_dict(result) -> dict:
    """Convert jamdict LookupResult to a JSON-serializable dict."""
    data = {
        'entries': [e.to_dict() for e in result.entries],
        'names': [n.to_dict() for n in result.names] if result.names else [],
        'found': len(result.entries) > 0 or (result.names and len(result.names) > 0),
    }
    if result.chars:
        data['chars'] = [
            {'literal': getattr(c, 'literal', str(c)), 'meanings': c.meanings()}
            for c in result.chars
        ]
    else:
        data['chars'] = []
    return data


@log_call
def extract_lyrics_text(lyrics_data: dict) -> str:
    """Extract plain text from lyrics data (plainLyrics or syncedLyrics)."""
    if not isinstance(lyrics_data, dict):
        logger.warning("extract_lyrics_text: lyrics_data is not dict")
        return ''
    plain = (
        lyrics_data.get('plainLyrics')
        or lyrics_data.get('plain')
        or lyrics_data.get('lyrics')
        or ''
    )

    if isinstance(plain, str) and plain.strip():
        logger.debug("extract_lyrics_text: using plainLyrics len=%d", len(plain))
        return plain
    synced = lyrics_data.get('syncedLyrics') or lyrics_data.get('synced') or ''

    if not isinstance(synced, str):
        logger.warning("extract_lyrics_text: syncedLyrics not a string")
        return ''

    result = re.sub(r'\[\d{1,2}:\d{2}\.\d{2}\]\s*', '', synced)
    logger.debug("extract_lyrics_text: using syncedLyrics len=%d -> %d", len(synced), len(result))
    
    return result


def remove_english_letters(text: str) -> str:
    """Remove all ASCII letters (a-z, A-Z) from text and normalize whitespace."""
    text = re.sub(r'[a-zA-Z]', '', text)
    
    return re.sub(r'\s+', ' ', text).strip()


def _should_keep_token(token: str) -> bool:
    """Filter out single hiragana, single katakana, and punctuation."""
    if not token:
        return False
        
    # Filter tokens that are only punctuation
    if all(unicodedata.category(c).startswith('P') for c in token):
        return False

    if len(token) > 1:
        return True

    char = token[0]
    # Single hiragana (U+3040–U+309F)
    if '\u3040' <= char <= '\u309F':
        return False

    # Single katakana (U+30A0–U+30FF)
    if '\u30A0' <= char <= '\u30FF':
        return False

    # Single punctuation
    if unicodedata.category(char).startswith('P'):
        return False
    
    return True


@log_call
def tokenize_lyrics(text: str) -> list[tuple[str, dict]]:
    """Tokenize lyrics with SudachiPy and return unique (word, jamdict_result) tuples.
    English letters are removed before tokenization.
    Single hiragana, single katakana, and punctuation are filtered out."""
    if not text or not text.strip():
        return []

    text = remove_english_letters(text)

    if not text:
        return []

    tokenizer = _get_tokenizer()
    jam = _get_jamdict()
    morphemes = tokenizer.tokenize(text, SplitMode.A)
    words = [
        m.dictionary_form() for m in morphemes
        if m.surface().strip()
        and _should_keep_token(m.surface())
        and _should_keep_token(m.dictionary_form())
    ]
    unique_words = list(dict.fromkeys(words))

    if jam is None and unique_words:
        raise JamdictNotAvailableError(
            'Jamdict database is not available. Ensure jamdict.db is in backend-app/data/ '
            'or set JAMDICT_DB_PATH environment variable.'
        )

    if jam is None:
        return []

    tokenized = [(word, _lookup_word(jam, word)) for word in unique_words]
    found_count = sum(1 for _, r in tokenized if r.get('found'))

    # If all lookups returned empty, jamdict may be corrupted. Retry with a fresh instance.
    if found_count == 0 and len(tokenized) > 0:
        global _jamdict
        _jamdict = None
        jam = _get_jamdict()

        if jam is not None:
            tokenized = [(word, _lookup_word(jam, word)) for word in unique_words]
            found_count = sum(1 for _, r in tokenized if r.get('found'))
    return tokenized
