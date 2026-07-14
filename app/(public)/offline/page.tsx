"use client";

import { useEffect, useState } from "react";
import { WifiOff, RotateCw, BookOpen, Layers, CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const handleRetry = () => {
    setIsReconnecting(true);
    setTimeout(() => {
      setIsReconnecting(false);
      if (navigator.onLine) {
        router.refresh();
        // Go back to the dashboard
        router.push("/dashboard");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center w-full">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-card flex flex-col items-center">
        {/* Connection status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/30 mb-6">
          <WifiOff className="h-3 w-3" />
          Offline Mode
        </div>

        {/* Offline Illustration */}
        <div className="h-20 w-20 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6">
          <WifiOff className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-card-foreground tracking-tight">
          Connection Lost
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are currently offline. Check your internet connection or try again.
        </p>

        {/* Action Button */}
        <div className="mt-8 w-full flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <RotateCw className={`h-4 w-4 ${isReconnecting ? "animate-spin" : ""}`} />
            {isReconnecting ? "Checking connection..." : "Try Again"}
          </Button>

          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-muted rounded-xl border border-border text-left w-full">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Available Offline
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Don't worry! You can still access basic features and previously visited pages:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/study/planner" className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-accent/30 text-xs font-medium text-card-foreground">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              Planners
            </Link>
            <Link href="/study/flash-cards" className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-accent/30 text-xs font-medium text-card-foreground">
              <Layers className="h-3.5 w-3.5 text-accent" />
              Flashcards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
