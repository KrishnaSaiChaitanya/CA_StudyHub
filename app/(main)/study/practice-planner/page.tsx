"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PracticePlannerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/study/study-planning");
  }, [router]);
  return null;
}
