import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MessageCircle, ArrowBigUp, ArrowBigDown, Flag, Reply as ReplyIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Post, Reply } from "./types";
import { TipTapEditor } from "./TipTapEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Share2 } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

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

const ReplyNode = ({ reply, depth = 0, onProfileClick, setReplyingTo }: { reply: Reply, depth?: number, onProfileClick: (id: string) => void, setReplyingTo: (r: Reply) => void }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 mt-4 ${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
    <Avatar className="h-8 w-8 cursor-pointer" onClick={() => onProfileClick(reply.user_id)}>
      <AvatarFallback className="bg-secondary text-xs">{getInitials(reply.profiles.full_name)}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-card-foreground cursor-pointer hover:underline" onClick={() => onProfileClick(reply.user_id)}>
          {reply.profiles.full_name || "Anonymous"}
        </p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(reply.created_at)}</p>
      </div>
      <div className="mt-1 text-sm text-card-foreground prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: reply.content }} />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => setReplyingTo(reply)} className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 font-medium">
          <ReplyIcon className="h-3 w-3" /> Reply
        </button>
      </div>
      {reply.replies?.map(r => <ReplyNode key={r.id} reply={r} depth={depth + 1} onProfileClick={onProfileClick} setReplyingTo={setReplyingTo} />)}
    </div>
  </motion.div>
);

const PAGE_SIZE = 10;

const attachProfiles = async <T extends { user_id: string }>(rows: T[]): Promise<(T & { profiles: any })[]> => {
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const profMap: Record<string, any> = {};
  (profs || []).forEach((p: any) => { profMap[p.id] = { full_name: p.full_name }; });
  return rows.map((r) => ({ ...r, profiles: profMap[r.user_id] || { full_name: "Anonymous" } }));
};

const fetchRepliesQuery = async ({ pageParam = 0, postId }: { pageParam?: number, postId: string }) => {
  const start = pageParam * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range(start, end);

  if (!error && data && data.length > 0) {
    const withProfiles = await attachProfiles(data);
    return {
      data: withProfiles as Reply[],
      nextCursor: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
    };
  }
  return { data: [], nextCursor: undefined };
};

