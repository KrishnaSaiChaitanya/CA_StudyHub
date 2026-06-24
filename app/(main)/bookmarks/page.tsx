import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { BookmarkItem, DbNote } from "./types";
import { redirect } from "next/navigation";
import type { StudentLevel } from "@/types/database.types";
import { SUBJECT_MAPPING } from "@/utils/subjects";

const BookmarksClient = dynamic(() => import("@/features/bookmarks/components/BookmarksClient"), { ssr: true });

const formatSubjectName = (subject: string) => {
  if (!subject) return "";
  return subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default async function BookmarksPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {}
        },
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store", next: { revalidate: 0 } }),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <BookmarksClient 
      userId={user.id} 
    />
  );
}