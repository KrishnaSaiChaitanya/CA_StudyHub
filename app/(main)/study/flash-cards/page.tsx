"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FolderPlus, Plus, Search, Layers, Send, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import FolderCard from "@/features/flashcards/components/FolderCard";
import SetCard from "@/features/flashcards/components/SetCard";
import CreateFolderDialog from "@/features/flashcards/components/CreateFolderDialog";
import CreateSetDialog from "@/features/flashcards/components/CreateSetDialog";
import RequestTopicDialog from "@/features/flashcards/components/RequestTopicDialog";
import { getFlashcardFolders, getFlashcardSets } from "@/features/flashcards/actions";
import { cn } from "@/lib/utils";

// Global cache variables for SWR caching
let cacheFolders: any[] | null = null;
let cacheSets: any[] | null = null;

export default function FlashcardsDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [folders, setFolders] = useState<any[]>(cacheFolders || []);
  const [sets, setSets] = useState<any[]>(cacheSets || []);
  const [loading, setLoading] = useState(!cacheFolders || !cacheSets);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"All" | "Admin" | "You">("All");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Dialogs
  const [folderOpen, setFolderOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const fetchData = async (forceRefresh = false) => {
    if (!forceRefresh && cacheFolders && cacheSets) {
      setFolders(cacheFolders);
      setSets(cacheSets);
      setLoading(false);
      // Background revalidation
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [foldersData, setsData] = await Promise.all([
        getFlashcardFolders(user.id),
        getFlashcardSets(user.id)
      ]);

      const folderCounts = (foldersData.links || []).reduce((acc: Record<string, number>, item) => {
        acc[item.folder_id] = (acc[item.folder_id] || 0) + 1;
        return acc;
      }, {});

      const processedFolders = (foldersData.folders || []).map((f) => ({
        ...f,
        setCount: folderCounts[f.id] || 0,
      }));

      const processedSets = (setsData || []).map((s) => ({
        ...s,
        cardCount: s.flashcards?.[0]?.count || 0,
      }));

      cacheFolders = processedFolders;
      cacheSets = processedSets;
      setFolders(processedFolders);
      setSets(processedSets);
    } catch (err) {
      console.error("Error loading flashcards data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    try {
      const { error } = await supabase.from("flashcard_folders").delete().eq("id", folderId);
      if (error) throw error;
      setFolders((prev) => prev.filter(f => f.id !== folderId));
      if (cacheFolders) cacheFolders = cacheFolders.filter(f => f.id !== folderId);
    } catch (err: any) {
      console.error("Error deleting folder:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter]);

  const filteredSets = sets.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase());

    const matchesSource =
      sourceFilter === "All" ||
      (sourceFilter === "Admin" && s.is_admin) ||
      (sourceFilter === "You" && !s.is_admin);

    return matchesSearch && matchesSource;
  });

  const totalPages = Math.ceil(filteredSets.length / pageSize);
  const paginatedSets = filteredSets.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container py-8 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/study")}
        className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Study
      </Button>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-card to-card p-6 mb-8 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <Badge className="bg-accent/15 text-accent border-0 text-[10px] mb-3 font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 mr-1" /> REVISION TOOL
            </Badge>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Flashcards</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Master concepts faster. Browse official admin sets, organize them into folders, create your own decks, or request topics.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-10 border-border/80 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all font-semibold"
              onClick={() => setRequestOpen(true)}
            >
              <Send className="h-3.5 w-3.5" /> Request a topic
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
              onClick={() => setSetOpen(true)}
            >
              <Plus className="h-4 w-4" /> Create Set
            </Button>
          </div>
        </div>
      </motion.div>

      {loading && folders.length === 0 && sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground font-medium">Loading your cards...</p>
        </div>
      ) : (
        <>
          {/* Folders Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Your Folders</h2>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-accent hover:text-accent hover:bg-accent/5 font-semibold"
                onClick={() => setFolderOpen(true)}
              >
                <FolderPlus className="h-4 w-4" /> New Folder
              </Button>
            </div>
            {folders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-card/30">
                <p className="text-sm">No folders created yet. Create a folder to organize your sets.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {folders.map((f, i) => (
                  <FolderCard
                    key={f.id}
                    name={f.name}
                    tag={f.tag}
                    setCount={f.setCount}
                    index={i}
                    onClick={() => router.push(`/study/flash-cards/folder/${f.id}`)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(f.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Library Section */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-4">Browse Library</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm h-10"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                {([
                  { value: "All", label: "All" },
                  { value: "Admin", label: "Admin" },
                  { value: "You", label: "Created by You" }
                ] as const).map((s) => (
                  <Badge
                    key={s.value}
                    variant={sourceFilter === s.value ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer text-xs px-3 py-1 rounded-full border border-transparent font-semibold select-none transition-all",
                      sourceFilter === s.value
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setSourceFilter(s.value)}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>

            {filteredSets.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed bg-card/30 text-muted-foreground">
                <Layers className="mx-auto h-8 w-8 opacity-20 mb-3" />
                <p className="text-sm">No sets match your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedSets.map((s, i) => (
                    <SetCard
                      key={s.id}
                      title={s.title}
                      subject={s.subject}
                      isAdmin={s.is_admin}
                      cardCount={s.cardCount}
                      author={s.is_admin ? "Admin" : "You"}
                      index={i}
                      onClick={() => router.push(`/study/flash-cards/set/${s.id}`)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 border-t border-border/50 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="h-9 px-4 border-border/80 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all font-semibold text-xs"
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-semibold px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="h-9 px-4 border-border/80 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all font-semibold text-xs"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <CreateFolderDialog open={folderOpen} onOpenChange={setFolderOpen} onCreated={() => fetchData(true)} />
      <CreateSetDialog open={setOpen} onOpenChange={setSetOpen} onCreated={() => fetchData(true)} />
      <RequestTopicDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
