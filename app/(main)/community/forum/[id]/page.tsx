"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Post } from "@/types/features.types";
import { PostDetail } from "@/features/community/components/PostDetail";
import { UserProfile } from "@/features/community/components/UserProfile";
import { Loader2 } from "lucide-react";
import { getVoterId } from "@/features/community/components/forumUtils";

export default function SinglePostPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Minimal view state for handling profile click within the single post page
  const [view, setView] = useState<"post" | "profile">("post");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    if (id) {
      fetchPost(id as string);
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    setLoading(true);
    const { data: p } = await supabase.from("forum_posts").select("*").eq("id", postId).eq("status", "active").single();
    if (p) {
      // Attach counts and profiles manually for this single post
      const { data: prof } = await supabase.from("profiles").select("id, full_name").eq("id", p.user_id).single();
      const { count: replyCount } = await supabase.from("forum_replies").select("*", { count: "exact", head: true }).eq("post_id", p.id);
      
      const { data: votes } = await supabase.from("forum_post_votes").select("user_id, vote").eq("post_id", p.id);
      let up = 0, down = 0, myVote = 0;
      const voterId = getVoterId();
      (votes || []).forEach(v => {
        if (v.vote === 1) up++;
        else down++;
        if (v.user_id === voterId) myVote = v.vote;
      });

      setPost({
        ...p,
        profiles: prof || { full_name: "Anonymous" },
        reply_count: replyCount || 0,
        upvotes: up,
        downvotes: down,
        myVote
      } as Post);
    }
    setLoading(false);
  };

  const handleVote = async (postId: string, value: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;
    const voterId = getVoterId();
    const current = post.myVote;
    const next = current === value ? 0 : value;

    let up = post.upvotes, down = post.downvotes;
    if (current === 1) up--;
    if (current === -1) down--;
    if (next === 1) up++;
    if (next === -1) down++;

    setPost({ ...post, upvotes: up, downvotes: down, myVote: next });

    if (next === 0) {
      await supabase.from("forum_post_votes").delete().eq("post_id", postId).eq("user_id", voterId);
    } else {
      await supabase.from("forum_post_votes").upsert(
        { post_id: postId, user_id: voterId, vote: next },
        { onConflict: "post_id,user_id" }
      );
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!post) return <div className="text-center py-20">Post not found.</div>;

  if (view === "profile" && selectedUserId) {
    return (
      <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
        <main className="container max-w-5xl mx-auto py-8 flex-1">
          <UserProfile 
            userId={selectedUserId} 
            currentUserId={userId} 
            onBack={() => setView("post")} 
            onPostClick={(p) => router.push(`/community/forum/${p.id}`)} 
            onEditClick={() => {}} 
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <main className="container max-w-5xl mx-auto py-8 flex-1">
        <PostDetail 
          post={post} 
          userId={userId} 
          onBack={() => router.push("/community/forum")} 
          onProfileClick={(uid) => { setSelectedUserId(uid); setView("profile"); }} 
          onVote={handleVote} 
        />
      </main>
    </div>
  );
}
