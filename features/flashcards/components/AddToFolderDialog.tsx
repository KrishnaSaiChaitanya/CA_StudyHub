"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, Loader2, Plus, Layers, ShieldCheck, User } from "lucide-react";
import { formatSubjectName } from "@/utils/subjects";
import { cn } from "@/lib/utils";

interface AddToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  onAdded: () => void;
}

export default function AddToFolderDialog({ open, onOpenChange, folderId, onAdded }: AddToFolderDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAvailableSets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch all visible sets (user's sets + admin sets)
      const { data: dbSets, error: setsErr } = await supabase
        .from("flashcard_sets")
        .select("*")
        .or(`user_id.eq.${user.id},is_admin.eq.true`);

      if (setsErr) throw setsErr;

      // 2. Fetch sets already in this folder
      const { data: linkedSets, error: linkErr } = await supabase
        .from("flashcard_folder_sets")
        .select("set_id")
        .eq("folder_id", folderId);

      if (linkErr) throw linkErr;

      const linkedIds = (linkedSets || []).map((l) => l.set_id);

      // Filter out sets already in this folder
      const availableSets = (dbSets || []).filter((s) => !linkedIds.includes(s.id));
      setSets(availableSets);
      setSelectedSetId(null);
    } catch (err: any) {
      toast({ title: "Failed to load sets", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableSets();
    }
  }, [open, folderId]);

  const handleAddSet = async () => {
    if (!selectedSetId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("flashcard_folder_sets")
        .insert({ folder_id: folderId, set_id: selectedSetId });

      if (error) throw error;

      toast({ title: "Set added to folder!" });
      onOpenChange(false);
      onAdded();
    } catch (err: any) {
      toast({ title: "Failed to add set", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredSets = sets.filter((s) => {
    return (
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            Add existing set to folder
          </DialogTitle>
          <DialogDescription>
            Select a flashcard set from your library or admin sets to organize inside this folder.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative my-2 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            disabled={loading || saving}
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] space-y-2 pr-1 no-scrollbar border rounded-lg p-2 bg-muted/5">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No sets available to add.
            </div>
          ) : (
            filteredSets.map((set) => {
              const isSelected = selectedSetId === set.id;
              const SourceIcon = set.is_admin ? ShieldCheck : User;
              return (
                <div
                  key={set.id}
                  onClick={() => !saving && setSelectedSetId(set.id)}
                  className={cn(
                    "flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "border-accent bg-accent/5 shadow-sm shadow-accent/5"
                      : "border-border bg-card hover:border-accent/40"
                  )}
                >
                  <div className="min-w-0 pr-4">
                    <h4 className={cn("text-xs font-semibold truncate", isSelected ? "text-accent" : "text-foreground")}>
                      {set.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {formatSubjectName(set.subject)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SourceIcon className={cn("h-3.5 w-3.5", set.is_admin ? "text-accent" : "text-violet-500")} />
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">
                      {set.is_admin ? "Admin" : "You"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="h-10">
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
            onClick={handleAddSet}
            disabled={saving || !selectedSetId}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…</> : "Add to Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
