"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { Plus, Trash2, Loader2, Edit3 } from "lucide-react";

interface EditSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdited: () => void;
  setId: string;
}

export default function EditSetDialog({
  open,
  onOpenChange,
  onEdited,
  setId,
}: EditSetDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("general");
  const [cards, setCards] = useState<{ id?: string; front: string; back: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const allSubjects = [
    "general",
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final,
  ];

  useEffect(() => {
    if (open && setId) {
      loadSetDetails();
    }
  }, [open, setId]);

  const loadSetDetails = async () => {
    setLoading(true);
    try {
      const { data: setRow, error: setErr } = await supabase
        .from("flashcard_sets")
        .select("*")
        .eq("id", setId)
        .single();
      
      if (setErr) throw setErr;

      setTitle(setRow.title);
      setSubject(setRow.subject || "general");

      const { data: cardsRow, error: cardsErr } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", setId)
        .order("position", { ascending: true });

      if (cardsErr) throw cardsErr;

      if (cardsRow && cardsRow.length > 0) {
        setCards(cardsRow.map((c: any) => ({ id: c.id, front: c.front, back: c.back })));
      } else {
        setCards([
          { front: "", back: "" },
          { front: "", back: "" },
        ]);
      }
    } catch (err: any) {
      toast({ title: "Failed to load set", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addCard = () => setCards((c) => [...c, { front: "", back: "" }]);
  const removeCard = (i: number) => setCards((c) => c.filter((_, idx) => idx !== i));
  const updateCard = (i: number, key: "front" | "back", value: string) =>
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, [key]: value } : card)));

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
      // 1. Update Set
      const { error: setErr } = await supabase
        .from("flashcard_sets")
        .update({
          title: title.trim(),
          subject: subject as any,
        })
        .eq("id", setId);

      if (setErr) throw setErr;

      // 2. To simplify, we delete existing cards and re-insert the new ones to maintain order
      const { error: delErr } = await supabase
        .from("flashcards")
        .delete()
        .eq("set_id", setId);

      if (delErr) throw delErr;

      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      const { error: cardErr } = await supabase.from("flashcards").insert(
        validCards.map((c, i) => ({
          set_id: setId,
          user_id: uid, 
          front: c.front.trim(),
          back: c.back.trim(),
          position: i,
        }))
      );

      if (cardErr) throw cardErr;

      toast({
        title: "Set updated!",
        description: `${validCards.length} cards saved successfully.`,
      });

      onOpenChange(false);
      onEdited();
    } catch (err: any) {
      toast({ title: "Couldn't update set", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-accent" />
            Edit Flashcard Set
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
        )}
        <DialogFooter className="border-t border-border pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="h-10">
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
