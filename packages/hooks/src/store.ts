import type { UseSubscribeState } from "./types";

type Listener = () => void;

export type SubscribeStore<TData> = {
  getState: () => UseSubscribeState<TData>;
  setState: (
    update:
      | Partial<UseSubscribeState<TData>>
      | ((state: UseSubscribeState<TData>) => Partial<UseSubscribeState<TData>>),
  ) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createSubscribeStore<TData>(initialData?: TData): SubscribeStore<TData> {
  let state: UseSubscribeState<TData> = {
    data: initialData,
    ready: initialData !== undefined,
    loading: false,
    error: undefined,
  };

  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (update) => {
      const next = typeof update === "function" ? update(state) : update;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
