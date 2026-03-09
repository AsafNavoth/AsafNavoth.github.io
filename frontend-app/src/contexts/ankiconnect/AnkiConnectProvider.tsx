import { useCallback, useEffect, useRef, useState } from 'react';
import { useSnackbar } from '../snackbar/snackbarContext';
import { getErrorMessage } from '../../utils/commonStringUtils';
import {
  ANKI_CONNECTION_ERROR_MESSAGE,
  EXTENSION_REQUIRED_ERROR_MESSAGE,
  isAnkiConnectionError,
  isExtensionRequiredError,
} from '../../utils/apiUtils';
import { useAnkiConnect } from '../../hooks/useAnkiConnect';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import { excludedDecks } from '../../env';
import { AnkiConnectContext } from './ankiconnectContext';

const ANKICONNECT_ENABLED_KEY = 'utanki-ankiconnect-enabled';
const SELECTED_DECK_KEY = 'utanki-selected-deck';
const DECK_REFRESH_INTERVAL_MS = 30_000;

const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const getIsMobileFromUserAgent = (): boolean =>
  typeof navigator !== 'undefined' && MOBILE_UA_REGEX.test(navigator.userAgent);

type AnkiConnectProviderProps = {
  children: React.ReactNode;
};

export const AnkiConnectProvider = ({ children }: AnkiConnectProviderProps) => {
  const isAnkiConnectSupported = !getIsMobileFromUserAgent();
  const { getDeckNames } = useAnkiConnect();
  const { enqueueErrorSnackbar } = useSnackbar();
  const [ankiConnectEnabled, setAnkiConnectEnabled] = useLocalStorageState({
    localStorageKey: ANKICONNECT_ENABLED_KEY,
    defaultValue: false,
    parse: (storedValue) => (storedValue === 'true' ? true : null),
  });
  const [selectedDeck, setSelectedDeck] = useLocalStorageState({
    localStorageKey: SELECTED_DECK_KEY,
    defaultValue: '',
  });
  const [decks, setDecks] = useState<string[] | null>(null);
  const [decksError, setDecksError] = useState<string | null>(null);
  const selectedDeckRef = useRef(selectedDeck);
  selectedDeckRef.current = selectedDeck;

  const onConnectionError = () => {
    setAnkiConnectEnabled(false);
  };

  const setDecksFromNames = useCallback(
    (names: string[]) => {
      const filtered = names.filter(
        (deckName) => !excludedDecks.includes(deckName)
      );
      setDecks(filtered);
      setDecksError(null);
      const prev = selectedDeckRef.current;
      const nextDeck = filtered.includes(prev) ? prev : (filtered[0] ?? '');
      setSelectedDeck(nextDeck);
    },
    [setSelectedDeck]
  );

  const handleDeckFetchError = useCallback(
    (error: unknown) => {
      const msg = getErrorMessage(error, 'Failed to fetch decks');
      const isConnectionError = isAnkiConnectionError(error);
      const isExtensionRequired = isExtensionRequiredError(error);
      const displayMsg = isExtensionRequired
        ? EXTENSION_REQUIRED_ERROR_MESSAGE
        : isConnectionError
          ? ANKI_CONNECTION_ERROR_MESSAGE
          : msg;
      setDecksError(displayMsg);
      enqueueErrorSnackbar(displayMsg);

      if (isConnectionError || isExtensionRequired) setAnkiConnectEnabled(false);
    },
    [enqueueErrorSnackbar, setAnkiConnectEnabled]
  );

  const loadDecks = useCallback(async () => {
    const names = await getDeckNames();
    setDecksFromNames(names);
  }, [getDeckNames, setDecksFromNames]);

  useEffect(() => {
    setDecks(null);
    setDecksError(null);

    if (!ankiConnectEnabled) return;

    loadDecks().catch(handleDeckFetchError);
  }, [ankiConnectEnabled, loadDecks, handleDeckFetchError]);

  const refreshDecks = useCallback(async () => {
    if (!ankiConnectEnabled) return;
    try {
      await loadDecks();
    } catch (error) {
      handleDeckFetchError(error);
    }
  }, [ankiConnectEnabled, loadDecks, handleDeckFetchError]);

  useEffect(() => {
    if (!ankiConnectEnabled) return;

    const id = setInterval(refreshDecks, DECK_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [ankiConnectEnabled, refreshDecks]);

  return (
    <AnkiConnectContext.Provider
      value={{
        ankiConnectEnabled: ankiConnectEnabled && isAnkiConnectSupported,
        isAnkiConnectSupported,
        setAnkiConnectEnabled,
        selectedDeck,
        setSelectedDeck,
        decks,
        decksError,
        getDeckNames,
        refreshDecks,
        onConnectionError,
      }}
    >
      {children}
    </AnkiConnectContext.Provider>
  );
};
