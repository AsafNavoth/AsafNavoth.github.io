export const getErrorMessage = (
  errorMessage: unknown,
  fallback: string
): string => {
  if (typeof errorMessage === 'string') return errorMessage

  if (errorMessage instanceof Error) return errorMessage.message

  return fallback
}

export const getPluralSuffix = (count: number, suffix = 's'): string =>
  count === 1 ? '' : suffix

export const getTextWithoutHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const getTruncatedText = (text: string, maxLen: number): string =>
  text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`
