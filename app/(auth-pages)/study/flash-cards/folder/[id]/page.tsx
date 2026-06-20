"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Folder, Layers, Loader2, Trash2, Tag, Library } from "lucide-react";
import SetCard from "@/components/flash-cards/SetCard";
import CreateSetDialog from "@/components/flash-cards/CreateSetDialog";
import AddToFolderDialog from "@/components/flash-cards/AddToFolderDialog";

// Global cache variables for SWR caching
const cacheFolderDetails: Record<string, any> = {};
const cacheFolderSets: Record<string, any[]> = {};

interface FolderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function FolderDetailsPage({ params }: FolderDetailsPageProps) {
  const router = useRouter();
  const { id: folderId } = use(params);
  const supabase = createClient();
  const { toast } = useToast();

  const [folder, setFolder] = useState<any | null>(cacheFolderDetails[folderId] || null);
  const [sets, setSets] = useState<any[]>(cacheFolderSets[folderId] || []);
  const [loading, setLoading] = useState(!cacheFolderDetails[folderId]);

  // Dialogs
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFolderDetails = async (forceRefresh = false) => {
    if (!forceRefresh && cacheFolderDetails[folderId] && cacheFolderSets[folderId]) {
      setFolder(cacheFolderDetails[folderId]);
      setSets(cacheFolderSets[folderId]);
      setLoading(false);
      // Background revalidation
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch folder metadata
      const { data: folderData, error: folderErr } = await supabase
        .from("flashcard_folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (folderErr) throw folderErr;
      setFolder(folderData);
      cacheFolderDetails[folderId] = folderData;

      // 2. Fetch sets in folder
      const { data: linkedData, error: linkErr } = await supabase
        .from("flashcard_folder_sets")
        .select("set_id, flashcard_sets(*, flashcards(count))")
        .eq("folder_id", folderId);

      if (linkErr) throw linkErr;

      const processedSets = (linkedData || [])
        .map((item: any) => {
          const s = item.flashcard_sets;
          if (!s) return null;
          return {
            ...s,
            cardCount: s.flashcards?.[0]?.count || 0,
          };
        })
        .filter(Boolean);

      setSets(processedSets);
      cacheFolderSets[folderId] = processedSets;
    } catch (err: any) {
      toast({ title: "Failed to load folder details", description: err.message, variant: "destructive" });
      router.push("/study/flash-cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderDetails();
  }, [folderId]);

  const handleRemoveSet = async (e: React.MouseEvent, setId: string) => {
    e.stopPropagation(); // Stop navigation to set page
    if (!confirm("Are you sure you want to remove this set from this folder? It will not delete the set itself.")) return;

    setRemovingId(setId);
    try {
      const { error } = await supabase
        .from("flashcard_folder_sets")
        .delete()
        .match({ folder_id: folderId, set_id: setId });

      if (error) throw error;

      setSets((prev) => prev.filter((s) => s.id !== setId));
      toast({ title: "Set removed from folder" });
    } catch (err: any) {
      toast({ title: "Failed to remove set", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && !folder) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground font-medium">Loading folder...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/study/flash-cards")}
        className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All Folders
      </Button>

      {/* Header */}
      {folder && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <Folder className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{folder.name}</h1>
                <Badge variant="outline" className="text-[10px] py-0.5 border-accent/20 text-accent bg-accent/5 flex items-center gap-1 font-semibold">
                  <Tag className="h-2.5 w-2.5" />
                  {folder.tag}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {sets.length} {sets.length === 1 ? "set" : "sets"} inside folder
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-10 border-accent/20 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all font-semibold"
              onClick={() => setAddExistingOpen(true)}
            >
              <Library className="h-3.5 w-3.5" /> Add from Library
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
              onClick={() => setCreateSetOpen(true)}
            >
              <Plus className="h-4 w-4" /> Create Set
            </Button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed bg-card/30">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            No flashcard sets in this folder yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a fresh set or add an existing set from your library.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s, i) => (
            <div key={s.id} className="relative group/container">
              <SetCard
                title={s.title}
                subject={s.subject}
                isAdmin={s.is_admin}
                cardCount={s.cardCount}
                author={s.is_admin ? "Admin" : "You"}
                index={i}
                onClick={() => router.push(`/study/flash-cards/set/${s.id}`)}
              />
              {/* Floating remove button */}
              <Button
                variant="ghost"
                size="icon"
                disabled={removingId === s.id}
                onClick={(e) => handleRemoveSet(e, s.id)}
                className="absolute top-2 left-2 h-7 w-7 rounded-full bg-background border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive opacity-0 group-hover/container:opacity-100 transition-opacity shadow-sm z-10"
              >
                {removingId === s.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateSetDialog
        open={createSetOpen}
        onOpenChange={setCreateSetOpen}
        folderId={folderId}
        onCreated={() => fetchFolderDetails(true)}
      />
      <AddToFolderDialog
        open={addExistingOpen}
        onOpenChange={setAddExistingOpen}
        folderId={folderId}
        onAdded={() => fetchFolderDetails(true)}
      />
    </div>
  );
}
