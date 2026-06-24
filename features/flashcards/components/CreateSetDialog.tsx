"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";

interface CreateSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  folderId?: string;
  isAdmin?: boolean;
}

export default function CreateSetDialog({
  open,
  onOpenChange,
  onCreated,
  folderId,
  isAdmin = false,
}: CreateSetDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("general");
  const [cards, setCards] = useState<{ front: string; back: string }[]>([
    { front: "", back: "" },
    { front: "", back: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const allSubjects = [
    "general",
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final,
  ];

  const addCard = () => setCards((c) => [...c, { front: "", back: "" }]);
  const removeCard = (i: number) => setCards((c) => c.filter((_, idx) => idx !== i));
  const updateCard = (i: number, key: "front" | "back", value: string) =>
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, [key]: value } : card)));

  const reset = () => {
    setTitle("");
    setSubject("general");
    setCards([
      { front: "", back: "" },
      { front: "", back: "" },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      toast({
        title: "Add at least 1 card",
        description: "Both front (question) and back (answer) are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      // 1. Insert Set
      const { data: setRow, error: setErr } = await supabase
        .from("flashcard_sets")
        .insert({
          user_id: isAdmin ? null : uid,
          title: title.trim(),
          subject: subject as any,
          is_admin: isAdmin,
        })
        .select()
        .single();

      if (setErr || !setRow) throw setErr || new Error("Failed to save set");

      // 2. Insert Cards
      const { error: cardErr } = await supabase.from("flashcards").insert(
        validCards.map((c, i) => ({
          set_id: setRow.id,
          user_id: isAdmin ? null : uid,
          front: c.front.trim(),
          back: c.back.trim(),
          position: i,
        }))
      );

      if (cardErr) throw cardErr;

      // 3. Link to Folder if folderId is provided
      if (folderId) {
        const { error: linkErr } = await supabase.from("flashcard_folder_sets").insert({
          folder_id: folderId,
          set_id: setRow.id,
        });
        if (linkErr) throw linkErr;
      }

      toast({
        title: isAdmin ? "Admin set published!" : "Set published!",
        description: `${validCards.length} cards saved successfully.`,
      });

      reset();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast({ title: "Couldn't save set", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {isAdmin ? "Create Admin Flashcard Set" : "Create your own flashcard set"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Set Title</label>
              <Input
                placeholder="e.g. Ind AS 115 — Revenue Recognition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Category</label>
              <Select value={subject} onValueChange={setSubject} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {allSubjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {formatSubjectName(sub as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Cards</h4>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {cards.length} card{cards.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar">
              {cards.map((c, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Card {i + 1}</span>
                    {cards.length > 1 && (
                      <button
                        onClick={() => removeCard(i)}
                        disabled={saving}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Front (Question/Concept)"
                    value={c.front}
                    onChange={(e) => updateCard(i, "front", e.target.value)}
                    disabled={saving}
                    className="text-sm bg-background"
                  />
                  <Textarea
                    placeholder="Back (Answer/Details)"
                    value={c.back}
                    onChange={(e) => updateCard(i, "back", e.target.value)}
                    disabled={saving}
                    className="text-sm min-h-[60px] bg-background resize-none"
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full gap-1.5 h-10 border-dashed" onClick={addCard} disabled={saving}>
              <Plus className="h-4 w-4" /> Add Card
            </Button>
          </div>
        </div>
        <DialogFooter className="border-t border-border pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="h-10">
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Set"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
