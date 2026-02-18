import { valoreForexService } from "./valore-forex-service";

export interface ExchangeRates {
  fiat: { [key: string]: number };
  crypto: { [key: string]: number };
  lastUpdated: number;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private rates: ExchangeRates = {
    fiat: { USD: 1 },
    crypto: {},
    lastUpdated: 0,
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: ((rates: ExchangeRates) => void)[] = [];
  private valoreUnsubscribe: (() => void) | null = null;

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  async initialize() {
    this.valoreUnsubscribe = valoreForexService.subscribe((forexRates) => {
      this.rates.fiat = forexRates;
      this.rates.lastUpdated = Date.now();
      this.listeners.forEach((listener) => listener(this.rates));
      console.log("Updated fiat rates from Valore WebSocket");
    });

    await this.updateRates();
    this.startAutoUpdate();
  }

  private async updateRates() {
    try {
      console.log("Fetching exchange rates from public APIs...");

      // Initialize rates object
      const rates: ExchangeRates = {
        fiat: { USD: 1 },
        crypto: {},
        lastUpdated: Date.now(),
      };

      const valoreRates = valoreForexService.getRates();

      if (valoreForexService.isConnected() && Object.keys(valoreRates).length > 0) {
        console.log("Using real-time fiat rates from Valore WebSocket");
        rates.fiat = valoreRates;
      } else {
        try {
          console.log("Fetching fiat exchange rates from REST API fallback...");
          const fiatResponse = await fetch(
            "https://api.exchangerate-api.com/v4/latest/USD",
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (fiatResponse.ok) {
            const fiatData = await fiatResponse.json();

            if (fiatData.rates) {
              rates.fiat = {
                USD: 1,
                EUR: fiatData.rates.EUR,
                CAD: fiatData.rates.CAD,
                GBP: fiatData.rates.GBP,
                JPY: fiatData.rates.JPY,
                AUD: fiatData.rates.AUD,
                CHF: fiatData.rates.CHF,
              };

              console.log("Fiat rates fetched successfully from REST API");
            }
          } else {
            throw new Error(`Fiat API error: ${fiatResponse.status}`);
          }
        } catch (fiatError: any) {
          console.warn(
            "Failed to fetch fiat rates, using fallback:",
            fiatError.message
          );
          rates.fiat = {
            USD: 1,
            EUR: 0.85,
            CAD: 1.35,
            GBP: 0.75,
            JPY: 110,
            AUD: 1.45,
            CHF: 0.92,
          };
        }
      }

      const cryptoSources = [
        {
          name: "CoinCap",
          fetch: async () => {
            const symbols = ["bitcoin", "ethereum", "tether", "cardano", "polkadot", "chainlink"];
            const promises = symbols.map(async (id) => {
              const response = await fetch(
                `https://api.coincap.io/v2/assets/${id}`,
                {
                  signal: AbortSignal.timeout(8000),
                  headers: { Accept: "application/json" }
                }
              );
              if (!response.ok) throw new Error(`CoinCap failed for ${id}`);
              const data = await response.json();
              return { id, usd: parseFloat(data.data.priceUsd) };
            });
            const results = await Promise.all(promises);
            return {
              BTC: results.find(r => r.id === "bitcoin")?.usd || 85000,
              ETH: results.find(r => r.id === "ethereum")?.usd || 3200,
              USDT: results.find(r => r.id === "tether")?.usd || 1,
              ADA: results.find(r => r.id === "cardano")?.usd || 0.9,
              DOT: results.find(r => r.id === "polkadot")?.usd || 7,
              LINK: results.find(r => r.id === "chainlink")?.usd || 22,
            };
          }
        },
        {
          name: "CoinGecko",
          fetch: async () => {
            const cryptoResponse = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,cardano,polkadot,chainlink&vs_currencies=usd",
              {
                signal: AbortSignal.timeout(10000),
                headers: { Accept: "application/json" }
              }
            );
            if (!cryptoResponse.ok) throw new Error(`CoinGecko failed: ${cryptoResponse.status}`);
            const cryptoData = await cryptoResponse.json();
            return {
              BTC: cryptoData.bitcoin?.usd || 85000,
              ETH: cryptoData.ethereum?.usd || 3200,
              USDT: cryptoData.tether?.usd || 1,
              ADA: cryptoData.cardano?.usd || 0.9,
              DOT: cryptoData.polkadot?.usd || 7,
              LINK: cryptoData.chainlink?.usd || 22,
            };
          }
        }
      ];

      let cryptoFetched = false;
      for (const source of cryptoSources) {
        try {
          console.log(`Fetching crypto prices from ${source.name}...`);
          rates.crypto = await source.fetch();
          console.log(`Crypto rates fetched successfully from ${source.name}`);
          cryptoFetched = true;
          break;
        } catch (cryptoError: any) {
          console.warn(`${source.name} failed:`, cryptoError.message);
        }
      }

      if (!cryptoFetched) {
        console.warn("All crypto sources failed, using fallback");
        rates.crypto = {
          BTC: 85000,
          ETH: 3200,
          USDT: 1,
          ADA: 0.9,
          DOT: 7,
          LINK: 22,
        };
      }

      this.rates = rates;
      this.listeners.forEach((listener) => listener(this.rates));
      console.log(
        "Exchange rates updated successfully at",
        new Date().toLocaleTimeString()
      );
    } catch (error: any) {
      console.error("Failed to fetch exchange rates:", error.message || error);

      // Use complete fallback rates if everything fails
      this.rates = {
        fiat: {
          USD: 1,
          EUR: 0.85,
          CAD: 1.35,
          GBP: 0.75,
          JPY: 110,
          AUD: 1.45,
          CHF: 0.92,
        },
        crypto: {
          BTC: 85000,
          ETH: 3200,
          USDT: 1,
          ADA: 0.9,
          DOT: 7,
          LINK: 22,
        },
        lastUpdated: Date.now(),
      };

      this.listeners.forEach((listener) => listener(this.rates));
      console.log("Using complete fallback exchange rates");
    }
  }

  private startAutoUpdate() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateRates();
    }, 300000);
  }

  subscribe(listener: (rates: ExchangeRates) => void) {
    this.listeners.push(listener);
    if (this.rates.lastUpdated > 0) {
      listener(this.rates);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getRates(): ExchangeRates {
    return this.rates;
  }

  convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    if (fromCurrency === toCurrency) return amount;

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    let usdValue = amount;

    if (from !== "USD") {
      if (this.rates.fiat[from]) {
        usdValue = amount / this.rates.fiat[from];
      } else if (this.rates.crypto[from]) {
        usdValue = amount * this.rates.crypto[from];
      }
    }

    if (to === "USD") {
      return usdValue;
    } else if (this.rates.fiat[to]) {
      return usdValue * this.rates.fiat[to];
    } else if (this.rates.crypto[to]) {
      return usdValue / this.rates.crypto[to];
    }

    return amount; // fallback
  }

  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    return this.convertCurrency(1, fromCurrency, toCurrency);
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.valoreUnsubscribe) {
      this.valoreUnsubscribe();
      this.valoreUnsubscribe = null;
    }
    this.listeners = [];
  }
}
