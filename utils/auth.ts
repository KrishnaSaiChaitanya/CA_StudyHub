import type { SupabaseClient } from "@supabase/supabase-js";

export const USER_CACHE_KEY = "CAStudyHub_auth_user";
export const SUBSCRIPTION_CACHE_KEY = "CAStudyHub_isSubscribed";
export const STUDENT_LEVEL_CACHE_KEY = "CAStudyHub_student_level";

const isBrowser = typeof window !== "undefined";

export const getCachedUser = () => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const SUBSCRIPTION_DATA_CACHE_KEY = "CAStudyHub_subscription_data";

export const getCachedStudentLevel = (): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(STUDENT_LEVEL_CACHE_KEY);
  } catch {
    return null;
  }
};

export const cacheStudentLevel = (level: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STUDENT_LEVEL_CACHE_KEY, level);
  } catch {
    // ignore localStorage failures
  }
};

export const clearStudentLevelCache = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STUDENT_LEVEL_CACHE_KEY);
  } catch {
    // ignore localStorage failures
  }
};

export const getCachedSubscription = () => {
  if (!isBrowser) return null;
  try {
    const rawSub = window.localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    const rawData = window.localStorage.getItem(SUBSCRIPTION_DATA_CACHE_KEY);
    return {
      isSubscribed: rawSub !== null ? JSON.parse(rawSub) : null,
      planName: rawData ? JSON.parse(rawData).planName : null,
      expiryDate: rawData ? JSON.parse(rawData).expiryDate : null
    };
  } catch {
    return { isSubscribed: null, planName: null, expiryDate: null };
  }
};

export const cacheAuthState = (user: any, isSubscribed: boolean, planName?: string, expiryDate?: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    window.localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(isSubscribed));
    if (planName || expiryDate) {
      window.localStorage.setItem(SUBSCRIPTION_DATA_CACHE_KEY, JSON.stringify({ planName, expiryDate }));
    }
  } catch {
    // ignore localStorage failures
  }
};

export const clearAuthCache = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(USER_CACHE_KEY);
    window.localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    window.localStorage.removeItem(SUBSCRIPTION_DATA_CACHE_KEY);
    window.localStorage.removeItem(STUDENT_LEVEL_CACHE_KEY);
  } catch {
    // ignore localStorage failures
  }
};

export const fetchAndCacheAuthState = async (supabase: SupabaseClient) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      clearAuthCache();
      return { user: null, isSubscribed: false };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_perminent_paid_user")
      .eq("id", user.id)
      .single();

    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .select("status, plan_name, expiry_date")
      .eq("id", user.id)
      .single();

    const isSubscribed = profile?.is_perminent_paid_user || Boolean(subscriptionData?.status === "active");
    const planName = profile?.is_perminent_paid_user ? (subscriptionData?.plan_name || "Lifetime Pro") : subscriptionData?.plan_name;
    
    cacheAuthState(user, isSubscribed, planName, subscriptionData?.expiry_date);
    return { user, isSubscribed, planName, expiryDate: subscriptionData?.expiry_date };
  } catch (error) {
    clearAuthCache();
    return { user: null, isSubscribed: false };
  }
};
