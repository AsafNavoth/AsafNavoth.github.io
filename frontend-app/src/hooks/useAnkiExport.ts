import { useCallback, useState } from 'react'
import { useApi } from './useApi'
import { getApiErrorMessage } from '../utils/apiUtils'
import type { AnkiNote } from './useAnkiNotes'

type DeckPayload = {
  deckName: string
  modelName: string
  notes: AnkiNote[]
}

export const useAnkiExport = () => {
  const api = useApi()
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildDeck = useCallback(
    async (payload: DeckPayload): Promise<Blob | null> => {
      if (payload.notes.length === 0) return null

      setIsExporting(true)
      setError(null)

      try {
        const response = await api.post('/api/lyrics/anki/deck', payload, {
          responseType: 'blob',
        })

        return new Blob([response.data])
      } catch (err: unknown) {
        const message = await getApiErrorMessage(err, 'Export failed')
        setError(message)

        return null
      } finally {
        setIsExporting(false)
      }
    },
    [api]
  )

  const download = useCallback((blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.href = objectUrl
    downloadAnchor.download = filename.replace(/\//g, '-')
    downloadAnchor.click()
    URL.revokeObjectURL(objectUrl)
  }, [])

  return { buildDeck, download, isExporting, error }
}
