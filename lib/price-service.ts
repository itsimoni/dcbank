"use client";

class PriceService {
  private cryptoCache: any = null;
  private exchangeCache: any = null;
  private lastCryptoFetch = 0;
  private lastExchangeFetch = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private async fetchFromCoinGecko() {
    const cryptoIds = "bitcoin,ethereum,tether,ripple,cardano,solana,polkadot,litecoin,bitcoin-cash,chainlink";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`CoinGecko failed: ${response.status}`);
    return await response.json();
  }

  private async fetchFromCoinCap() {
    const symbols = ["bitcoin", "ethereum", "tether", "ripple", "cardano", "solana", "polkadot", "litecoin", "bitcoin-cash", "chainlink"];
    const promises = symbols.map(async (id) => {
      const response = await fetch(
        `https://api.coincap.io/v2/assets/${id}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error("CoinCap failed");
      const data = await response.json();
      return {
        id,
        usd: parseFloat(data.data.priceUsd),
        usd_24h_change: parseFloat(data.data.changePercent24Hr),
      };
    });

    const results = await Promise.all(promises);
    const formatted: any = {};
    results.forEach((item) => {
      formatted[item.id] = {
        usd: item.usd,
        usd_24h_change: item.usd_24h_change,
      };
    });
    return formatted;
  }

  private async fetchFromBinance() {
    const symbols = [
      { id: "bitcoin", symbol: "BTCUSDT" },
      { id: "ethereum", symbol: "ETHUSDT" },
      { id: "tether", symbol: "USDCUSDT" },
      { id: "ripple", symbol: "XRPUSDT" },
      { id: "cardano", symbol: "ADAUSDT" },
      { id: "solana", symbol: "SOLUSDT" },
      { id: "polkadot", symbol: "DOTUSDT" },
      { id: "litecoin", symbol: "LTCUSDT" },
      { id: "bitcoin-cash", symbol: "BCHUSDT" },
      { id: "chainlink", symbol: "LINKUSDT" },
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
        usd: parseFloat(data.lastPrice),
        usd_24h_change: parseFloat(data.priceChangePercent),
      };
    });

    const results = await Promise.all(promises);
    const formatted: any = {};
    results.forEach((item) => {
      formatted[item.id] = {
        usd: item.usd,
        usd_24h_change: item.usd_24h_change,
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
        bitcoin: { usd: 43250, usd_24h_change: 0 },
        ethereum: { usd: 2650, usd_24h_change: 0 },
        tether: { usd: 1.0, usd_24h_change: 0 },
        ripple: { usd: 0.55, usd_24h_change: 0 },
        cardano: { usd: 0.48, usd_24h_change: 0 },
        solana: { usd: 98, usd_24h_change: 0 },
        polkadot: { usd: 6.5, usd_24h_change: 0 },
        litecoin: { usd: 85, usd_24h_change: 0 },
        "bitcoin-cash": { usd: 320, usd_24h_change: 0 },
        chainlink: { usd: 15, usd_24h_change: 0 },
      }
    );
  }

  private async fetchFromExchangeRateHost() {
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=USD",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`ExchangeRate.host failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromExchangeRateAPI() {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`ExchangeRate-API failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromFrankfurter() {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=USD",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`Frankfurter failed: ${response.status}`);
    const data = await response.json();
    return data.rates;
  }

  async getExchangeRates() {
    const now = Date.now();

    if (
      this.exchangeCache &&
      now - this.lastExchangeFetch < this.CACHE_DURATION
    ) {
      return this.exchangeCache;
    }

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
        EUR: 0.92,
        GBP: 0.78,
        JPY: 149.5,
        CHF: 0.88,
        CAD: 1.35,
        AUD: 1.52,
        CNY: 7.24,
        INR: 83.12,
      }
    );
  }
}

export const priceService = new PriceService();
