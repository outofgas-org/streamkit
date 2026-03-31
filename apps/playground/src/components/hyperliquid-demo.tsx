import { useState } from "react";
import { wsClient } from "../lib/hyperliquid";
import { usePerpOrderbook, usePerpTrades } from "../hooks/use-hyperliquid";
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
const LEVEL_OPTIONS = [5, 4, 3, 2] as const;

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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0.00%";

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function OrderbookPanel({ coin }: { coin: string }) {
  const [nSigFigs, setNSigFigs] = useState<number | undefined>(undefined);
  const state = usePerpOrderbook(wsClient, coin, { nSigFigs });
  const orderbook = state.data;

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
            {state.loading
              ? "Connecting to feed..."
              : "Waiting for first snapshot..."}
          </p>
        ) : null}

        {orderbook ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Spread
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-900">
                      {formatPrice(orderbook.spread)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Spread %
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-900">
                      {formatPercent(orderbook.spreadPercent)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  htmlFor={`${coin}-levels`}
                >
                  Levels
                </label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-sky-300"
                  id={`${coin}-levels`}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNSigFigs(value === "raw" ? undefined : Number(value));
                  }}
                  value={nSigFigs === undefined ? "raw" : String(nSigFigs)}
                >
                  <option value="raw">Raw book</option>
                  {(orderbook.levels.length > 0
                    ? orderbook.levels.map((level) => ({
                        value: level.nSigFigs,
                        label: `${level.nSigFigs}sf / ${level.tick}`,
                      }))
                    : LEVEL_OPTIONS.map((value) => ({
                        value,
                        label: `${value}sf`,
                      }))
                  ).map((option) => (
                    <option
                      key={`${coin}-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                  Asks
                </p>
                <div className="mb-2 grid grid-cols-3 gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="space-y-1 font-mono text-xs text-slate-700">
                  {orderbook.asks.map(([price, size, cumulativeSize]) => (
                    <div
                      className="relative grid grid-cols-3 gap-3 overflow-hidden rounded-lg"
                      key={`ask-${price}-${size}`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-100/80"
                        style={{
                          width: `${(cumulativeSize / Math.max(orderbook.maxCumulativeSize, 1)) * 100}%`,
                        }}
                      />
                      <span className="relative text-rose-600">
                        {formatPrice(price)}
                      </span>
                      <span className="relative text-right">
                        {formatSize(size)}
                      </span>
                      <span className="relative text-right text-slate-500">
                        {formatSize(cumulativeSize)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Bids
                </p>
                <div className="mb-2 grid grid-cols-3 gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="space-y-1 font-mono text-xs text-slate-700">
                  {orderbook.bids.map(([price, size, cumulativeSize]) => (
                    <div
                      className="relative grid grid-cols-3 gap-3 overflow-hidden rounded-lg"
                      key={`bid-${price}-${size}`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-100/80"
                        style={{
                          width: `${(cumulativeSize / Math.max(orderbook.maxCumulativeSize, 1)) * 100}%`,
                        }}
                      />
                      <span className="relative text-emerald-600">
                        {formatPrice(price)}
                      </span>
                      <span className="relative text-right">
                        {formatSize(size)}
                      </span>
                      <span className="relative text-right text-slate-500">
                        {formatSize(cumulativeSize)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TradesPanel({ coin }: { coin: string }) {
  const state = usePerpTrades(wsClient, coin);

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
            {state.loading
              ? "Connecting to feed..."
              : "Waiting for first trades..."}
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
                  <span
                    className={
                      trade.side === "B" ? "text-emerald-600" : "text-rose-600"
                    }
                  >
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
