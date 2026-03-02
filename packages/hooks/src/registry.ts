import type { Unsubscribable } from "./types";

type RegistryEntry = {
  sub?: Unsubscribable;
  inflight?: Promise<Unsubscribable>;
  refCount: number;
};

const registry = new Map<string, RegistryEntry>();

export async function acquireSubscription(key: string, create: () => Promise<Unsubscribable>): Promise<void> {
  let entry = registry.get(key);

  if (entry?.sub) {
    entry.refCount += 1;
    return;
  }

  if (entry?.inflight) {
    entry.refCount += 1;
    await entry.inflight;
    return;
  }

  entry = { refCount: 1 };

  const inflight = create()
    .then((sub) => {
      const latest = registry.get(key);
      if (!latest || latest.refCount === 0) {
        sub.unsubscribe();
        registry.delete(key);
        return sub;
      }

      latest.sub = sub;
      return sub;
    })
    .catch((error) => {
      registry.delete(key);
      throw error;
    })
    .finally(() => {
      const latest = registry.get(key);
      if (latest) delete latest.inflight;
    });

  entry.inflight = inflight;
  registry.set(key, entry);

  await inflight;
}

export function releaseSubscription(key: string) {
  const entry = registry.get(key);
  if (!entry) return;

  entry.refCount -= 1;
  if (entry.refCount > 0) return;

  if (entry.sub) {
    entry.sub.unsubscribe();
    registry.delete(key);
    return;
  }

  if (entry.inflight) return;

  registry.delete(key);
}
