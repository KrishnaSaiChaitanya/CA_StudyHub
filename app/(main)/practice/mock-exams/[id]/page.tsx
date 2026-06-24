import MockExamClientWrapper from "@/features/mock-exams/components/MockExamClientWrapper";
import Footer from "@/components/Footer";
import { use } from "react";

export default function MockExamSlugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="w-full">
      <MockExamClientWrapper id={id} />
      <Footer />
    </div>
  );
}