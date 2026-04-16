"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { countryCurrencyMap } from "@/lib/currency-map";

interface CurrencyContextType {
  country: string;
  setCountry: (country: string) => void;
  currencyCode: string;
  formatPrice: (amountInUSD: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const API_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "morchantra_exchange_rates";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState("United States");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load saved country on mount
  useEffect(() => {
    const savedCountry = localStorage.getItem("morchantra_user_country");
    if (savedCountry && countryCurrencyMap[savedCountry]) {
      setCountryState(savedCountry);
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Check cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setRates(data);
            setIsLoading(false);
            return;
          }
        }

        // Fetch new
        const res = await fetch(API_URL);
        const json = await res.json();
        
        if (json.result === "success") {
          setRates(json.rates);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: json.rates
          }));
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    localStorage.setItem("morchantra_user_country", newCountry);
  };

  const currencyCode = countryCurrencyMap[country] || "USD";

  const formatPrice = (amountInUSD: number) => {
    const rate = rates[currencyCode] || 1;
    const convertedAmount = amountInUSD * rate;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  return (
    <CurrencyContext.Provider value={{ country, setCountry, currencyCode, formatPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
