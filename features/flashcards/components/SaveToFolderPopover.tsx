"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { FolderHeart, Check, Plus, Loader2, FolderPlus, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveToFolderPopoverProps {
  setId: string;
}

export default function SaveToFolderPopover({ setId }: SaveToFolderPopoverProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<any[]>([]);
  const [savedFolderIds, setSavedFolderIds] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderTag, setNewFolderTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch folders
      const { data: dbFolders, error: foldersErr } = await supabase
        .from("flashcard_folders")
        .select("*")
        .order("name", { ascending: true });

      if (foldersErr) throw foldersErr;

      // 2. Fetch folder_sets links for this set
      const { data: dbLinks, error: linksErr } = await supabase
        .from("flashcard_folder_sets")
        .select("folder_id")
        .eq("set_id", setId);

      if (linksErr) throw linksErr;

      setFolders(dbFolders || []);
      setSavedFolderIds((dbLinks || []).map((l) => l.folder_id));
    } catch (err: any) {
      toast({ title: "Failed to load folders", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, setId]);

  const handleToggleFolder = async (folderId: string) => {
    const isSaved = savedFolderIds.includes(folderId);

    try {
      if (isSaved) {
        // Remove from folder
        const { error } = await supabase
          .from("flashcard_folder_sets")
          .delete()
          .match({ folder_id: folderId, set_id: setId });

        if (error) throw error;

        setSavedFolderIds((prev) => prev.filter((id) => id !== folderId));
        toast({ title: "Removed from folder" });
      } else {
        // Add to folder
        const { error } = await supabase
          .from("flashcard_folder_sets")
          .insert({ folder_id: folderId, set_id: setId });

        if (error) throw error;

        setSavedFolderIds((prev) => [...prev, folderId]);
        toast({ title: "Saved to folder!" });
      }
    } catch (err: any) {
      toast({ title: "Error updating folder", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (!newFolderTag.trim()) {
      toast({ title: "Please provide a tag for the folder", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");

      // 1. Create folder
      const { data: folder, error: folderErr } = await supabase
        .from("flashcard_folders")
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          tag: newFolderTag.trim(),
        })
        .select()
        .single();

      if (folderErr || !folder) throw folderErr || new Error("Failed to create folder");

      // 2. Link set
      const { error: linkErr } = await supabase
        .from("flashcard_folder_sets")
        .insert({ folder_id: folder.id, set_id: setId });

      if (linkErr) throw linkErr;

      toast({ title: "Folder created and set saved!" });
      setNewFolderName("");
      setNewFolderTag("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const isSavedInAny = savedFolderIds.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 gap-1.5 text-xs font-semibold px-2.5 rounded-full shadow-sm border transition-all duration-200",
            isSavedInAny
              ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground hover:border-accent"
              : "border-border/80 hover:bg-accent hover:text-accent-foreground hover:border-accent"
          )}
        >
          <FolderHeart className={cn("h-3.5 w-3.5", isSavedInAny ? "fill-accent" : "")} />
          {isSavedInAny ? "Organized" : "Save to Folder"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
          <FolderPlus className="h-4 w-4 text-accent" /> Save to Folder
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {folders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                You don't have any folders yet.
              </p>
            ) : (
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar border-b border-border/50 pb-3">
                {folders.map((folder) => {
                  const isSaved = savedFolderIds.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleToggleFolder(folder.id)}
                      className={cn(
                        "w-full flex items-center justify-between text-left px-3 py-2.5 mb-1.5 rounded-xl text-xs font-medium transition-all group border shadow-sm",
                        isSaved 
                          ? "bg-accent text-accent-foreground border-accent shadow-accent/20" 
                          : "bg-card text-muted-foreground border-border hover:bg-secondary/80 hover:border-border/80 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Folder className={cn("h-4 w-4 shrink-0", isSaved ? "fill-accent-foreground/20 text-accent-foreground" : "fill-muted/20 text-muted-foreground")} />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      {isSaved ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick folder creation */}
            <form onSubmit={handleCreateAndSave} className="space-y-2.5 pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Quick Create Folder
              </span>
              <div className="flex flex-col gap-1.5">
                <Input
                  placeholder="New Folder Name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  disabled={creating}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Tag (e.g. Audit)..."
                  value={newFolderTag}
                  onChange={(e) => setNewFolderTag(e.target.value)}
                  disabled={creating}
                  className="h-8 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating || !newFolderName.trim() || !newFolderTag.trim()}
                  className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                >
                  {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  Create & Save
                </Button>
              </div>
            </form>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
