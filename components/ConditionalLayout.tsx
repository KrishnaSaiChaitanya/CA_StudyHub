"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { StudyTimerPill } from "@/components/StudyTimerPill";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isComingSoon = pathname === "/comming-soon";
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"].some(p => pathname.startsWith(p));
  const isExcluded = isComingSoon || isAdmin || isAuth;

  return (
    <div className="w-full flex flex-col min-h-screen">
      {!isExcluded && <Navbar />}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      {!isExcluded && <Footer />}
      {!isComingSoon && <StudyTimerPill />}
    </div>
  );
}
