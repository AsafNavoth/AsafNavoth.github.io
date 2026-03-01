export const ANKI_CONNECTION_ERROR_MESSAGE =
  'Cannot connect to Anki. Make sure Anki is running and AnkiConnect add-on is installed.'

export const isAnkiConnectionError = (message: string): boolean =>
  message.includes('fetch') ||
  message.includes('Failed to fetch') ||
  message.includes('NetworkError')

export const pluralSuffix = (count: number, suffix = 's'): string =>
  count === 1 ? '' : suffix

export const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const truncate = (s: string, maxLen: number): string =>
  s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`
