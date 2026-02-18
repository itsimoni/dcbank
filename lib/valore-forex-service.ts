"use client";

export interface ForexRates {
  [currency: string]: number;
}

type RateUpdateCallback = (rates: ForexRates) => void;

class ValoreForexService {
  private ws: WebSocket | null = null;
  private rates: ForexRates = {};
  private listeners: Set<RateUpdateCallback> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isConnecting = false;
  private shouldReconnect = true;
  private readonly WS_URL = "wss://stream.valore.capital";

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log("[ValoreForex] Connecting to Valore Capital WebSocket...");

    try {
      this.ws = new WebSocket(this.WS_URL);

      this.ws.onopen = () => {
        console.log("[ValoreForex] Connected successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "forex" && data.rates) {
            this.rates = data.rates;
            this.notifyListeners();
          }
        } catch (error) {
          console.error("[ValoreForex] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[ValoreForex] WebSocket error:", error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log("[ValoreForex] Connection closed");
        this.isConnecting = false;
        this.ws = null;

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`[ValoreForex] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("[ValoreForex] Failed to create WebSocket:", error);
      this.isConnecting = false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.rates });
      } catch (error) {
        console.error("[ValoreForex] Error in listener callback:", error);
      }
    });
  }

  subscribe(callback: RateUpdateCallback): () => void {
    this.listeners.add(callback);

    if (Object.keys(this.rates).length > 0) {
      callback({ ...this.rates });
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  getRates(): ForexRates {
    return { ...this.rates };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
    console.log("[ValoreForex] Disconnected");
  }

  reconnect() {
    this.disconnect();
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export const valoreForexService = new ValoreForexService();
