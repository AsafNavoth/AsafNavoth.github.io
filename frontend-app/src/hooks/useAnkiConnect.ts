import { useCallback, useState } from 'react'
import type { AxiosInstance } from 'axios'
import { useSnackbar } from '../contexts/snackbar/snackbarContext'
import { useApi } from './useApi'

const ANKICONNECT_VERSION = 6

const LYRICS_VOCABULARY_MODEL = {
  modelName: 'Lyrics Vocabulary',
  inOrderFields: ['Word', 'Definition'],
  cardTemplates: [
    {
      Name: 'Card 1',
      Front: '{{Word}}',
      Back: '{{FrontSide}}<hr id="answer">{{Definition}}',
    },
  ],
  css: '.entry, .char { margin-bottom: 0.5em; }',
}

type AnkiConnectRequest = {
  action: string
  version: number
  params?: Record<string, unknown>
}

type AnkiNotesPayload = {
  deckName: string
  modelName: string
  notes: Array<{ fields: Record<string, string> }>
}

const invokeAnkiConnect = async <T>(
  api: AxiosInstance,
  request: AnkiConnectRequest
): Promise<T> => {
  try {
    const { data } = await api.post<{ result?: T; error?: string }>(
      '/api/ankiconnect',
      request
    )
    if (data.error) {
      throw new Error(data.error)
    }
    return data.result as T
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data &&
      typeof (err.response.data as { error: unknown }).error === 'string'
    ) {
      throw new Error((err.response.data as { error: string }).error)
    }
    throw err
  }
}

export const useAnkiConnect = (payload: object | null) => {
  const api = useApi()
  const { enqueueSnackbar } = useSnackbar()
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToAnki = useCallback(
    async (deckName?: string) => {
      if (!payload) return
      setIsAdding(true)
      setError(null)
      try {
        const { data } = await api.post<AnkiNotesPayload>(
          '/api/lyrics/anki/notes',
          payload
        )
        const targetDeck = deckName ?? data.deckName

        const modelNames = await invokeAnkiConnect<string[]>(api, {
          action: 'modelNames',
          version: ANKICONNECT_VERSION,
        })
        if (!modelNames.includes(data.modelName)) {
          await invokeAnkiConnect(api, {
            action: 'createModel',
            version: ANKICONNECT_VERSION,
            params: {
              modelName: data.modelName,
              inOrderFields: LYRICS_VOCABULARY_MODEL.inOrderFields,
              cardTemplates: LYRICS_VOCABULARY_MODEL.cardTemplates,
              css: LYRICS_VOCABULARY_MODEL.css,
            },
          })
        }

        await invokeAnkiConnect(api, {
          action: 'createDeck',
          version: ANKICONNECT_VERSION,
          params: { deck: targetDeck },
        })

        const notesToAdd = data.notes.map((note) => ({
          deckName: targetDeck,
          modelName: data.modelName,
          fields: note.fields,
        }))

        const canAdd = await invokeAnkiConnect<boolean[]>(api, {
          action: 'canAddNotes',
          version: ANKICONNECT_VERSION,
          params: { notes: notesToAdd },
        })
        const notesToAddFiltered = notesToAdd.filter((_, i) => canAdd[i])
        const skippedCount = notesToAdd.length - notesToAddFiltered.length

        if (notesToAddFiltered.length > 0) {
          await invokeAnkiConnect<number[]>(api, {
            action: 'addNotes',
            version: ANKICONNECT_VERSION,
            params: { notes: notesToAddFiltered },
          })
        }

        const addedCount = notesToAddFiltered.length
        const message =
          addedCount > 0
            ? `Added ${addedCount} card${addedCount === 1 ? '' : 's'} to ${targetDeck}${skippedCount > 0 ? ` (${skippedCount} already in deck)` : ''}`
            : `All ${notesToAdd.length} card${notesToAdd.length === 1 ? '' : 's'} already in ${targetDeck}`
        enqueueSnackbar(message)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add cards to Anki'
        if (
          message.includes('fetch') ||
          message.includes('Failed to fetch') ||
          message.includes('NetworkError')
        ) {
          setError(
            'Cannot connect to Anki. Make sure Anki is running and AnkiConnect add-on is installed.'
          )
        } else {
          setError(message)
        }
      } finally {
        setIsAdding(false)
      }
    },
    [api, payload, enqueueSnackbar]
  )

  const getDeckNames = useCallback(async (): Promise<string[]> => {
    return invokeAnkiConnect<string[]>(api, {
      action: 'deckNames',
      version: ANKICONNECT_VERSION,
    })
  }, [api])

  return { addToAnki, getDeckNames, isAddingToAnki: isAdding, error }
}
