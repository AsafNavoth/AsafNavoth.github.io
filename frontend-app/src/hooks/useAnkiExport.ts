import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'
import { getApiErrorMessage } from '../utils/apiUtils'

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
      const message = await getApiErrorMessage(err, 'Export failed')
      setError(message)
    } finally {
      setIsExporting(false)
    }
  }, [api, payload])

  const download = useCallback(() => {
    if (!blob) return
    const objectUrl = URL.createObjectURL(blob)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.href = objectUrl
    downloadAnchor.download = filename.replace(/\//g, '-')
    downloadAnchor.click()
    URL.revokeObjectURL(objectUrl)
  }, [blob, filename])

  return { prepare, download, blob, isExporting, error }
}
