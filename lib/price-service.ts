"use client";

import { valoreForexService } from "./valore-forex-service";

const CRYPTO_STORAGE_KEY = 'price_service_crypto_cache';
const EXCHANGE_STORAGE_KEY = 'price_service_exchange_cache';

class PriceService {
  private cryptoCache: any = null;
  private exchangeCache: any = null;
  private lastCryptoFetch = 0;
  private lastExchangeFetch = 0;
  private readonly CACHE_DURATION = 60000;
  private readonly STORAGE_CACHE_DURATION = 300000;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const cryptoStored = localStorage.getItem(CRYPTO_STORAGE_KEY);
      if (cryptoStored) {
        const parsed = JSON.parse(cryptoStored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < this.STORAGE_CACHE_DURATION) {
          this.cryptoCache = parsed.data;
          this.lastCryptoFetch = parsed.timestamp;
        }
      }
      const exchangeStored = localStorage.getItem(EXCHANGE_STORAGE_KEY);
      if (exchangeStored) {
        const parsed = JSON.parse(exchangeStored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < this.STORAGE_CACHE_DURATION) {
          this.exchangeCache = parsed.data;
          this.lastExchangeFetch = parsed.timestamp;
        }
      }
    } catch {
    }
  }

  private saveToStorage(key: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
    }
  }

  private async fetchFromCoinGecko() {
    const cryptoIds = "bitcoin,ethereum,tether,ripple,cardano,solana,polkadot,litecoin,bitcoin-cash,chainlink";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=eur&include_24hr_change=true`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko failed: ${response.status} - ${errorText}`);
    }
    return await response.json();
  }

  private async fetchFromCoinCap() {
    const symbols = ["bitcoin", "ethereum", "tether", "xrp", "cardano", "solana", "polkadot", "litecoin", "bitcoin-cash", "chainlink"];

    let usdToEur = 0.92;
    try {
      const eurRateResponse = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      if (eurRateResponse.ok) {
        const eurRateData = await eurRateResponse.json();
        usdToEur = eurRateData.rates.EUR;
      }
    } catch (error) {
      console.warn("Failed to fetch EUR rate, using fallback");
    }

    const promises = symbols.map(async (id) => {
      const response = await fetch(
        `https://api.coincap.io/v2/assets/${id}`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/json' }
        }
      );
      if (!response.ok) throw new Error(`CoinCap failed for ${id}: ${response.status}`);
      const data = await response.json();

      const actualId = id === "xrp" ? "ripple" : id;

      return {
        id: actualId,
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
      { id: "tether", symbol: "USDTEUR" },
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
        {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/json' }
        }
      );
      if (!response.ok) throw new Error(`Binance failed for ${symbol}: ${response.status}`);
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

  private async fetchFromKraken() {
    const pairs = [
      { id: "bitcoin", pair: "XXBTZEUR" },
      { id: "ethereum", pair: "XETHZEUR" },
      { id: "tether", pair: "USDTZEUR" },
      { id: "ripple", pair: "XXRPZEUR" },
      { id: "cardano", pair: "ADAEUR" },
      { id: "solana", pair: "SOLEUR" },
      { id: "polkadot", pair: "DOTEUR" },
      { id: "litecoin", pair: "XLTCZEUR" },
      { id: "bitcoin-cash", pair: "BCHEUR" },
      { id: "chainlink", pair: "LINKEUR" },
    ];

    const pairString = pairs.map(p => p.pair).join(',');
    const response = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${pairString}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) throw new Error(`Kraken failed: ${response.status}`);
    const data = await response.json();

    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }

    const formatted: any = {};
    pairs.forEach(({ id, pair }) => {
      const result = data.result[pair];
      if (result) {
        formatted[id] = {
          eur: parseFloat(result.c[0]),
          eur_24h_change: parseFloat(result.p[1]) ?
            ((parseFloat(result.c[0]) - parseFloat(result.o)) / parseFloat(result.o)) * 100 : 0,
        };
      }
    });

    return formatted;
  }

  async getCryptoPrices() {
    const now = Date.now();

    if (this.cryptoCache && now - this.lastCryptoFetch < this.CACHE_DURATION) {
      return this.cryptoCache;
    }

    try {
      const data = await this.fetchFromCoinGecko();
      if (Object.keys(data).length > 0) {
        this.cryptoCache = data;
        this.lastCryptoFetch = now;
        this.saveToStorage(CRYPTO_STORAGE_KEY, data);
        return data;
      }
    } catch (error: any) {
      console.warn("CoinGecko failed:", error?.message || error);
    }

    return (
      this.cryptoCache || {
        bitcoin: { eur: 85000, eur_24h_change: 0 },
        ethereum: { eur: 3200, eur_24h_change: 0 },
        tether: { eur: 0.92, eur_24h_change: 0 },
        ripple: { eur: 2.1, eur_24h_change: 0 },
        cardano: { eur: 0.85, eur_24h_change: 0 },
        solana: { eur: 185, eur_24h_change: 0 },
        polkadot: { eur: 6.5, eur_24h_change: 0 },
        litecoin: { eur: 95, eur_24h_change: 0 },
        "bitcoin-cash": { eur: 380, eur_24h_change: 0 },
        chainlink: { eur: 21, eur_24h_change: 0 },
      }
    );
  }

  private async fetchFromFloatRates() {
    const response = await fetch(
      "https://www.floatrates.com/daily/eur.json",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`FloatRates failed: ${response.status}`);
    const data = await response.json();
    const rates: any = {};
    Object.keys(data).forEach((key) => {
      rates[key.toUpperCase()] = data[key].rate;
    });
    return rates;
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
      this.exchangeCache = valoreRates;
      this.saveToStorage(EXCHANGE_STORAGE_KEY, valoreRates);
      return valoreRates;
    }

    const now = Date.now();

    if (
      this.exchangeCache &&
      now - this.lastExchangeFetch < this.CACHE_DURATION
    ) {
      return this.exchangeCache;
    }

    const sources = [
      { name: "ExchangeRate-API", fetch: () => this.fetchFromExchangeRateAPI() },
      { name: "Frankfurter", fetch: () => this.fetchFromFrankfurter() },
      { name: "FloatRates", fetch: () => this.fetchFromFloatRates() },
    ];

    for (const source of sources) {
      try {
        const data = await source.fetch();
        this.exchangeCache = data;
        this.lastExchangeFetch = now;
        this.saveToStorage(EXCHANGE_STORAGE_KEY, data);
        return data;
      } catch (error) {
        console.warn(`${source.name} failed:`, error);
        continue;
      }
    }

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
