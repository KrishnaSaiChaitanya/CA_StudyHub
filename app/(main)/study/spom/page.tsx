"use client"

import { useRouter } from "next/navigation";
import SPOMView from "@/components/SOPM";
import Footer from "@/components/Footer";

const SpomPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col w-full">
      <div className="flex-1 w-full">
        <SPOMView onBack={() => router.push("/study")} />
      </div>
      
    </div>
  );
};

export default SpomPage;