const buildReplyTree = (flatReplies: Reply[]): Reply[] => {
  const map: Record<string, Reply> = {};
  const roots: Reply[] = [];
  flatReplies.forEach(r => map[r.id] = { ...r, replies: [] });
  flatReplies.forEach(r => {
    if (r.parent_reply_id && map[r.parent_reply_id]) {
      map[r.parent_reply_id].replies!.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });
  return roots;
};

interface Props {
  post: Post;
  userId: string | null;
  onBack: () => void;
  onProfileClick: (userId: string) => void;
  onVote: (postId: string, value: 1 | -1, e: React.MouseEvent) => void;
}

export const PostDetail = ({ post, userId, onBack, onProfileClick, onVote }: Props) => {
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const [posting, setPosting] = useState(false);

  // Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["forum-replies", post.id],
    queryFn: ({ pageParam = 0 }) => fetchRepliesQuery({ pageParam, postId: post.id }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const flatReplies = data?.pages.flatMap((page) => page.data) || [];
  // Using a unique filter for when pages might overlap slightly
  const uniqueFlatReplies = flatReplies.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
  const replies = buildReplyTree(uniqueFlatReplies);

  const handleReply = async () => {
    const effectiveUserId = userId || DEMO_USER_ID;
    if (!replyContent.trim() || replyContent === "<p></p>") return;

    setPosting(true);
    const { error } = await supabase.from("forum_replies").insert({
      post_id: post.id,
      user_id: effectiveUserId,
      parent_reply_id: replyingTo?.id || null,
      content: replyContent.trim(),
    });

    if (error) {
      toast({ title: "Failed to reply", description: error.message, variant: "destructive" });
    } else {
      setReplyContent("");
      // Add a small delay to ensure React state and TipTap sync
      setTimeout(() => setReplyContent(""), 50);
      setReplyingTo(null);
      
      // Instead of waiting for cache invalidation, just invalidate the query
      queryClient.invalidateQueries({ queryKey: ["forum-replies", post.id] });
      // We can also optimistically update, but refetching is okay for a simple reply action
      refetch();
    }
    setPosting(false);
  };

  const handleReport = async () => {
    const effectiveUserId = userId || DEMO_USER_ID;
    if (!reportReason.trim()) return;
    setReporting(true);
    const { error } = await supabase.from("forum_reports").insert({
      post_id: post.id,
      user_id: effectiveUserId,
      feedback: reportReason.trim()
    });
    if (error) {
      toast({ title: "Report failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post reported successfully", description: "An admin will review it." });
      setReportOpen(false);
      setReportReason("");
    }
    setReporting(false);
  };

  const handleImageUpload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId || DEMO_USER_ID}/${Date.now()}.${ext}`;
    await supabase.storage.from("forum-images").upload(path, file);
    const { data: urlData } = supabase.storage.from("forum-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/community/forum/${post.id}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    } catch (err) {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Forum
      </Button>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => onProfileClick(post.user_id)}>
              <AvatarFallback className="bg-secondary text-sm">{getInitials(post.profiles.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-card-foreground cursor-pointer hover:underline" onClick={() => onProfileClick(post.user_id)}>
                {post.profiles.full_name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(post.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">{post.category}</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleShare} title="Share Post">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setReportOpen(true)} title="Report Post">
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-card-foreground mb-3">{post.title}</h2>
        <div className="text-sm text-card-foreground prose prose-sm max-w-none whitespace-pre-wrap mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="mt-6 flex items-center gap-4 pt-4 border-t border-border">
          <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
            <button onClick={(e) => onVote(post.id, 1, e)} className={`p-1 rounded-full hover:bg-accent/20 transition-colors ${post.myVote === 1 ? "text-accent" : "text-muted-foreground"}`}>
              <ArrowBigUp className="h-5 w-5" fill={post.myVote === 1 ? "currentColor" : "none"} />
            </button>
            <span className={`text-sm font-bold tabular-nums px-2 ${post.myVote === 1 ? "text-accent" : post.myVote === -1 ? "text-destructive" : "text-card-foreground"}`}>
              {post.upvotes - post.downvotes}
            </span>
            <button onClick={(e) => onVote(post.id, -1, e)} className={`p-1 rounded-full hover:bg-destructive/20 transition-colors ${post.myVote === -1 ? "text-destructive" : "text-muted-foreground"}`}>
              <ArrowBigDown className="h-5 w-5" fill={post.myVote === -1 ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <MessageCircle className="h-4 w-4" /> {post.reply_count} Replies
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-6">Replies</h3>
        
        <div className="space-y-6 mb-8">
          {replies.map((r) => <ReplyNode key={r.id} reply={r} onProfileClick={onProfileClick} setReplyingTo={setReplyingTo} />)}
          {replies.length === 0 && !isLoading && <p className="text-sm text-muted-foreground text-center py-6">No replies yet. Be the first to start the discussion!</p>}
          {hasNextPage && replies.length > 0 && (
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading..." : "Load more replies"}
              </Button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold text-sm mb-3">{replyingTo ? `Replying to ${replyingTo.profiles.full_name}` : "Leave a reply"}</h4>
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md">
              <span className="truncate flex-1" dangerouslySetInnerHTML={{ __html: replyingTo.content }} />
              <button onClick={() => setReplyingTo(null)} className="hover:text-foreground">Cancel</button>
            </div>
          )}
          <TipTapEditor content={replyContent} onChange={setReplyContent} onImageUpload={handleImageUpload} />
          <div className="flex justify-end mt-3">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleReply} disabled={posting || !replyContent.trim() || replyContent === "<p></p>"}>
              {posting ? "Posting..." : "Reply"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason for reporting</label>
            <Textarea
              placeholder="Please provide details..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason.trim() || reporting}>
              {reporting ? "Reporting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
