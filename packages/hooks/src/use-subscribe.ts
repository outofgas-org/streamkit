import { useEffect, useEffectEvent, useMemo, useRef, useSyncExternalStore } from "react";
import { acquireSubscription, releaseSubscription } from "./registry";
import { createSubscribeStore } from "./store";
import type { SubscribeStore } from "./store";
import type { SubscribeKey, UseSubscribeOptions, UseSubscribeState } from "./types";

const stores = new Map<string, SubscribeStore<unknown>>();
const storeRefs = new Map<string, number>();

function normalizeKey(key: SubscribeKey): string {
  if (typeof key === "string") return key;
  return JSON.stringify(key);
}

function getOrCreateStore<TData>(key: string, initialData?: TData): SubscribeStore<TData> {
  const existing = stores.get(key) as SubscribeStore<TData> | undefined;
  if (existing) return existing;

  const store = createSubscribeStore(initialData);
  stores.set(key, store as SubscribeStore<unknown>);
  return store;
}

function retainStore(key: string) {
  const prev = storeRefs.get(key) ?? 0;
  storeRefs.set(key, prev + 1);
}

function releaseStore(key: string) {
  const prev = storeRefs.get(key) ?? 0;
  const next = prev - 1;

  if (next > 0) {
    storeRefs.set(key, next);
    return;
  }

  storeRefs.delete(key);
  stores.delete(key);
}

export function useSubscribe<TRaw, TData = TRaw>(options: UseSubscribeOptions<TRaw, TData>): UseSubscribeState<TData> {
  const { key, enabled = true, initialData, resetOnSubscribe = false, select, subscribe } = options;

  const normalizedKey = useMemo(() => normalizeKey(key), [key]);
  const tokenRef = useRef(0);

  const store = useMemo(() => getOrCreateStore<TData>(normalizedKey, initialData), [normalizedKey]);
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const getInitialData = useEffectEvent(() => initialData);
  const mapData = useEffectEvent((raw: TRaw) => (select ? select(raw) : (raw as unknown as TData)));
  const startSubscription = useEffectEvent(
    (handlers: { onData: (data: TRaw) => void; onError: (error: Error) => void }) => Promise.resolve(subscribe(handlers)),
  );

  useEffect(() => {
    if (!enabled) return;

    const token = ++tokenRef.current;
    retainStore(normalizedKey);

    if (resetOnSubscribe) {
      const nextInitialData = getInitialData();

      store.setState({
        data: nextInitialData,
        ready: nextInitialData !== undefined,
        loading: true,
        error: undefined,
      });
    } else {
      store.setState({ loading: true, error: undefined });
    }

    acquireSubscription(normalizedKey, () =>
      startSubscription({
        onData: (raw) => {
          const data = mapData(raw);
          store.setState({ data, ready: true, loading: false, error: undefined });
        },
        onError: (error) => {
          store.setState({ error: error.message, loading: false });
        },
      }),
    )
      .catch((error) => {
        if (tokenRef.current !== token) return;
        store.setState({ error: (error as Error)?.message ?? "subscribe failed", loading: false });
      })
      .finally(() => {
        if (tokenRef.current !== token) return;
        store.setState((prev) => ({ loading: prev.ready ? false : prev.loading }));
      });

    return () => {
      releaseSubscription(normalizedKey);
      releaseStore(normalizedKey);
    };
  }, [enabled, normalizedKey, resetOnSubscribe, store]);

  return state;
}
