import { useMemo } from "react";
import { useSubscribe } from "@bunstack/hooks";
import type {
  ISubscription,
  L2BookWsEvent,
  TradesWsEvent,
} from "@nktkas/hyperliquid";
import { wsClient } from "../lib/hyperliquid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const DEMO_COINS = ["BTC", "ETH"] as const;
const MAX_TRADES = 12;
const MAX_LEVELS = 8;

type RawLevel =
  | {
      px: string;
      sz: string;
    }
  | [string, string];

type OrderbookSnapshot = {
  coin: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
};

type TradeRow = {
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

function formatPrice(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatSize(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(numericValue);
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function usePerpOrderbook(coin: string) {
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

function usePerpTrades(coin: string) {
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

function OrderbookPanel({ coin }: { coin: string }) {
  const state = usePerpOrderbook(coin);

  return (
    <Card className="border-white/60 bg-white/80 shadow-lg shadow-slate-200/70 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl text-slate-900">
          <span>{coin} Perp Orderbook</span>
          <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-white">
            L2
          </span>
        </CardTitle>
        <CardDescription className="text-slate-500">
          Top {MAX_LEVELS} asks and bids streamed from Hyperliquid.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        {!state.ready ? (
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {state.loading ? "Connecting to feed..." : "Waiting for first snapshot..."}
          </p>
        ) : null}

        {state.data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                Asks
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-700">
                {state.data.asks.map((level) => (
                  <div className="grid grid-cols-2 gap-3" key={`ask-${level.price}`}>
                    <span className="text-rose-600">{formatPrice(level.price)}</span>
                    <span className="text-right">{formatSize(level.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Bids
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-700">
                {state.data.bids.map((level) => (
                  <div className="grid grid-cols-2 gap-3" key={`bid-${level.price}`}>
                    <span className="text-emerald-600">{formatPrice(level.price)}</span>
                    <span className="text-right">{formatSize(level.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TradesPanel({ coin }: { coin: string }) {
  const state = usePerpTrades(coin);

  return (
    <Card className="border-white/60 bg-white/80 shadow-lg shadow-slate-200/70 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl text-slate-900">
          <span>{coin} Perp Trades</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {state.data?.length ?? 0} rows
          </span>
        </CardTitle>
        <CardDescription className="text-slate-500">
          Rolling stream of the latest matched trades.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        {!state.ready ? (
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {state.loading ? "Connecting to feed..." : "Waiting for first trades..."}
          </p>
        ) : null}

        {state.data && state.data.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 gap-3 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Time</span>
            </div>
            <div className="max-h-80 overflow-y-auto bg-white">
              {state.data.map((trade) => (
                <a
                  className="grid grid-cols-3 gap-3 border-t border-slate-100 px-3 py-2 font-mono text-xs text-slate-700 transition-colors hover:bg-slate-50"
                  href={
                    trade.hash
                      ? `https://app.hyperliquid.xyz/explorer/tx/${trade.hash}`
                      : undefined
                  }
                  key={trade.tid}
                  rel="noreferrer"
                  target={trade.hash ? "_blank" : undefined}
                >
                  <span className={trade.side === "B" ? "text-emerald-600" : "text-rose-600"}>
                    {formatPrice(trade.px)}
                  </span>
                  <span className="text-right">{formatSize(trade.sz)}</span>
                  <span className="text-right">{formatTime(trade.time)}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function HyperliquidDemo() {
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">
            useSubscribe Demo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            BTC and ETH perpetual market feeds
          </h2>
        </div>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Each panel opens a live Hyperliquid subscription through the shared
          hook. The demo uses the official `SubscriptionClient` methods for
          `l2Book` and `trades` instead of a custom websocket wrapper.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {DEMO_COINS.map((coin) => (
            <OrderbookPanel coin={coin} key={`book-${coin}`} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {DEMO_COINS.map((coin) => (
            <TradesPanel coin={coin} key={`trades-${coin}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
