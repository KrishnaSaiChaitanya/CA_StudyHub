"use client"

import AnnouncementsView from "@/components/Announcements";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function AnnouncementsPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex flex-col">
      <div className="flex-1">
        <AnnouncementsView onBack={() => router.push('/study')} />
      </div>
      
    </div>
  );
}
