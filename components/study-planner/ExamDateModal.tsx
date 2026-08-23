"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getUpcomingAttempts } from "@/utils/exam-attempts";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { CalendarDays, Loader2, X } from "lucide-react";
import { StudentLevel } from "@/utils/supabase/types";

interface Props {
  open: boolean;
  onConfirm: (label: string) => void;
  onClose: () => void;
  initialAttempt?: string;
}

const ExamDateModal = ({ open, onConfirm, onClose, initialAttempt }: Props) => {
  const { studentLevel } = useStudent();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize selection
  useEffect(() => {
    if (open) {
      setSelected(initialAttempt || null);
    }
  }, [open, initialAttempt]);

  // Generate options based on current user level, matching Navbar
  const options = studentLevel
    ? getUpcomingAttempts(studentLevel as StudentLevel, 4)
    : [];

  const handleStart = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onConfirm(selected);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Button disabled unless selected exists and has changed from the initial configured attempt
  const isChanged = selected !== null && selected !== (initialAttempt || "");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          // If the attempt is not configured yet, prevent closing by clicking outside
          if (!initialAttempt) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!initialAttempt) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <CalendarDays className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">When is your CA Exam attempt?</DialogTitle>
          <DialogDescription className="text-center">
            Select your target attempt to start planning. This will align with your profile configuration.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No upcoming attempts found for your level.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 py-4">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setSelected(o.label)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selected === o.label
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:border-accent/50 text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            disabled={!isChanged || saving}
            onClick={handleStart}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {initialAttempt ? "Update Attempt Date" : "Start Planning"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamDateModal;
