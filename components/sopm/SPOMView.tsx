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
  Loader2,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { ObservationsTab } from "./ObservationsTab";
import { Tab, PAPER_FILTERS, PaperMaterial } from "./types";

const SPOMView = ({ onBack }: { onBack: () => void }) => {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [paperFilter, setPaperFilter] = useState<(typeof PAPER_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<PaperMaterial[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchContentAndBookmarks() {
      setLoading(true);
      try {
        // 1. Fetch SPOM content
        const { data: contentData } = await supabase.from("spom_content").select("*").limit(1).single();
        if (contentData) {
          setRoadmap(contentData.roadmap || []);
          setPapers(contentData.papers || []);
          setMaterials(contentData.materials || []);
          setFaqs(contentData.faqs || []);
        }

        // 2. Fetch authenticated user details
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // 3. Fetch user's existing bookmarks for SPOM materials
          const { data: bookmarksData } = await supabase
            .from("user_bookmarks")
            .select("spom_material_id")
            .eq("user_id", user.id)
            .not("spom_material_id", "is", null);

          if (bookmarksData) {
            const bookmarkSet = new Set(bookmarksData.map(b => b.spom_material_id as string));
            setBookmarked(bookmarkSet);
          }
        }
      } catch (error) {
        console.error("Error fetching content and bookmarks:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContentAndBookmarks();
  }, []);

  const toggleBookmark = async (id: string, materialTitle: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to bookmark materials.",
        variant: "destructive",
      });
      return;
    }

    const isCurrentlyBookmarked = bookmarked.has(id);

    // Optimistic UI Update
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("user_bookmarks")
          .delete()
          .match({ user_id: userId, spom_material_id: id });
          
        if (error) throw error;
        toast({ title: "Bookmark removed", description: materialTitle });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("user_bookmarks")
          .insert({ user_id: userId, spom_material_id: id });
          
        if (error) throw error;
        toast({ title: "Bookmarked!", description: materialTitle });
      }
    } catch (error) {
      // Revert optimistic update on failure
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
      toast({ title: "Error", description: "Failed to update bookmark.", variant: "destructive" });
    }
  };

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
                const isBookmarked = bookmarked.has(m.id);
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
                        onClick={() => toggleBookmark(m.id, m.title)}
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isBookmarked ? "fill-accent text-accent" : ""}`}
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

export default SPOMView;
