"use client";

import { valoreForexService } from "./valore-forex-service";

class PriceService {
  private cryptoCache: any = null;
  private exchangeCache: any = null;
  private lastCryptoFetch = 0;
  private lastExchangeFetch = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private async fetchFromCoinGecko() {
    const cryptoIds = "bitcoin,ethereum,tether,ripple,cardano,solana,polkadot,litecoin,bitcoin-cash,chainlink";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=eur&include_24hr_change=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`CoinGecko failed: ${response.status}`);
    return await response.json();
  }

  private async fetchFromCoinCap() {
    const symbols = ["bitcoin", "ethereum", "tether", "ripple", "cardano", "solana", "polkadot", "litecoin", "bitcoin-cash", "chainlink"];

    const eurRateResponse = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", { signal: AbortSignal.timeout(5000) });
    const eurRateData = await eurRateResponse.json();
    const usdToEur = eurRateData.rates.EUR;

    const promises = symbols.map(async (id) => {
      const response = await fetch(
        `https://api.coincap.io/v2/assets/${id}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error("CoinCap failed");
      const data = await response.json();
      return {
        id,
        eur: parseFloat(data.data.priceUsd) * usdToEur,
        eur_24h_change: parseFloat(data.data.changePercent24Hr),
      };
    });

    const results = await Promise.all(promises);
    const formatted: any = {};
    results.forEach((item) => {
      formatted[item.id] = {
        eur: item.eur,
        eur_24h_change: item.eur_24h_change,
      };
    });
    return formatted;
  }

  private async fetchFromBinance() {
    const symbols = [
      { id: "bitcoin", symbol: "BTCEUR" },
      { id: "ethereum", symbol: "ETHEUR" },
      { id: "tether", symbol: "USDCEUR" },
      { id: "ripple", symbol: "XRPEUR" },
      { id: "cardano", symbol: "ADAEUR" },
      { id: "solana", symbol: "SOLEUR" },
      { id: "polkadot", symbol: "DOTEUR" },
      { id: "litecoin", symbol: "LTCEUR" },
      { id: "bitcoin-cash", symbol: "BCHEUR" },
      { id: "chainlink", symbol: "LINKEUR" },
    ];

    const promises = symbols.map(async ({ id, symbol }) => {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error("Binance failed");
      const data = await response.json();
      return {
        id,
        eur: parseFloat(data.lastPrice),
        eur_24h_change: parseFloat(data.priceChangePercent),
      };
    });

    const results = await Promise.all(promises);
    const formatted: any = {};
    results.forEach((item) => {
      formatted[item.id] = {
        eur: item.eur,
        eur_24h_change: item.eur_24h_change,
      };
    });
    return formatted;
  }

  async getCryptoPrices() {
    const now = Date.now();

    if (this.cryptoCache && now - this.lastCryptoFetch < this.CACHE_DURATION) {
      return this.cryptoCache;
    }

    const sources = [
      { name: "CoinGecko", fetch: () => this.fetchFromCoinGecko() },
      { name: "CoinCap", fetch: () => this.fetchFromCoinCap() },
      { name: "Binance", fetch: () => this.fetchFromBinance() },
    ];

    for (const source of sources) {
      try {
        console.log(`Attempting to fetch crypto prices from ${source.name}...`);
        const data = await source.fetch();
        this.cryptoCache = data;
        this.lastCryptoFetch = now;
        console.log(`Successfully fetched crypto prices from ${source.name}`);
        return data;
      } catch (error) {
        console.warn(`${source.name} failed:`, error);
        continue;
      }
    }

    console.error("All crypto price sources failed, using fallback data");
    return (
      this.cryptoCache || {
        bitcoin: { eur: 39800, eur_24h_change: 0 },
        ethereum: { eur: 2440, eur_24h_change: 0 },
        tether: { eur: 0.92, eur_24h_change: 0 },
        ripple: { eur: 0.51, eur_24h_change: 0 },
        cardano: { eur: 0.44, eur_24h_change: 0 },
        solana: { eur: 90, eur_24h_change: 0 },
        polkadot: { eur: 6.0, eur_24h_change: 0 },
        litecoin: { eur: 78, eur_24h_change: 0 },
        "bitcoin-cash": { eur: 294, eur_24h_change: 0 },
        chainlink: { eur: 13.8, eur_24h_change: 0 },
      }
    );
  }

  private async fetchFromExchangeRateHost() {
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=EUR",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`ExchangeRate.host failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromExchangeRateAPI() {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/EUR",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`ExchangeRate-API failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromFrankfurter() {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=EUR",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`Frankfurter failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  async getExchangeRates() {
    const valoreRates = valoreForexService.getRates();

    if (valoreForexService.isConnected() && Object.keys(valoreRates).length > 0) {
      console.log("Using real-time forex rates from Valore Capital WebSocket");
      this.exchangeCache = valoreRates;
      return valoreRates;
    }

    const now = Date.now();

    if (
      this.exchangeCache &&
      now - this.lastExchangeFetch < this.CACHE_DURATION
    ) {
      return this.exchangeCache;
    }

    console.log("Valore WebSocket not available, falling back to REST APIs");
    const sources = [
      { name: "ExchangeRate.host", fetch: () => this.fetchFromExchangeRateHost() },
      { name: "ExchangeRate-API", fetch: () => this.fetchFromExchangeRateAPI() },
      { name: "Frankfurter", fetch: () => this.fetchFromFrankfurter() },
    ];

    for (const source of sources) {
      try {
        console.log(`Attempting to fetch exchange rates from ${source.name}...`);
        const data = await source.fetch();
        this.exchangeCache = data;
        this.lastExchangeFetch = now;
        console.log(`Successfully fetched exchange rates from ${source.name}`);
        return data;
      } catch (error) {
        console.warn(`${source.name} failed:`, error);
        continue;
      }
    }

    console.error("All exchange rate sources failed, using fallback data");
    return (
      this.exchangeCache || {
        USD: 1.087,
        GBP: 0.85,
        JPY: 162.5,
        CHF: 0.96,
        CAD: 1.47,
        AUD: 1.65,
        CNY: 7.87,
        INR: 90.4,
      }
    );
  }
}

export const priceService = new PriceService();
