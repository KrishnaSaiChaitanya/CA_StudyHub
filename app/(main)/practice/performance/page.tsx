"use client"

import PerformanceHistory from "@/components/PerformanceHistory";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function PerformancePage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex flex-col">
      <div className="flex-1 w-full">
        <PerformanceHistory onBack={() => router.push('/practice')} />
      </div>
      
    </div>
  );
}
