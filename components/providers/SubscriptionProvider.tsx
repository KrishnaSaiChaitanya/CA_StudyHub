"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchAndCacheAuthState, getCachedSubscription } from "@/utils/auth";

interface SubscriptionContextType {
  isSubscribed: boolean;
  planName: string | null;
  expiryDate: string | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  planName: null,
  expiryDate: null,
  isLoading: true,
  checkSubscription: async () => {},
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const checkSubscription = async () => {
    setIsLoading(true);
    try {
      const { isSubscribed: sub, planName: plan, expiryDate: exp } = await fetchAndCacheAuthState(supabase);
      setIsSubscribed(sub);
      setPlanName(plan || null);
      setExpiryDate(exp || null);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setIsSubscribed(false);
      setPlanName(null);
      setExpiryDate(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = getCachedSubscription();
    if (cached && cached.isSubscribed !== null) {
      setIsSubscribed(cached.isSubscribed);
      setPlanName(cached.planName || null);
      setExpiryDate(cached.expiryDate || null);
      setIsLoading(false);
      return;
    }
    checkSubscription();
  }, [supabase.auth]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, planName, expiryDate, isLoading, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
