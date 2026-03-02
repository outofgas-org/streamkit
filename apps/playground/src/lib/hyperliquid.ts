import {
  HttpTransport,
  InfoClient,
  SubscriptionClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";

export const HYPERLIQUID_WS_URL = "wss://api.hyperliquid.xyz/ws";

export const transport = new HttpTransport();

export const wsTransport = new WebSocketTransport();

export const wsClient = new SubscriptionClient({ transport: wsTransport });

export const infoClient = new InfoClient({ transport });
