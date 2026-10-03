"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Loader2 } from "lucide-react";
import { SubjectPracticeStats } from "@/hooks/useStudyPlannerState";

interface Props {
  open: boolean;
  subjectStats: SubjectPracticeStats[];
  onSave: (draft: Record<string, Partial<SubjectPracticeStats>>) => Promise<any>;
  onClose: () => void;
  preventClose?: boolean;
}

type Expertise = "Easy" | "Moderate" | "Tough";
const EXPERTISE: Expertise[] = ["Easy", "Moderate", "Tough"];

const SubjectStatusModal = ({ open, subjectStats, onSave, onClose, preventClose = false }: Props) => {
  const [draft, setDraft] = useState<Record<string, Partial<SubjectPracticeStats>>>({});
  const [saving, setSaving] = useState(false);

  // Initialize draft when modal opens or subjectStats load
  useEffect(() => {
    if (open && subjectStats.length > 0) {
      const out: Record<string, Partial<SubjectPracticeStats>> = {};
      subjectStats.forEach((s) => {
        out[s.sub.slug] = {
          classesDone: s.classesDone,
          rev1Done: s.rev1Done,
          rev2Done: s.rev2Done,
          expertise: s.expertise || "Moderate",
        };
      });
      setDraft(out);
    }
  }, [open, subjectStats]);

  const update = (slug: string, patch: Partial<SubjectPracticeStats>) => {
    setDraft((d) => ({
      ...d,
      [slug]: { ...d[slug], ...patch },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Determine if draft has any changes from the initial values in subjectStats
  const isChanged = subjectStats.some((s) => {
    const d = draft[s.sub.slug];
    if (!d) return false;
    return (
      d.classesDone !== s.classesDone ||
      d.rev1Done !== s.rev1Done ||
      d.rev2Done !== s.rev2Done ||
      d.expertise !== s.expertise
    );
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !preventClose && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        hideClose={preventClose}
        onPointerDownOutside={(e) => {
          if (preventClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <ClipboardList className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center font-bold">Tell us where you stand</DialogTitle>
          <DialogDescription className="text-center">
            Mark your current status & comfort level for each subject. We'll tailor your study day allocations accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {subjectStats.map((s) => {
            const d = draft[s.sub.slug] || {};
            return (
              <div key={s.sub.slug} className="rounded-xl border p-4 bg-card shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <div>
                    <div className="font-semibold text-foreground">{s.sub.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.sub.shortName}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Preparation Status</div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: "classesDone", label: "Classes Done" },
                        { key: "rev1Done", label: "Revision 1 Done" },
                        { key: "rev2Done", label: "Revision 2 Done" },
                      ].map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none font-sans">
                          <Checkbox
                            checked={!!(d as any)[opt.key]}
                            onCheckedChange={(v) => update(s.sub.slug, { [opt.key]: !!v } as any)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Comfort Level</div>
                    <div className="flex gap-2">
                      {EXPERTISE.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => update(s.sub.slug, { expertise: e })}
                          className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
                            d.expertise === e
                              ? "border-accent bg-accent text-accent-foreground shadow-sm font-sans"
                              : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground font-sans bg-card"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-background pt-2 border-t mt-4 flex gap-2">
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
            onClick={handleSave}
            disabled={(!isChanged && !preventClose) || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectStatusModal;
