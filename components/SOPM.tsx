import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  Map,
  Search,
  Download,
  Bookmark,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Send,
  ThumbsUp,
  Award,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVoterId } from "./discussion/forumUtils";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

type Tab = "overview" | "materials" | "faqs" | "observations";

interface Observation {
  id: string;
  author: string;
  set: "Set A" | "Set B" | "Set C" | "Set D" | "General";
  attemptedOn: string;
  body: string;
  likes: number;
  replies: { id: string; author: string; body: string; isAppeared: boolean }[];
}

// OBSERVATIONS dummy data removed, now fetched from Supabase

interface PaperMaterial {
  id: string;
  title: string;
  paper: "Set A" | "Set B" | "Set C" | "Set D";
  type: "Module" | "Practice Manual" | "Question Bank" | "Notes";
  pages: number;
  url: string;
}

const PAPER_FILTERS = ["All", "Set A", "Set B", "Set C", "Set D"] as const;

const SPOMView = ({ onBack }: { onBack: () => void }) => {
  const [tab, setTab] = useState<Tab>("overview");
  const [paperFilter, setPaperFilter] = useState<(typeof PAPER_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<PaperMaterial[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchContent() {
      const supabase = createClient();
      const { data } = await supabase.from("spom_content").select("*").limit(1).single();
      if (data) {
        setRoadmap(data.roadmap || []);
        setPapers(data.papers || []);
        setMaterials(data.materials || []);
        setFaqs(data.faqs || []);
      }
      setLoading(false);
    }
    fetchContent();
  }, []);

  const filteredMaterials = materials.filter(
    (m) =>
      (paperFilter === "All" || m.paper === paperFilter) &&
      (search === "" || m.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <section className="container py-20 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="container py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Study
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-card to-card p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2">
              <Badge className="bg-accent/15 text-accent border-0 text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" /> NEW FROM ICAI
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                CA Final Only
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-card-foreground">
              SPOM — Self-Paced Online Modules
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Four newly launched papers (Set A–D) by ICAI under the new CA scheme.
              Learn the roadmap, access curated study material, and clear your doubts —
              all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-card border border-border px-4 py-3">
              <p className="text-xl font-bold text-card-foreground">4</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sets</p>
            </div>
            <div className="rounded-lg bg-card border border-border px-4 py-3">
              <p className="text-xl font-bold text-card-foreground">{materials.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Resources</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-border overflow-x-auto">
        {[
          { id: "overview", label: "Roadmap & Overview", icon: Map },
          { id: "materials", label: "Study Materials", icon: FileText },
          { id: "faqs", label: "FAQs", icon: HelpCircle },
          { id: "observations", label: "Observations", icon: MessageSquare },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {active && (
                <motion.div
                  layoutId="spom-tab"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="mt-6 space-y-8">
          {/* Roadmap */}
          <div>
            <h2 className="text-sm font-semibold text-card-foreground mb-4">
              Your SPOM Journey
            </h2>
            <div className="relative space-y-4">
              {roadmap.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-accent/40 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Papers explained */}
          <div>
            <h2 className="text-sm font-semibold text-card-foreground mb-4">
              The 4 Sets — What Each Covers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {papers.map((p, i) => (
                <motion.div
                  key={p.code}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border border-border bg-gradient-to-br ${p.color} p-5`}
                >
                  <Badge className="bg-card text-card-foreground border border-border text-[10px]">
                    {p.code}
                  </Badge>
                  <h3 className="mt-2 text-sm font-semibold text-card-foreground">{p.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Official link */}
          <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">
                Register on the official ICAI portal
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                All registrations and assessments happen through the ICAI Self-Service Portal.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => window.open("https://eservices.icai.org/", "_blank")}
            >
              Go to ICAI SSP
            </Button>
          </div>
        </div>
      )}

      {/* MATERIALS */}
      {tab === "materials" && (
        <div className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SPOM materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PAPER_FILTERS.map((f) => (
                <Badge
                  key={f}
                  variant={paperFilter === f ? "default" : "secondary"}
                  className={`cursor-pointer text-xs ${
                    paperFilter === f ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => setPaperFilter(f)}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              No materials match your filters.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredMaterials.map((m, i) => {
                const bookmarked = false;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-border bg-card p-4 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                        <FileText className="h-4 w-4 text-accent" />
                      </div>
                      <button
                        onClick={() => {
                          // toggleBookmark({
                          //   id: m.id,
                          //   title: m.title,
                          //   type: "pdf",
                          //   source: `SPOM • ${m.paper}`,
                          // });
                          toast({
                            title: bookmarked ? "Bookmark removed" : "Bookmarked!",
                          });
                        }}
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Bookmark
                          className={`h-4 w-4 ${bookmarked ? "fill-accent text-accent" : ""}`}
                        />
                      </button>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-card-foreground line-clamp-2">
                      {m.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {m.paper}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {m.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{m.pages} pages</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 w-full justify-center gap-1.5 text-xs"
                      onClick={() => window.open(m.url, "_blank")}
                    >
                      <Download className="h-3.5 w-3.5" /> Open / Download
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAQS */}
      {tab === "faqs" && (
        <div className="mt-6">
          <div className="rounded-xl border border-border bg-card p-2">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="px-4 text-sm text-left hover:no-underline">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                      {f.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pl-10 text-xs text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Have a question not listed? Post it on the{" "}
            <span className="text-accent">Discussion Forum</span> in Community.
          </p>
        </div>
      )}

      {/* OBSERVATIONS */}
      {tab === "observations" && <ObservationsTab />}
    </section>
  );
};

const ObservationsTab = () => {
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
                <p className="text-[11px] text-muted-foreground">Attempted {post.attemptedOn}</p>
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

export default SPOMView;
