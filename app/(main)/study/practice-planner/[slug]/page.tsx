"use client";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function PracticeTrackerRedirect({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/study/study-planning/${slug}`);
  }, [router, slug]);
  return null;
}
