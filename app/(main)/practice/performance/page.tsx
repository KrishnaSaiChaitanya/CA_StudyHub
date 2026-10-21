"use client"

import PerformanceHistory from "@/components/dashboard/PerformanceHistory";
import { useRouter } from "next/navigation";
import { ProFeatureLock } from "@/components/shared/ProFeatureLock";

export default function PerformancePage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex flex-col">
      <div className="flex-1 w-full">
        <ProFeatureLock featureName="Performance History">
          <PerformanceHistory onBack={() => router.push('/practice')} />
        </ProFeatureLock>
      </div>
    </div>
  );
}
