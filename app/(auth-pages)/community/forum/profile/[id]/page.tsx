"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/components/discussion/UserProfile";

export default function UserProfilePageRoute() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, [supabase]);

  if (!userId) return null;

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-5xl mx-auto py-8 flex-1">
        <UserProfile
          userId={userId}
          currentUserId={currentUserId}
          onBack={() => router.back()}
          onPostClick={(post) => router.push(`/community/forum`)}
          onEditClick={(post) => router.push(`/community/forum`)}
        />
      </main>
    </div>
  );
}
