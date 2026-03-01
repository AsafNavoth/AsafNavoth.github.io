import axios from 'axios'

// Extract the API error message from an error, handling both JSON and Blob
// response bodies (e.g. when responseType: 'blob' is used).
export const getApiErrorMessage = async (
  err: unknown,
  fallback = 'An error occurred'
): Promise<string> => {
  const defaultMessage = err instanceof Error ? err.message : fallback
  if (!axios.isAxiosError(err) || !err.response?.data) return defaultMessage

  const data = err.response.data

  if (typeof data === 'object' && data !== null && 'error' in data) {
    const errorVal = (data as { error: unknown }).error
    return typeof errorVal === 'string' ? errorVal : defaultMessage
  }

  if (data instanceof Blob) {
    try {
      const errorText = await data.text()
      const parsed = JSON.parse(errorText) as { error?: string }
      return typeof parsed.error === 'string' ? parsed.error : defaultMessage
    } catch {
      return defaultMessage
    }
  }

  return defaultMessage
}
