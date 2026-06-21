import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MessageCircle, ArrowBigUp, ArrowBigDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Post, Profile } from "@/types/features.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  currentUserId: string | null;
  onBack: () => void;
  onPostClick: (post: Post) => void;
  onEditClick: (post: Post) => void;
}

export const UserProfile = ({ userId, currentUserId, onBack, onPostClick, onEditClick }: Props) => {
  const queryClient = useQueryClient();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", userId)
        .single();
      return (data || { full_name: "Anonymous" }) as Profile;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: rawPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const posts = rawPosts?.map((p: any) => ({
    ...p,
    profiles: profile || { full_name: "Anonymous" },
    reply_count: 0, upvotes: 0, downvotes: 0, myVote: 0
  })) as Post[] || [];

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("forum_posts")
      .update({ status: "inactive" })
      .eq("id", deletePostId)
      .eq("user_id", userId);
    
    if (error) {
      toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-posts", userId] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    }
    setDeleting(false);
    setDeletePostId(null);
    setIsDeleteModalOpen(false);
  };

  const getInitials = (name: string | null) => (name ? name.slice(0, 2).toUpperCase() : "CA");
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (profileLoading || postsLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8">
        <Avatar className="h-24 w-24 border-4 border-accent/20">
          <AvatarFallback className="bg-secondary text-2xl">{getInitials(profile?.full_name || null)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-card-foreground">{profile?.full_name || "Anonymous"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{posts.length} Posts</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-4">User's Posts</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">This user hasn't posted anything yet.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0" onClick={() => onPostClick(post)}>
                    <h3 className="text-sm font-semibold text-card-foreground truncate">{post.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(post.created_at)}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5">{post.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUserId === userId && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEditClick(post); }}>
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          disabled={deleting}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDeletePostId(post.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePostId(null);
        }}
        onConfirm={handleDeletePost}
        title="Delete Post?"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

