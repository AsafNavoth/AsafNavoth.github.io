import { useCallback, useRef, useState } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

type UseLocalStorageStateOptions<T> = {
  localStorageKey: string;
  defaultValue: T;
  parse?: (value: string) => T | null;
  serialize?: (value: T) => string;
};

const identityParse = <T>(v: string): T => v as T;
const defaultSerialize = (v: unknown): string => String(v);

export const useLocalStorageState = <T>({
  localStorageKey,
  defaultValue,
  parse = identityParse,
  serialize = defaultSerialize,
}: UseLocalStorageStateOptions<T>): [
  T,
  (value: T | ((prev: T) => T)) => void,
] => {
  const serializeRef = useRef(serialize);
  serializeRef.current = serialize;

  const [state, setState] = useState<T>(() =>
    getStorageItem(localStorageKey, parse, defaultValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;

        setStorageItem(localStorageKey, serializeRef.current(next));

        return next;
      });
    },
    [localStorageKey]
  );

  return [state, setValue];
};
