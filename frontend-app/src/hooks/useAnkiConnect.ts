import { useCallback, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from '../contexts/snackbar/snackbarContext';
import { AnkiConnectContext } from '../contexts/ankiconnect/ankiconnectContext';
import { getPluralSuffix } from '../utils/commonStringUtils';
import {
  ANKI_CONNECTION_ERROR_MESSAGE,
  EXTENSION_REQUIRED_ERROR_CODE,
  EXTENSION_REQUIRED_ERROR_MESSAGE,
  getApiErrorMessage,
  isAnkiConnectionError,
  isExtensionRequiredError,
  LYRICS_ANKI_MODEL_CONFIG_API_PATH,
} from '../utils/apiUtils';
import { useApi } from './useApi';
import { useReactQuery } from './useReactQuery';
import { excludedDecks, extensionOrigins } from '../env';
import type { AnkiNote } from './useAnkiNotes';

const ANKICONNECT_VERSION = 6;
const EXTENSION_TIMEOUT_MS = 3000;
const EXTENSION_MESSAGE_TYPE_REQUEST = 'UTANKI_ANKICONNECT_REQUEST';
const EXTENSION_MESSAGE_TYPE_RESPONSE = 'UTANKI_ANKICONNECT_RESPONSE';
const INVALID_ANKICONNECT_RESPONSE_MESSAGE = 'Invalid AnkiConnect response';
const LOCALHOST_PREFIX_ORIGINS = ['http://localhost', 'http://127.0.0.1'];

export type AnkiModelConfig = {
  modelName: string;
  fields: string[];
  cardTemplates: Array<{ name: string; front: string; back: string }>;
  css: string;
};

type AnkiConnectRequest = {
  action: string;
  version: number;
  params?: Record<string, unknown>;
};

const isOriginAllowed = (origin: string): boolean =>
  extensionOrigins.some((allowed) => {
    const isExactMatch = origin === allowed;
    const isLocalhostWithPort =
      LOCALHOST_PREFIX_ORIGINS.includes(allowed) && origin.startsWith(allowed);

    return isExactMatch || isLocalhostWithPort;
  });

const invokeAnkiConnect = <T>(request: AnkiConnectRequest): Promise<T> => {
  if (!isOriginAllowed(window.location.origin)) {
    return Promise.reject(new Error(EXTENSION_REQUIRED_ERROR_CODE));
  }

  return new Promise((resolve, reject) => {
    // postMessage is a shared channel; responses aren't tied to requests. The
    // requestId correlates each response with its request when multiple calls
    // are in flight.
    const requestId = crypto.randomUUID();
    const responseHandler = (event: MessageEvent) => {
      const { type: messageType, result, error } = event.data || {};

      if (
        messageType !== EXTENSION_MESSAGE_TYPE_RESPONSE ||
        event.data?.id !== requestId
      )
        return;

      clearTimeout(extensionTimeoutHandler);
      window.removeEventListener('message', responseHandler);

      if (error) reject(new Error(error));
      else if (result === undefined)
        reject(new Error(INVALID_ANKICONNECT_RESPONSE_MESSAGE));
      else resolve(result);
    };

    window.addEventListener('message', responseHandler);
    window.postMessage(
      { type: EXTENSION_MESSAGE_TYPE_REQUEST, id: requestId, payload: request },
      '*'
    );

    const extensionTimeoutHandler = setTimeout(() => {
      window.removeEventListener('message', responseHandler);
      reject(new Error(EXTENSION_REQUIRED_ERROR_CODE));
    }, EXTENSION_TIMEOUT_MS);
  });
};

const getFieldsForNoteFromConfig = (
  note: AnkiNote,
  fieldNames: string[]
): Record<string, string> => {
  const noteFields = note.fields ?? {};

  return Object.fromEntries(
    fieldNames.map((fieldName) => [
      fieldName,
      String(noteFields[fieldName] ?? ''),
    ])
  );
};

const ANKI_MODEL_CONFIG_QUERY_KEY = ['ankiModelConfig'] as const;

export const useAnkiConnect = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, enqueueErrorSnackbar } = useSnackbar();
  const ankiContext = useContext(AnkiConnectContext);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useReactQuery<AnkiModelConfig>({
    queryKey: ANKI_MODEL_CONFIG_QUERY_KEY,
    url: LYRICS_ANKI_MODEL_CONFIG_API_PATH,
    enabled: ankiContext?.ankiConnectEnabled ?? false,
  });

  const addNotesToAnki = useCallback(
    async (targetDeck: string, notes: AnkiNote[], modelName: string) => {
      if (notes.length === 0) return;
      setIsAdding(true);
      setError(null);
      try {
        const config = await queryClient.fetchQuery<AnkiModelConfig>({
          queryKey: ANKI_MODEL_CONFIG_QUERY_KEY,
          queryFn: async () => {
            const { data } = await api.get<AnkiModelConfig | null>(
              LYRICS_ANKI_MODEL_CONFIG_API_PATH
            );

            if (!data) throw new Error('Failed to fetch model config');

            return data;
          },
        });

        const deckNames = await invokeAnkiConnect<string[]>({
          action: 'deckNames',
          version: ANKICONNECT_VERSION,
        });
        const validDecks = deckNames.filter(
          (deckName) => !excludedDecks.includes(deckName)
        );

        if (!validDecks.includes(targetDeck)) {
          throw new Error(
            'The selected deck no longer exists. Please select a different deck from the dropdown.'
          );
        }

        const modelNames = await invokeAnkiConnect<string[]>({
          action: 'modelNames',
          version: ANKICONNECT_VERSION,
        });
        const modelExists = modelNames.includes(modelName);

        if (!modelExists) {
          await invokeAnkiConnect({
            action: 'createModel',
            version: ANKICONNECT_VERSION,
            params: {
              modelName,
              inOrderFields: config.fields,
              cardTemplates: config.cardTemplates.map((template) => ({
                Name: template.name,
                Front: template.front,
                Back: template.back,
              })),
              css: config.css,
            },
          });
        } else {
          const templates = Object.fromEntries(
            config.cardTemplates.map((template) => [
              template.name,
              { Front: template.front, Back: template.back },
            ])
          );

          await invokeAnkiConnect({
            action: 'updateModelTemplates',
            version: ANKICONNECT_VERSION,
            params: {
              model: { name: modelName, templates },
            },
          });

          await invokeAnkiConnect({
            action: 'updateModelStyling',
            version: ANKICONNECT_VERSION,
            params: { model: { name: modelName, css: config.css } },
          });
        }

        const getFieldsForNote = (note: AnkiNote): Record<string, string> =>
          getFieldsForNoteFromConfig(note, config.fields);

        await invokeAnkiConnect({
          action: 'createDeck',
          version: ANKICONNECT_VERSION,
          params: { deck: targetDeck },
        });

        const notesToAdd = notes.map((note) => ({
          deckName: targetDeck,
          modelName,
          fields: getFieldsForNote(note),
        }));

        const canAdd = await invokeAnkiConnect<boolean[]>({
          action: 'canAddNotes',
          version: ANKICONNECT_VERSION,
          params: { notes: notesToAdd },
        });

        const filteredNotesToAdd = notesToAdd.filter(
          (_, index) => canAdd[index]
        );
        const skippedNotesCount = notesToAdd.length - filteredNotesToAdd.length;

        if (filteredNotesToAdd.length > 0) {
          await invokeAnkiConnect<number[]>({
            action: 'addNotes',
            version: ANKICONNECT_VERSION,
            params: { notes: filteredNotesToAdd },
          });
        }

        const addedCount = filteredNotesToAdd.length;
        const message =
          addedCount > 0
            ? `Added ${addedCount} card${getPluralSuffix(addedCount)} to ${targetDeck}${skippedNotesCount > 0 ? ` (${skippedNotesCount} already in deck)` : ''}`
            : `All ${notesToAdd.length} card${getPluralSuffix(notesToAdd.length)} already in ${targetDeck}`;

        enqueueSnackbar(message);
      } catch (error) {
        const message = await getApiErrorMessage(
          error,
          'Failed to add cards to Anki'
        );
        const isExtensionRequired = isExtensionRequiredError(error);
        const isConnectionError = isAnkiConnectionError(error);
        const displayMessage = isExtensionRequired
          ? EXTENSION_REQUIRED_ERROR_MESSAGE
          : isConnectionError
            ? ANKI_CONNECTION_ERROR_MESSAGE
            : message;
        setError(displayMessage);
        enqueueErrorSnackbar(displayMessage);

        if (isExtensionRequired || isConnectionError)
          ankiContext?.onConnectionError();
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [api, queryClient, enqueueSnackbar, enqueueErrorSnackbar, ankiContext]
  );

  const getDeckNames = useCallback(async (): Promise<string[]> => {
    return invokeAnkiConnect<string[]>({
      action: 'deckNames',
      version: ANKICONNECT_VERSION,
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    addNotesToAnki,
    getDeckNames,
    isAddingToAnki: isAdding,
    error,
    clearError,
  };
};
