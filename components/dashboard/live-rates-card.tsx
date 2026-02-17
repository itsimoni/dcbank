"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { priceService } from "@/lib/price-service";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";

interface LiveRatesCardProps {
  language?: string;
}

export default function LiveRatesCard({ language = "en" }: LiveRatesCardProps) {
  const { language: contextLanguage } = useLanguage();
  const t = getTranslations(contextLanguage);
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
      price: cryptoPrices?.bitcoin?.eur || 39800,
      change: cryptoPrices?.bitcoin?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: cryptoPrices?.ethereum?.eur || 2440,
      change: cryptoPrices?.ethereum?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
    },
    {
      symbol: "USDT",
      name: "Tether",
      price: cryptoPrices?.tether?.eur || 0.92,
      change: cryptoPrices?.tether?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
    },
    {
      symbol: "XRP",
      name: "Ripple",
      price: cryptoPrices?.ripple?.eur || 0.51,
      change: cryptoPrices?.ripple?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/xrp.svg",
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: cryptoPrices?.solana?.eur || 90,
      change: cryptoPrices?.solana?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/sol.svg",
    },
    {
      symbol: "ADA",
      name: "Cardano",
      price: cryptoPrices?.cardano?.eur || 0.44,
      change: cryptoPrices?.cardano?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/ada.svg",
    },
    {
      symbol: "LTC",
      name: "Litecoin",
      price: cryptoPrices?.litecoin?.eur || 78,
      change: cryptoPrices?.litecoin?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/ltc.svg",
    },
    {
      symbol: "DOT",
      name: "Polkadot",
      price: cryptoPrices?.polkadot?.eur || 6.0,
      change: cryptoPrices?.polkadot?.eur_24h_change || 0,
      icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/dot.svg",
    },
  ];

  const fiatData = [
    {
      symbol: "USD",
      name: "US Dollar",
      rate: exchangeRates?.USD || 1.087,
      flag: "🇺🇸",
    },
    {
      symbol: "GBP",
      name: "British Pound",
      rate: exchangeRates?.GBP || 0.85,
      flag: "🇬🇧",
    },
    {
      symbol: "JPY",
      name: "Japanese Yen",
      rate: exchangeRates?.JPY || 162.5,
      flag: "🇯🇵",
    },
    {
      symbol: "CHF",
      name: "Swiss Franc",
      rate: exchangeRates?.CHF || 0.96,
      flag: "🇨🇭",
    },
    {
      symbol: "CAD",
      name: "Canadian Dollar",
      rate: exchangeRates?.CAD || 1.47,
      flag: "🇨🇦",
    },
    {
      symbol: "AUD",
      name: "Australian Dollar",
      rate: exchangeRates?.AUD || 1.65,
      flag: "🇦🇺",
    },
    {
      symbol: "CNY",
      name: "Chinese Yuan",
      rate: exchangeRates?.CNY || 7.87,
      flag: "🇨🇳",
    },
    {
      symbol: "INR",
      name: "Indian Rupee",
      rate: exchangeRates?.INR || 90.4,
      flag: "🇮🇳",
    },
  ];

  return (
    <Card className="h-full bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {t.liveRates}
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
                {t.cryptocurrency}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cryptoData.map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={crypto.icon || "/placeholder.svg"}
                        alt={crypto.name}
                        className="w-7 h-7"
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
                      <div className="font-bold text-xs">
                        €{formatPrice(crypto.price, crypto.symbol === "BTC" ? 0 : crypto.price < 1 ? 4 : 2)}
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
                {t.fiatExchange}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {fiatData.map((fiat) => (
                  <div
                    key={fiat.symbol}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-xl">{fiat.flag}</div>
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
                      <div className="font-bold text-xs">
                        {formatPrice(fiat.rate, fiat.symbol === "JPY" || fiat.symbol === "INR" || fiat.symbol === "CNY" ? 2 : 4)} {fiat.symbol}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.perCurrency} EUR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
