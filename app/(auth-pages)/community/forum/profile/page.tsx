"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/components/discussion/UserProfile";

export default function CurrentUserProfilePageRoute() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      setLoading(false);
    });
  }, [supabase]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!currentUserId) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view your profile.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-5xl mx-auto py-8 flex-1">
        <UserProfile
          userId={currentUserId}
          currentUserId={currentUserId}
          onBack={() => router.back()}
          onPostClick={(post) => router.push(`/community/forum`)}
          onEditClick={(post) => router.push(`/community/forum`)}
        />
      </main>
    </div>
  );
}
