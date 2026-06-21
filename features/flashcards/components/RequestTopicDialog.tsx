"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2 } from "lucide-react";

interface RequestTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestTopicDialog({ open, onOpenChange }: RequestTopicDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic name is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const { error } = await supabase.from("flashcard_requests").insert({
        user_id: user.id,
        topic: topic.trim(),
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Request submitted!",
        description: "Admins will review your topic request and publish a set soon.",
      });
      setTopic("");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Couldn't submit request", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            Request a flashcard set
          </DialogTitle>
          <DialogDescription>
            Can't find a set for a topic? Submit a request, and our admin team will publish it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topic / Concept</label>
            <Input
              placeholder="e.g. Ind AS 116 Leases, Audit of banks"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={submitting}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Specific areas or notes (Optional)</label>
            <Textarea
              placeholder="e.g. Focus on recognition criteria and lessee accounting formulas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="h-10">
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 font-bold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
