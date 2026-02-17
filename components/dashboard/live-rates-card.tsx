"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { priceService } from "@/lib/price-service";

interface LiveRatesCardProps {
  language?: string;
}

export default function LiveRatesCard({ language = "en" }: LiveRatesCardProps) {
  const [cryptoPrices, setCryptoPrices] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const [crypto, fiat] = await Promise.all([
        priceService.getCryptoPrices(),
        priceService.getExchangeRates(),
      ]);

      setCryptoPrices(crypto);
      setExchangeRates(fiat);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rates:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, decimals: number = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  const cryptoData = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: cryptoPrices?.bitcoin?.usd || 0,
      change: cryptoPrices?.bitcoin?.usd_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: cryptoPrices?.ethereum?.usd || 0,
      change: cryptoPrices?.ethereum?.usd_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
    },
    {
      symbol: "USDT",
      name: "Tether",
      price: 1.0,
      change: 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
    },
  ];

  const fiatData = [
    {
      symbol: "EUR",
      name: "Euro",
      rate: exchangeRates?.EUR || 0.92,
      flag: "🇪🇺",
    },
    {
      symbol: "CAD",
      name: "Canadian Dollar",
      rate: exchangeRates?.CAD || 1.35,
      flag: "🇨🇦",
    },
    {
      symbol: "GBP",
      name: "British Pound",
      rate: exchangeRates?.GBP || 0.78,
      flag: "🇬🇧",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#b91c1c]" />
            Live Rates
          </CardTitle>
          <div className="flex items-center gap-2">
            <RefreshCw
              className="h-4 w-4 text-gray-400 cursor-pointer hover:text-[#b91c1c] transition-colors"
              onClick={fetchRates}
            />
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Cryptocurrency
              </h3>
              <div className="space-y-2">
                {cryptoData.map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={crypto.icon || "/placeholder.svg"}
                        alt={crypto.name}
                        className="w-8 h-8"
                      />
                      <div>
                        <div className="font-semibold text-sm">
                          {crypto.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {crypto.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        ${formatPrice(crypto.price, crypto.symbol === "BTC" ? 0 : 2)}
                      </div>
                      {crypto.change !== 0 && (
                        <div
                          className={`text-xs font-medium flex items-center gap-1 justify-end ${
                            crypto.change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {crypto.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatChange(crypto.change)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Fiat Exchange (vs USD)
              </h3>
              <div className="space-y-2">
                {fiatData.map((fiat) => (
                  <div
                    key={fiat.symbol}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{fiat.flag}</div>
                      <div>
                        <div className="font-semibold text-sm">
                          {fiat.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fiat.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        1 USD = {formatPrice(fiat.rate, 4)} {fiat.symbol}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatPrice(1 / fiat.rate, 4)} USD = 1 {fiat.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Badge variant="outline" className="text-xs">
                  Live Data
                </Badge>
                <span>Updates every 30 seconds</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
