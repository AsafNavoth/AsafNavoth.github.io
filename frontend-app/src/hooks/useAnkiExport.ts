import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'

type UseAnkiExportParams = {
  payload: object | null
  filename: string
}

export const useAnkiExport = ({ payload, filename }: UseAnkiExportParams) => {
  const api = useApi()
  const [isExporting, setIsExporting] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBlob(null)
    setError(null)
  }, [payload])

  const prepare = useCallback(async () => {
    if (!payload) return
    setIsExporting(true)
    setError(null)
    setBlob(null)
    try {
      const response = await api.post('/api/lyrics/anki', payload, {
        responseType: 'blob',
      })
      setBlob(new Blob([response.data]))
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : 'Export failed'
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response
        const data = res?.data
        if (data instanceof Blob) {
          try {
            const text = await data.text()
            const parsed = JSON.parse(text) as { error?: string }
            if (parsed.error) message = parsed.error
          } catch {
            /* ignore */
          }
        }
      }
      setError(message)
    } finally {
      setIsExporting(false)
    }
  }, [api, payload])

  const download = useCallback(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace(/\//g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }, [blob, filename])

  return { prepare, download, blob, isExporting, error }
}
