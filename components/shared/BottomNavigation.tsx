"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Target, GraduationCap, MessageSquare } from "lucide-react";
import { useSubscription } from "@/components/providers/SubscriptionProvider";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { isSubscribed: isPro } = useSubscription();
  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === 'true';

  // Exclude bottom navigation from auth and admin pages
  const isComingSoon = pathname === "/comming-soon";
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"].some(p => pathname.startsWith(p));
  
  if (isComingSoon || isAdmin || isAuth) {
    return null;
  }

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Study", path: "/study", icon: BookOpen },
    { label: "Practice", path: "/practice", icon: Target, isCenter: true },
    { label: "Faculty", path: "/faculty", icon: GraduationCap },
    { label: "Community", path: "/community", icon: MessageSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/85 px-4 pb-safe shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-end h-16 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Determine active path (similar to Navbar.tsx matching)
          const isActive = item.path === "/" 
            ? pathname === "/" || pathname === "/dashboard" 
            : pathname.startsWith(item.path);

          if (item.isCenter) {
            return (
              <div key={item.path} className="flex-1 flex justify-center z-10">
                <Link
                  href={item.path}
                  className="flex flex-col items-center justify-center relative -top-4 w-16"
                  prefetch={false}
                >
                  <div className={`flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 ${
                    isActive 
                      ? "bg-accent text-accent-foreground shadow-accent scale-110" 
                      : "bg-background border-2 border-accent text-accent hover:bg-accent/10 shadow-md"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 transition-colors duration-300 ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center h-full py-2 group"
              prefetch={false}
            >
              <Icon className={`h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95 ${
                isActive ? "text-accent scale-105" : "text-muted-foreground hover:text-foreground"
              }`} />
              <span className={`text-[10px] font-semibold transition-all duration-200 ${
                isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
