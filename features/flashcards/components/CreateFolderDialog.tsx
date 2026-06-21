"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { FolderPlus, Loader2 } from "lucide-react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateFolderDialog({ open, onOpenChange, onCreated }: CreateFolderDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Folder name is required", variant: "destructive" });
      return;
    }
    if (!tag.trim()) {
      toast({ title: "Folder tag is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const { error } = await supabase.from("flashcard_folders").insert({
        user_id: user.id,
        name: name.trim(),
        tag: tag.trim(),
      });

      if (error) throw error;

      toast({ title: "Folder created successfully!" });
      setName("");
      setTag("");
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" />
            Create new folder
          </DialogTitle>
          <DialogDescription>
            Organize your study cards by creating folders with custom tags (e.g. "Taxation", "Exam prep").
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Folder Name</label>
            <Input
              placeholder="e.g. CA Final — Group 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tag / Subject</label>
            <Input
              placeholder="e.g. Audit, Revision, Group 2"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={saving}
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="h-10">
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 shadow-sm font-semibold"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
