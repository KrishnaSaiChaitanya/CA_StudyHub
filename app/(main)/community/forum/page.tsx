"use client";

import { useRouter } from "next/navigation";
import DiscussionForumView from "@/features/community/components/discussionView";

export default function ForumPage() {
  const router = useRouter();

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-5xl mx-auto py-8 flex-1">
        <DiscussionForumView onBack={() => router.push("/community")} />
      </main>
    </div>
  );
}
