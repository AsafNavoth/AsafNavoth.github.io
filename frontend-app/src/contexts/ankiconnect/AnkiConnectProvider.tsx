import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '../snackbar/snackbarContext'
import { getErrorMessage } from '../../utils/commonStringUtils'
import { getStorageItem, setStorageItem } from '../../utils/storage'
import {
  ANKI_CONNECTION_ERROR_MESSAGE,
  isAnkiConnectionError,
} from '../../utils/commonStringUtils'
import { useAnkiConnect } from '../../hooks/useAnkiConnect'
import { AnkiConnectContext } from './ankiconnectContext'

const ANKICONNECT_ENABLED_KEY = 'utanki-ankiconnect-enabled'
const EXCLUDED_DECKS = ['Default', 'デフォルト']
const DECK_REFRESH_INTERVAL_MS = 30_000

type AnkiConnectProviderProps = {
  children: React.ReactNode
}

export const AnkiConnectProvider = ({ children }: AnkiConnectProviderProps) => {
  const { getDeckNames } = useAnkiConnect()
  const { enqueueSnackbar } = useSnackbar()
  const [ankiConnectEnabled, setAnkiConnectEnabled] = useState(() =>
    getStorageItem(
      ANKICONNECT_ENABLED_KEY,
      (v) => (v === 'true' ? true : null),
      false
    )
  )
  const [selectedDeck, setSelectedDeck] = useState('')
  const [decks, setDecks] = useState<string[] | null>(null)
  const [decksError, setDecksError] = useState<string | null>(null)

  useEffect(() => {
    setStorageItem(ANKICONNECT_ENABLED_KEY, String(ankiConnectEnabled))
  }, [ankiConnectEnabled])

  useEffect(() => {
    if (!ankiConnectEnabled) {
      setDecks(null)
      setDecksError(null)
      setSelectedDeck('')

      return
    }
    setDecks(null)
    setDecksError(null)
    getDeckNames()
      .then((names) => {
        const filtered = names.filter((n) => !EXCLUDED_DECKS.includes(n))
        setDecks(filtered)
        setSelectedDeck((prev) => {
          if (filtered.includes(prev)) return prev

          return filtered[0] ?? ''
        })
      })
      .catch((err) => {
        const msg = getErrorMessage(err, 'Failed to fetch decks')
        const displayMsg = isAnkiConnectionError(msg)
          ? ANKI_CONNECTION_ERROR_MESSAGE
          : msg
        setDecksError(displayMsg)
        enqueueSnackbar(displayMsg)
        if (isAnkiConnectionError(msg)) setAnkiConnectEnabled(false)
      })
  }, [ankiConnectEnabled, getDeckNames, enqueueSnackbar])

  const setEnabled = useCallback((enabled: boolean) => {
    setAnkiConnectEnabled(enabled)
  }, [])

  const setDeck = useCallback((deck: string) => {
    setSelectedDeck(deck)
  }, [])

  const refreshDecks = useCallback(async () => {
    if (!ankiConnectEnabled) return
    try {
      const names = await getDeckNames()
      const filtered = names.filter((n) => !EXCLUDED_DECKS.includes(n))
      setDecks(filtered)
      setDecksError(null)
      setSelectedDeck((prev) => {
        if (filtered.includes(prev)) return prev

        return filtered[0] ?? ''
      })
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to fetch decks')
      const displayMsg = isAnkiConnectionError(msg)
        ? ANKI_CONNECTION_ERROR_MESSAGE
        : msg
      setDecksError(displayMsg)
      enqueueSnackbar(displayMsg)
      if (isAnkiConnectionError(msg)) setAnkiConnectEnabled(false)
    }
  }, [ankiConnectEnabled, getDeckNames, enqueueSnackbar])

  const onConnectionError = useCallback(() => {
    setAnkiConnectEnabled(false)
  }, [])

  useEffect(() => {
    if (!ankiConnectEnabled) return

    const id = setInterval(refreshDecks, DECK_REFRESH_INTERVAL_MS)

    return () => clearInterval(id)
  }, [ankiConnectEnabled, refreshDecks])

  const value = {
    ankiConnectEnabled,
    setAnkiConnectEnabled: setEnabled,
    selectedDeck,
    setSelectedDeck: setDeck,
    decks,
    decksError,
    getDeckNames,
    refreshDecks,
    onConnectionError,
  }

  return (
    <AnkiConnectContext.Provider value={value}>
      {children}
    </AnkiConnectContext.Provider>
  )
}
