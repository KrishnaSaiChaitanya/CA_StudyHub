import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MessageCircle, ArrowBigUp, ArrowBigDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "./types";
import { getVoterId } from "./forumUtils";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["All", "Doubt", "Discussion", "Resource", "Articleship", "Exam Tips"];

interface Props {
  onBack: () => void;
  onCreatePost: () => void;
  onPostClick: (post: Post) => void;
  onProfileClick: (userId: string) => void;
}

const PAGE_SIZE = 10;

const attachProfiles = async <T extends { user_id: string }>(rows: T[]): Promise<(T & { profiles: any })[]> => {
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const profMap: Record<string, any> = {};
  (profs || []).forEach((p: any) => { profMap[p.id] = { full_name: p.full_name }; });
  return rows.map((r) => ({ ...r, profiles: profMap[r.user_id] || { full_name: "Anonymous" } }));
};

const fetchPostsQuery = async ({ pageParam = 0, category }: { pageParam?: number, category: string }) => {
  const start = pageParam * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  let query = supabase.from("forum_posts").select("*").eq("status", "active").order("created_at", { ascending: false }).range(start, end);
  if (category !== "All") query = query.eq("category", category);

  const { data: postsData } = await query;

  if (postsData && postsData.length > 0) {
    const ids = postsData.map(p => p.id);
    
    const { data: replyCounts } = await supabase.from("forum_replies").select("post_id").in("post_id", ids);
    const countMap: Record<string, number> = {};
    replyCounts?.forEach((r: { post_id: string }) => { countMap[r.post_id] = (countMap[r.post_id] || 0) + 1; });

    const { data: votes } = await supabase.from("forum_post_votes").select("post_id, user_id, vote").in("post_id", ids);
    const voterId = getVoterId();
    const upMap: Record<string, number> = {};
    const downMap: Record<string, number> = {};
    const myVoteMap: Record<string, number> = {};
    (votes || []).forEach((v: any) => {
      if (v.vote === 1) upMap[v.post_id] = (upMap[v.post_id] || 0) + 1;
      else downMap[v.post_id] = (downMap[v.post_id] || 0) + 1;
      if (v.user_id === voterId) myVoteMap[v.post_id] = v.vote;
    });

    const withProfiles = await attachProfiles(postsData);
    const formatted = withProfiles.map((p: any) => ({
      ...p,
      reply_count: countMap[p.id] || 0,
      upvotes: upMap[p.id] || 0,
      downvotes: downMap[p.id] || 0,
      myVote: myVoteMap[p.id] || 0,
    })) as Post[];

    return {
      data: formatted,
      nextCursor: postsData.length === PAGE_SIZE ? pageParam + 1 : undefined,
    };
  } else {
    return { data: [], nextCursor: undefined };
  }
};

export const ForumList = ({ onBack, onCreatePost, onPostClick, onProfileClick }: Props) => {
  const [category, setCategory] = useState("All");
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["forum-posts", category],
    queryFn: ({ pageParam = 0 }) => fetchPostsQuery({ pageParam, category }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const posts = data?.pages.flatMap((page) => page.data) || [];

  const handleVote = async (postId: string, value: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    const voterId = getVoterId();
    let nextVote = 0;

    queryClient.setQueryData(["forum-posts", category], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.map((p: Post) => {
            if (p.id !== postId) return p;
            const current = p.myVote;
            nextVote = current === value ? 0 : value;
            let up = p.upvotes, down = p.downvotes;
            if (current === 1) up--;
            if (current === -1) down--;
            if (nextVote === 1) up++;
            if (nextVote === -1) down++;
            return { ...p, upvotes: up, downvotes: down, myVote: nextVote };
          }),
        })),
      };
    });

    if (nextVote === 0) {
      await supabase.from("forum_post_votes").delete().eq("post_id", postId).eq("user_id", voterId);
    } else {
      await supabase.from("forum_post_votes").upsert({ post_id: postId, user_id: voterId, vote: nextVote }, { onConflict: "post_id,user_id" });
    }
  };

  const prefetchCategory = (c: string) => {
    if (c === category) return;
    queryClient.prefetchInfiniteQuery({
      queryKey: ["forum-posts", c],
      queryFn: ({ pageParam = 0 }) => fetchPostsQuery({ pageParam, category: c }),
      initialPageParam: 0,
    });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onCreatePost}>
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <Badge
            key={c}
            variant={category === c ? "default" : "secondary"}
            className={`cursor-pointer text-xs ${category === c ? "bg-accent text-accent-foreground" : "hover:bg-secondary/80"}`}
            onClick={() => setCategory(c)}
            onMouseEnter={() => prefetchCategory(c)}
          >
            {c}
          </Badge>
        ))}
      </div>

      {isLoading && posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">No posts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onPostClick(post)}
                className="cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-accent/50 transition-all flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6 cursor-pointer" onClick={(e) => { e.stopPropagation(); onProfileClick(post.user_id); }}>
                      <AvatarFallback className="bg-secondary text-[10px]">{getInitials(post.profiles.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-muted-foreground hover:text-card-foreground cursor-pointer" onClick={(e) => { e.stopPropagation(); onProfileClick(post.user_id); }}>
                      {post.profiles.full_name || "Anonymous"}
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-2">{post.category}</Badge>
                  </div>
                  
                  <h3 className="text-base font-bold text-card-foreground mb-1 line-clamp-1">{post.title}</h3>
                  <div className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-1 py-0.5" onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => handleVote(post.id, 1, e)} className={`p-1 rounded-full hover:bg-accent/20 transition-colors ${post.myVote === 1 ? "text-accent" : "text-muted-foreground"}`}>
                        <ArrowBigUp className="h-4 w-4" fill={post.myVote === 1 ? "currentColor" : "none"} />
                      </button>
                      <span className={`text-xs font-bold tabular-nums min-w-[20px] text-center ${post.myVote === 1 ? "text-accent" : post.myVote === -1 ? "text-destructive" : "text-card-foreground"}`}>
                        {post.upvotes - post.downvotes}
                      </span>
                      <button onClick={(e) => handleVote(post.id, -1, e)} className={`p-1 rounded-full hover:bg-destructive/20 transition-colors ${post.myVote === -1 ? "text-destructive" : "text-muted-foreground"}`}>
                        <ArrowBigDown className="h-4 w-4" fill={post.myVote === -1 ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {post.reply_count} Replies
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading..." : "Load more posts"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
