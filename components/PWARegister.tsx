"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function PWARegister() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      const handleRegister = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        } catch (err) {
          console.error("ServiceWorker registration failed: ", err);
        }
      };

      // Register when document is loaded
      if (document.readyState === "complete") {
        handleRegister();
      } else {
        window.addEventListener("load", handleRegister);
        return () => window.removeEventListener("load", handleRegister);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 2. Handle Online/Offline Toasts
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
  }, [toast]);

  return null;
}
