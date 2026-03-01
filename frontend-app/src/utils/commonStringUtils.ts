export const ANKI_CONNECTION_ERROR_MESSAGE =
  'Cannot connect to Anki. Make sure Anki is running and AnkiConnect add-on is installed.'

export const isAnkiConnectionError = (message: string): boolean =>
  message.includes('fetch') ||
  message.includes('Failed to fetch') ||
  message.includes('NetworkError')

export const pluralSuffix = (count: number, suffix = 's'): string =>
  count === 1 ? '' : suffix
