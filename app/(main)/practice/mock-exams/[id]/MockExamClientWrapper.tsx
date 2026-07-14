"use client"

import { useRouter } from "next/navigation";
import MockExam from "@/components/study/MockExam";

export default function MockExamClientWrapper({ id }: { id: string }) {
  const router = useRouter();

  const handleExit = () => {
    router.push("/practice/mock-exams");
  };

  return <MockExam testId={id} onExit={handleExit} />;
}
