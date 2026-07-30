"use client"

import StudyPlannerView from "@/components/study/StudyPlannerView";
import { useRouter } from "next/navigation";

export default function PlannerPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex flex-col">
      <div className="flex-1">
        <StudyPlannerView onBack={() => router.push('/study')} />
      </div>
      
    </div>
  );
}
