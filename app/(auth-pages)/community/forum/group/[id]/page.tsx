"use client";

import { useParams, useRouter } from "next/navigation";
import DiscussionForumView from "@/components/discussion/discussionView";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-5xl mx-auto py-8 flex-1">
        <DiscussionForumView 
          groupId={groupId}
          onBack={() => router.push("/community/forum")} 
        />
      </main>
    </div>
  );
}
