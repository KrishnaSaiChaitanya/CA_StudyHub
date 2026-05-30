import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Send, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { getVoterId } from "../discussion/forumUtils";
import { Observation, DEMO_USER_ID } from "./types";

export const ObservationsTab = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBody, setShareBody] = useState("");
  const [shareSet, setShareSet] = useState<Observation["set"]>("Set A");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["spom-observations"],
    queryFn: async () => {
      const { data: postsData } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("is_spom_observation", true)
        .order("created_at", { ascending: false });

      if (!postsData || postsData.length === 0) return [];

      const ids = postsData.map(p => p.id);
      const { data: replies } = await supabase.from("forum_replies").select("*").in("post_id", ids).order("created_at", { ascending: true });

      const userIds = new Set([...postsData.map(p => p.user_id), ...(replies || []).map(r => r.user_id)]);
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds));
      const profMap: Record<string, string> = {};
      (profs || []).forEach(p => { profMap[p.id] = p.full_name || "Anonymous"; });

      const { data: votes } = await supabase.from("forum_post_votes").select("post_id, vote").in("post_id", ids);
      const upMap: Record<string, number> = {};
      (votes || []).forEach(v => {
        if (v.vote === 1) upMap[v.post_id] = (upMap[v.post_id] || 0) + 1;
      });

      return postsData.map((p): Observation => ({
        id: p.id,
        author: profMap[p.user_id] || "Anonymous",
        set: p.category as any,
        attemptedOn: p.title || "Recently",
        body: p.content,
        likes: upMap[p.id] || 0,
        replies: (replies || []).filter(r => r.post_id === p.id).map(r => ({
          id: r.id,
          author: profMap[r.user_id] || "Anonymous",
          body: r.content,
          isAppeared: false
        }))
      }));
    }
  });

  const submitShare = async () => {
    if (!shareBody.trim()) return;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || DEMO_USER_ID;
    
    await supabase.from("forum_posts").insert({
      user_id: userId,
      title: "Just now",
      content: shareBody.trim(),
      category: shareSet,
      is_spom_observation: true,
    });
    
    setShareBody("");
    setShareOpen(false);
    queryClient.invalidateQueries({ queryKey: ["spom-observations"] });
    toast({ title: "Observation shared!", description: "Thanks for helping fellow students." });
  };

  const submitReply = async (postId: string, isAppeared: boolean) => {
    const text = (replyDraft[postId] ?? "").trim();
    if (!text) return;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || DEMO_USER_ID;

    await supabase.from("forum_replies").insert({
      post_id: postId,
      user_id: userId,
      content: text,
    });
    
    setReplyDraft((d) => ({ ...d, [postId]: "" }));
    queryClient.invalidateQueries({ queryKey: ["spom-observations"] });
  };

  const like = async (id: string) => {
    const voterId = getVoterId();
    await supabase.from("forum_post_votes").upsert(
      { post_id: id, user_id: voterId, vote: 1 },
      { onConflict: "post_id,user_id" }
    );
    queryClient.invalidateQueries({ queryKey: ["spom-observations"] });
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-accent/10 to-card p-5 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <Badge className="bg-accent/15 text-accent border-0 text-[10px] mb-2">
            <Award className="h-3 w-3 mr-1" /> PEER INSIGHTS
          </Badge>
          <h3 className="text-sm font-semibold text-card-foreground">
            Learn from students who have already appeared
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl">
            Real observations on difficulty, time management, syllabus weightage and pitfalls.
            Already given a SPOM exam? Share your experience to help juniors.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
          onClick={() => setShareOpen(true)}
        >
          <Send className="h-3.5 w-3.5" /> Share Observation
        </Button>
      </div>

      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{post.author}</p>
                <p className="text-[11px] text-muted-foreground">Created {post.attemptedOn}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">{post.set}</Badge>
          </div>
          <p className="mt-3 text-sm text-card-foreground leading-relaxed">{post.body}</p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <button onClick={() => like(post.id)} className="flex items-center gap-1 hover:text-accent transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" /> {post.likes}
            </button>
            <span>•</span>
            <span>{post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}</span>
          </div>

          {post.replies.length > 0 && (
            <div className="mt-4 space-y-2 border-l-2 border-border pl-3">
              {post.replies.map((r) => (
                <div key={r.id} className="rounded-lg bg-secondary/40 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-card-foreground">{r.author}</span>
                    {r.isAppeared && (
                      <Badge className="bg-accent/15 text-accent border-0 text-[9px]">Appeared</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Ask a question or reply…"
              value={replyDraft[post.id] ?? ""}
              onChange={(e) => setReplyDraft((d) => ({ ...d, [post.id]: e.target.value }))}
              className="text-xs h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitReply(post.id, false);
              }}
            />
            <Button size="sm" variant="outline" onClick={() => submitReply(post.id, false)}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      ))}

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your SPOM observation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(["Set A", "Set B", "Set C", "Set D", "General"] as const).map((s) => (
                <Badge
                  key={s}
                  variant={shareSet === s ? "default" : "secondary"}
                  className={`cursor-pointer text-xs ${shareSet === s ? "bg-accent text-accent-foreground" : ""}`}
                  onClick={() => setShareSet(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
            <Textarea
              placeholder="Difficulty, time taken, what to focus on, surprises in the paper…"
              className="min-h-[120px] text-sm"
              value={shareBody}
              onChange={(e) => setShareBody(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Your post will appear with an "Appeared" badge so juniors know it's first-hand.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submitShare}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
