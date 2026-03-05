const parseCommaSeparatedList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const apiUrl = import.meta.env.VITE_API_URL;

export const maxLyricsChars = parseInt(
  import.meta.env.VITE_MAX_LYRICS_CHARS,
  10
);

export const excludedDecks: string[] = parseCommaSeparatedList(
  import.meta.env.VITE_ANKI_EXCLUDED_DECKS
);

export const extensionOrigins: string[] = parseCommaSeparatedList(
  import.meta.env.VITE_ANKICONNECT_EXTENSION_ORIGINS
);
