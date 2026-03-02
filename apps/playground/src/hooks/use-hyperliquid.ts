import { useMemo } from "react";
import { useSubscribe } from "@outofgas/react-stream";
import type {
  ISubscription,
  L2BookWsEvent,
  TradesWsEvent,
  SubscriptionClient,
} from "@nktkas/hyperliquid";

const MAX_TRADES = 12;
const MAX_LEVELS = 8;

export type RawLevel =
  | {
      px: string;
      sz: string;
    }
  | [string, string];

export type OrderbookSnapshot = {
  coin: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
};

export type TradeRow = {
  coin: string;
  side: "B" | "A";
  px: string;
  sz: string;
  time: number;
  tid: number;
  hash?: string;
};

function parseLevel(level: RawLevel): { price: number; size: number } | null {
  if (Array.isArray(level)) {
    const [price, size] = level;
    const parsedPrice = Number(price);
    const parsedSize = Number(size);

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedSize)) {
      return null;
    }

    return { price: parsedPrice, size: parsedSize };
  }

  const parsedPrice = Number(level.px);
  const parsedSize = Number(level.sz);

  if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedSize)) {
    return null;
  }

  return { price: parsedPrice, size: parsedSize };
}

function parseOrderbookMessage(message: L2BookWsEvent, coin: string): OrderbookSnapshot | undefined {
  if (message.coin !== coin || !Array.isArray(message.levels) || message.levels.length < 2) {
    return undefined;
  }

  const [bids, asks] = message.levels;

  return {
    coin,
    bids: bids
      .map(parseLevel)
      .filter((level): level is { price: number; size: number } => level !== null)
      .slice(0, MAX_LEVELS),
    asks: asks
      .map(parseLevel)
      .filter((level): level is { price: number; size: number } => level !== null)
      .slice(0, MAX_LEVELS),
  };
}

export function usePerpOrderbook(
  wsClient: SubscriptionClient,
  coin: string,
) {
  return useSubscribe<OrderbookSnapshot>({
    key: ["hyperliquid", "l2Book", coin],
    subscribe: async ({ onData, onError }) =>
      wsClient.l2Book({ coin }, (message: L2BookWsEvent) => {
        try {
          const next = parseOrderbookMessage(message, coin);
          if (next) {
            onData(next);
          }
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error(`Failed to parse ${coin} orderbook update`),
          );
        }
      }) as Promise<ISubscription>,
  });
}

export function usePerpTrades(
  wsClient: SubscriptionClient,
  coin: string,
) {
  const parseTrades = useMemo(() => {
    const tradesById = new Map<number, TradeRow>();

    return (message: TradesWsEvent) => {
      const batch = message.filter(
        (trade) =>
          trade.coin === coin &&
          typeof trade.tid === "number" &&
          typeof trade.time === "number",
      );

      if (batch.length === 0) {
        return undefined;
      }

      for (const trade of batch) {
        tradesById.set(trade.tid, trade);
      }

      const snapshot = [...tradesById.values()]
        .sort((left, right) => right.time - left.time)
        .slice(0, MAX_TRADES);

      tradesById.clear();
      for (const trade of snapshot) {
        tradesById.set(trade.tid, trade);
      }

      return snapshot;
    };
  }, [coin]);

  return useSubscribe<TradeRow[]>({
    key: ["hyperliquid", "trades", coin],
    initialData: [],
    subscribe: async ({ onData, onError }) =>
      wsClient.trades({ coin }, (message: TradesWsEvent) => {
        try {
          const next = parseTrades(message);
          if (next) {
            onData(next);
          }
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error(`Failed to parse ${coin} trades update`),
          );
        }
      }) as Promise<ISubscription>,
  });
}
