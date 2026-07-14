"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function PWARegister() {
  const { toast } = useToast();
  const enablePWA = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (enablePWA) {
      if ("serviceWorker" in navigator) {
        const handleRegister = async () => {
          try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            console.log("ServiceWorker registration successful with scope: ", registration.scope);
          } catch (err) {
            console.error("ServiceWorker registration failed: ", err);
          }
        };

        if (document.readyState === "complete") {
          handleRegister();
        } else {
          window.addEventListener("load", handleRegister);
          return () => window.removeEventListener("load", handleRegister);
        }
      }
    } else {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("ServiceWorker unregistered successfully");
              }
            });
          }
        });
      }
    }
  }, [enablePWA]);

  useEffect(() => {
    if (!enablePWA) return;
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      toast({
        title: "Back Online",
        description: "Your internet connection is restored. Dynamic data has been refreshed.",
        variant: "default",
        className: "bg-green-600 text-white border-green-500",
      });
    };

    const handleOffline = () => {
      toast({
        title: "You are Offline",
        description: "Some features may be limited. You can still access cached planners, flashcards, and notes.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast, enablePWA]);

  if (!enablePWA) {
    return null;
  }

  return (
    <div style={{ display: "none" }} aria-hidden="true">
      <Link href="/offline" prefetch />
      <Link href="/dashboard" prefetch />
      <Link href="/study/planner" prefetch />
      <Link href="/study/flash-cards" prefetch />
    </div>
  );
}
