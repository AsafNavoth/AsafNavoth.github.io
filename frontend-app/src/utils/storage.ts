export const getStorageItem = <T>(
  key: string,
  parse: (value: string) => T | null,
  fallback: T
): T => {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    const parsed = parse(stored)
    return parsed !== null ? parsed : fallback
  } catch (e) {
    if (import.meta.env.DEV) console.warn('localStorage getItem failed:', e)
    return fallback
  }
}

export const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    if (import.meta.env.DEV) console.warn('localStorage setItem failed:', e)
  }
}
