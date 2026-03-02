import { BackgroundOrbs } from "./components/background-orbs";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { HyperliquidDemo } from "./components/hyperliquid-demo";
import { LiveIndicator } from "./components/live-indicator";

export function App() {
  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <BackgroundOrbs />

      <div className="container mx-auto max-w-6xl space-y-12 relative z-10">
        <Hero
          title="StreamKit"
          subtitle="useSubscribe Playground"
          description="Live Hyperliquid perpetual orderbook and trades demos for BTC and ETH."
        />

        <div className="flex justify-center">
          <LiveIndicator />
        </div>

        <HyperliquidDemo />

        <Footer
          technologies={["Bun", "React", "TypeScript", "Tailwind", "WebSocket"]}
        />
      </div>
    </main>
  );
}
