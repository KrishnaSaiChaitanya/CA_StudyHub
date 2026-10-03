"use client";

import { useRouter } from "next/navigation";
import StudyRooms from "@/components/study-rooms/study-rooms";
import PageHeader from "@/components/shared/PageHeader";

export default function CommunityRoomsPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col ">
      {/* Banner Area */}
      <PageHeader
        title="Study"
        gradientTitle="Rooms"
        showBack={true}
        backText="Back to Community"
        description="Join subject-specific Google Meet rooms to study with peers."
        onBack={() => router.push("/community")}
      />

      {/* Main Content Area */}
      <div className="flex-1 pb-16">
        <StudyRooms onBack={() => router.push("/community")} />
      </div>
    </div>
  );
}