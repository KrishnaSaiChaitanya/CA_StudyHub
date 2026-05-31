import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MessageCircle, ArrowBigUp, ArrowBigDown, Plus, Users, Check, ChevronRight, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Post, Group } from "./types";
import { getVoterId } from "./forumUtils";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All", "Doubt", "Discussion", "Resource", "Articleship", "Exam Tips"];

interface Props {
  onBack: () => void;
  onCreatePost: () => void;
  onPostClick: (post: Post) => void;
  onProfileClick: (userId: string) => void;
  groupId?: string;
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

const fetchPostsQuery = async ({ pageParam = 0, category, selectedGroupId, followedGroups }: { pageParam?: number, category: string, selectedGroupId: string | null, followedGroups: string[] }) => {
  const start = pageParam * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  let query = supabase.from("forum_posts")
    .select("*")
    .eq("status", "active")
    .eq("is_spom_observation", false)
    .order("created_at", { ascending: false })
    .range(start, end);
    
  if (category !== "All") query = query.eq("category", category);
  
  if (selectedGroupId) {
    query = query.eq("group_id", selectedGroupId);
  } else if (followedGroups.length > 0) {
    const groupList = followedGroups.map(id => `"${id}"`).join(',');
    query = query.or(`group_id.is.null,group_id.in.(${groupList})`);
  } else {
    query = query.is("group_id", null);
  }

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

export const ForumList = ({ onBack, onCreatePost, onPostClick, onProfileClick, groupId }: Props) => {
  const [category, setCategory] = useState("All");
  const queryClient = useQueryClient();
  const voterId = getVoterId();
  const router = useRouter();

  // If groupId is passed in props, we use it directly instead of local state
  const activeGroupId = groupId || null;

  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ["forum-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_groups")
        .select("*, forum_group_followers(count)")
        .order("name");
      
      if (error) return [];
      
      return (data || []).map(g => ({
        ...g,
        follower_count: g.forum_group_followers?.[0]?.count || 0
      })) as Group[];
    }
  });

  const { data: followedGroups = [], refetch: refetchFollowed } = useQuery({
    queryKey: ["forum-followed-groups", voterId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_group_followers").select("group_id").eq("user_id", voterId);
      return (data || []).map(d => d.group_id);
    }
  });

  const toggleFollowGroup = async (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFollowing = followedGroups.includes(groupId);
    if (isFollowing) {
      await supabase.from("forum_group_followers").delete().eq("user_id", voterId).eq("group_id", groupId);
    } else {
      await supabase.from("forum_group_followers").insert({ user_id: voterId, group_id: groupId });
    }
    await refetchFollowed();
    queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["forum-posts", category, activeGroupId, followedGroups],
    queryFn: ({ pageParam = 0 }) => fetchPostsQuery({ pageParam, category, selectedGroupId: activeGroupId, followedGroups }),
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
      queryKey: ["forum-posts", c, activeGroupId, followedGroups],
      queryFn: ({ pageParam = 0 }) => fetchPostsQuery({ pageParam, category: c, selectedGroupId: activeGroupId, followedGroups }),
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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-muted-foreground" onClick={() => router.push("/community/forum/profile")}>
            <Users className="h-4 w-4" /> Profile
          </Button>
          <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onCreatePost}>
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      {/* Groups Section (Only show if not in a specific group view) */}
      {!activeGroupId && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-accent" /> Discover Communities
            </h2>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => router.push("/community/forum/groups")}>
              See all <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-hide -mx-2 px-2">
            {isGroupsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-48 shrink-0 relative overflow-hidden rounded-xl border border-border flex flex-col bg-card animate-pulse"
                >
                  <div className="h-12 w-full bg-muted/60" />
                  <div className="p-3 pt-0 flex flex-col">
                    <div className="flex justify-between items-end -mt-5 mb-2">
                      <div className="h-10 w-10 rounded-full border-2 border-card bg-muted relative z-10" />
                      <div className="h-6 w-12 rounded-full bg-muted my-auto" />
                    </div>
                    <div className="h-3 w-2/3 bg-muted/80 rounded mb-1.5" />
                    <div className="h-2 w-1/3 bg-muted/60 rounded" />
                  </div>
                </div>
              ))
            ) : (
              groups.slice(0, 10).map(g => {
                const isFollowed = followedGroups.includes(g.id);
                return (
                  <div 
                    key={g.id} 
                    className="w-48 shrink-0 relative overflow-hidden rounded-xl border border-border hover:border-accent/50 transition-all flex flex-col bg-card cursor-pointer"
                    onClick={() => router.push(`/community/forum/group/${g.id}`)}
                  >
                    <div className="h-12 w-full bg-secondary bg-cover bg-center" style={{ backgroundImage: g.banner_image_url ? `url(${g.banner_image_url})` : undefined }} />
                    <div className="p-3 pt-0 flex flex-col">
                      <div className="flex justify-between items-end -mt-5 mb-2">
                        <div className="h-10 w-10 rounded-full border-2 border-card bg-secondary bg-cover bg-center relative z-10" style={{ backgroundImage: g.profile_image_url ? `url(${g.profile_image_url})` : undefined }}>
                          {!g.profile_image_url && <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">{g.name.charAt(0)}</div>}
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()} className=" my-auto">
                          {!isFollowed ? (
                            <Button 
                              size="sm" 
                              className="h-6 px-2.5 text-[10px] bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
                              onClick={(e) => toggleFollowGroup(g.id, e)}
                            >
                              Join
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              variant="secondary"
                              className="h-6 px-2.5 text-[10px] rounded-full  "
                              onClick={(e) => toggleFollowGroup(g.id, e)}
                            >
                              Joined
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-xs text-card-foreground line-clamp-1">{g.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{g.follower_count || 0} members</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Group Header (If in specific group) */}
      {activeGroupId && (() => {
        const group = groups.find(g => g.id === activeGroupId);
        if (!group) return null;
        const isFollowed = followedGroups.includes(group.id);
        
        return (
          <div className="mb-6 rounded-xl border border-border overflow-hidden bg-card">
            <div className="h-32 w-full bg-secondary bg-cover bg-center" style={{ backgroundImage: group.banner_image_url ? `url(${group.banner_image_url})` : undefined }} />
            <div className="p-6 pt-0 relative">
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-card bg-secondary bg-cover bg-center relative z-10" style={{ backgroundImage: group.profile_image_url ? `url(${group.profile_image_url})` : undefined }}>
                  {!group.profile_image_url && <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground">{group.name.charAt(0)}</div>}
                </div>
                <div>
                  <Button 
                    variant={isFollowed ? "secondary" : "default"} 
                    className={`rounded-full ${!isFollowed && "bg-accent text-accent-foreground hover:bg-accent/90"}`}
                    onClick={() => toggleFollowGroup(group.id)}
                  >
                    {isFollowed ? "Joined" : "Join Community"}
                  </Button>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-card-foreground">{group.name}</h1>
              <div className="text-sm text-muted-foreground font-medium mt-1">{group.follower_count || 0} members</div>
              {group.description && <p className="text-sm mt-3">{group.description}</p>}
            </div>
          </div>
        );
      })()}

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

      {!activeGroupId && followedGroups.length === 0 && (
        <div className="mb-6 bg-gradient-to-r from-accent/10 via-secondary/50 to-background border border-accent/20 rounded-xl p-5 relative overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Users className="h-32 w-32 text-accent" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h3 className="font-bold text-base text-card-foreground flex items-center gap-2">
                ✨ Welcome to the Forum!
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Join community groups to see specialized discussions, exam tips, and articleship queries. You are currently only seeing General posts.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/community/forum/groups")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 font-medium self-start md:self-auto"
            >
              <Compass className="mr-2 h-4 w-4" /> Explore Groups
            </Button>
          </div>
        </div>
      )}

      {isLoading && posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-bold text-lg text-card-foreground">No posts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            {!activeGroupId && followedGroups.length === 0 
              ? "Join some groups to customize your feed and see what others are discussing."
              : "Be the first one to start a conversation in this community!"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {!activeGroupId && followedGroups.length === 0 && (
              <Button 
                variant="outline" 
                onClick={() => router.push("/community/forum/groups")}
                className="gap-1.5"
              >
                <Compass className="h-4 w-4" /> Explore Groups
              </Button>
            )}
            <Button 
              onClick={onCreatePost} 
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create a Post
            </Button>
          </div>
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
                    <Avatar className="h-6 w-6 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/community/forum/profile/${post.user_id}`); }}>
                      <AvatarFallback className="bg-secondary text-[10px]">{getInitials(post.profiles.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-muted-foreground hover:text-card-foreground cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/community/forum/profile/${post.user_id}`); }}>
                      {post.profiles.full_name || "Anonymous"}
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-2">{post.category}</Badge>
                  </div>
                  
                  <h3 className="text-base font-bold text-card-foreground mb-1 line-clamp-1">{post.title}</h3>
<div
  className="
    text-sm text-muted-foreground
    prose prose-sm max-w-none
    whitespace-pre-wrap mb-2
  "
  dangerouslySetInnerHTML={{
    __html: post.content.replace(
      /<img[^>]*>/gi,
      `
      <div style="
        width:100%;
        height:220px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#f3f4f6;
        border-radius:12px;
        margin:8px 0;
      ">
        <img
          src="https://cdn-icons-png.flaticon.com/512/8136/8136031.png"
          alt=""
          style="
            width:204px;
            height:204px;
            object-fit:contain;
          "
        />
      </div>
      `
    ),
  }}
/>
                  
                  {post.image_url && (
                    <div className="relative w-full max-h-48 rounded-lg overflow-hidden border border-border bg-muted/30 mb-3 flex items-center justify-center">
                      <img src={post.image_url} alt={post.title} className="max-w-full max-h-48 object-contain" />
                    </div>
                  )}
                  
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
