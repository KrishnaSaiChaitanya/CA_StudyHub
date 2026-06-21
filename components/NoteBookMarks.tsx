"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import BookmarksClient from "@/features/bookmarks/components/BookmarksClient";
import { Loader2 } from "lucide-react";

const NotesBookmarks = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground text-sm">Please sign in to view your notes & bookmarks.</p>
      </div>
    );
  }

  return <BookmarksClient userId={userId} />;
};

export default NotesBookmarks;
