"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStudyPlanner, type TrackerPhase, type ChapterStatus } from "@/hooks/useStudyPlanner";
import { getSubject } from "@/lib/studyData";
import { ArrowLeft, CheckCircle2, Circle, SkipForward, AlertTriangle, BookOpen, ChevronDown, Save, Loader2 } from "lucide-react";
import { saveBatchChapterRemarks } from "../actions";
import { toast } from "sonner";

const PHASES: { key: TrackerPhase; label: string; short: string }[] = [
  { key: "study1", label: "Study 1", short: "Study" },
  { key: "rev1", label: "Revision 1", short: "Rev 1" },
  { key: "rev2", label: "Revision 2", short: "Rev 2" },
];

const STATUS_OPTS: { value: ChapterStatus; label: string; icon: any; cls: string }[] = [
  { value: "pending", label: "Yet to start", icon: Circle, cls: "text-muted-foreground border-border" },
  { value: "completed", label: "Completed", icon: CheckCircle2, cls: "text-green-600 border-green-500/40 bg-green-500/10" },
  { value: "skipped", label: "Skipped", icon: SkipForward, cls: "text-amber-600 border-amber-500/40 bg-amber-500/10" },
];

interface Props {
  params: Promise<{ slug: string }>;
}

const SubjectTrackerPage = ({ params }: Props) => {
  const { slug } = use(params);
  const router = useRouter();
  const sub = getSubject(slug);
  const {
    state,
    subjectStats,
    loading,
    updateChapter,
    updateSubtopic,
    setLastActivity,
    updateBatchRemarksLocally,
    refreshProgress,
  } = useStudyPlanner();

  const [activePhase, setActivePhase] = useState<TrackerPhase>("study1");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Local remarks draft state
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({});
  const [savingRemarks, setSavingRemarks] = useState(false);

  useEffect(() => {
    if (sub) {
      setLastActivity({ slug: sub.slug, phase: activePhase });
    }
  }, [sub, activePhase, setLastActivity]);

  const stats = useMemo(() => {
    return subjectStats.find((s) => s.sub.slug === slug);
  }, [subjectStats, slug]);

  const chapters = useMemo(() => {
    return stats?.lectures || [];
  }, [stats]);

  const tracker = useMemo(() => {
    return state.subjects[slug]?.tracker || {};
  }, [state, slug]);

  const phaseProgress = (phase: TrackerPhase) => {
    let totalSubtopics = 0;
    let doneSubtopics = 0;

    chapters.forEach((ch, idx) => {
      const cur = tracker[phase]?.[idx];
      const subtopicsList = ch.subtopics || [];
      const isChapterComplete = cur?.status === "completed";

      if (subtopicsList.length > 0) {
        totalSubtopics += subtopicsList.length;
        if (isChapterComplete) {
          doneSubtopics += subtopicsList.length;
        } else {
          // Count completed subtopics in this phase
          subtopicsList.forEach((_, si) => {
            if (cur?.subtopics?.[si]?.status === "completed") {
              doneSubtopics++;
            }
          });
        }
      } else {
        totalSubtopics += 1;
        if (isChapterComplete) {
          doneSubtopics += 1;
        }
      }
    });

    return {
      done: doneSubtopics,
      total: totalSubtopics,
      pct: totalSubtopics ? Math.round((doneSubtopics / totalSubtopics) * 100) : 0,
    };
  };

  const prevPhase = (p: TrackerPhase): TrackerPhase | null =>
    p === "rev1" ? "study1" : p === "rev2" ? "rev1" : null;

  const carryOver = useMemo(() => {
    const prev = prevPhase(activePhase);
    if (!prev) return [];
    const map = tracker[prev] || {};
    return chapters
      .map((c, i) => ({ c, i, s: map[i]?.status }))
      .filter((x) => x.s === "skipped" || !x.s || x.s === "pending");
  }, [activePhase, chapters, tracker]);

  // Check if draft remarks differ from the current tracker values
  const hasUnsavedRemarks = useMemo(() => {
    return Object.entries(remarksDraft).some(([key, val]) => {
      const [phaseStr, chIdxStr] = key.split("-");
      const phase = phaseStr as TrackerPhase;
      const chIdx = parseInt(chIdxStr, 10);
      const currentVal = tracker[phase]?.[chIdx]?.remarks ?? "";
      return val !== currentVal;
    });
  }, [remarksDraft, tracker]);

  // Save remarks draft list to database
  const handleSaveRemarks = async () => {
    setSavingRemarks(true);
    const dbUpdates: { chapterId: string; phase: TrackerPhase; remarks: string }[] = [];
    const localUpdates: { chapterIdx: number; phase: TrackerPhase; remarks: string }[] = [];

    Object.entries(remarksDraft).forEach(([key, val]) => {
      const [phaseStr, chIdxStr] = key.split("-");
      const phase = phaseStr as TrackerPhase;
      const chIdx = parseInt(chIdxStr, 10);

      const currentVal = tracker[phase]?.[chIdx]?.remarks ?? "";
      if (val !== currentVal) {
        const chapterId = chapters[chIdx]?.id;
        if (chapterId) {
          dbUpdates.push({ chapterId, phase, remarks: val });
          localUpdates.push({ chapterIdx: chIdx, phase, remarks: val });
        }
      }
    });

    if (dbUpdates.length > 0) {
      const res = await saveBatchChapterRemarks(dbUpdates);
      if (res.success) {
        toast.success("Remarks saved successfully!");
        updateBatchRemarksLocally(slug, localUpdates);
        setRemarksDraft({});
      } else {
        toast.error(res.error || "Failed to save remarks");
      }
    }
    setSavingRemarks(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (!sub || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20 text-center mx-auto max-w-md">
          <p className="text-muted-foreground">Subject details not found in database.</p>
          <Button className="mt-4 bg-accent text-accent-foreground" onClick={() => router.push("/study/study-planning")}>
            Back to Planner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <section className="container py-8 px-8 md:px-4 max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/study/study-planning")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Planning
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-widest">{sub.shortName}</div>
              <h1 className="text-3xl font-extrabold text-foreground mt-1">{sub.name}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {chapters.length} chapters · Real-time readiness progression
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-[280px]">
              {PHASES.map((p) => {
                const pr = phaseProgress(p.key);
                return (
                  <Card key={p.key} className="p-3 bg-muted/20 border border-border/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.short}</div>
                    <div className="text-lg font-bold mt-1 text-foreground">{pr.pct}%</div>
                    <Progress value={pr.pct} className="mt-1.5 h-1.5" />
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>

        <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as TrackerPhase)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            {PHASES.map((p) => (
              <TabsTrigger key={p.key} value={p.key} className="font-semibold">{p.label}</TabsTrigger>
            ))}
          </TabsList>

          {PHASES.map((p) => (
            <TabsContent key={p.key} value={p.key} className="mt-6 space-y-4">
              {p.key !== "study1" && carryOver.length > 0 && activePhase === p.key && (
                <Alert className="border-amber-500/40 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-700 font-bold">Pending from {PHASES.find((x) => x.key === prevPhase(p.key))?.label}</AlertTitle>
                  <AlertDescription className="text-xs text-amber-700/90 leading-relaxed mt-1">
                    {carryOver.length} chapter{carryOver.length === 1 ? "" : "s"} marked skipped or not started:{" "}
                    <span className="font-semibold">
                      {carryOver.slice(0, 6).map((x) => x.c.topic).join(", ")}
                      {carryOver.length > 6 ? `, +${carryOver.length - 6} more` : ""}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="divide-y overflow-hidden border border-border/80 shadow-sm">
                {chapters.map((ch, idx) => {
                  const cur = tracker[p.key]?.[idx];
                  const status = cur?.status ?? "pending";
                  const subtopics = ch.subtopics || [];
                  const subDone = subtopics.filter((_, si) => cur?.subtopics?.[si]?.status === "completed").length;
                  const open = !!expanded[`${p.key}-${idx}`];

                  const draftKey = `${p.key}-${idx}`;
                  const remarksVal = remarksDraft[draftKey] !== undefined ? remarksDraft[draftKey] : (cur?.remarks ?? "");

                  return (
                    <div key={ch.id} className="p-5 bg-card hover:bg-muted/5 transition-colors">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] md:items-start">
                        {/* Caret, Chapter Name, metadata */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpanded((e) => ({ ...e, [`${p.key}-${idx}`]: !open }))}
                            className="flex items-start gap-2 text-left group"
                          >
                            <ChevronDown className={`h-4.5 w-4.5 mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"} group-hover:text-foreground`} />
                            <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                              <span className="text-muted-foreground mr-2 font-mono text-xs">{idx + 1}.</span>
                              {ch.topic}
                            </span>
                          </button>
                          <div className="text-[11px] text-muted-foreground mt-1 ml-7 font-medium">
                            {ch.hours}h est. · {subDone} / {subtopics.length} sub-topics done
                          </div>
                        </div>

                        {/* Status Selectors */}
                        <div className="flex gap-1 flex-wrap">
                          {STATUS_OPTS.map((opt) => {
                            const Icon = opt.icon;
                            const active = status === opt.value;
                            const isFRDefaultPending = opt.value === "pending" && active;
                            const cls = isFRDefaultPending
                              ? "text-sky-600 border-sky-500/40 bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10"
                              : opt.cls;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateChapter(sub.slug, p.key, idx, { status: opt.value })}
                                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${active ? cls : "text-muted-foreground border-border hover:border-accent/40 bg-card hover:text-foreground"
                                  }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Remarks Comments Textarea holds in local draft */}
                        <Textarea
                          value={remarksVal}
                          onChange={(e) => setRemarksDraft(prev => ({ ...prev, [draftKey]: e.target.value }))}
                          placeholder="Remarks — e.g. formulas, important questions, doubts…"
                          className="min-h-[56px] text-xs resize-y border-border focus-visible:ring-accent"
                        />
                      </div>

                      {/* Expandable Sub-topics checklists */}
                      {open && (
                        <div className="mt-4 ml-6 border-l-2 border-dashed pl-5 space-y-3.5 py-1">
                          {subtopics.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">No subtopics defined for this chapter.</div>
                          ) : (
                            subtopics.map((st, si) => {
                              const sSt = cur?.subtopics?.[si]?.status ?? "pending";
                              return (
                                <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 p-2 rounded-lg border border-border/40">
                                  <div className="text-xs font-medium text-foreground">
                                    <span className="text-muted-foreground font-mono mr-2">{idx + 1}.{si + 1}</span>
                                    {st.name}
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {STATUS_OPTS.map((opt) => {
                                      const Icon = opt.icon;
                                      const active = sSt === opt.value;
                                      const isFRDefaultPending = opt.value === "pending" && active;
                                      const cls = isFRDefaultPending
                                        ? "text-sky-600 border-sky-500/40 bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10"
                                        : opt.cls;
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => updateSubtopic(sub.slug, p.key, idx, si, { status: opt.value })}
                                          className={`flex items-center gap-1 rounded-full border px-3 py-0.5 text-[10px] font-bold transition-all ${active ? cls : "text-muted-foreground border-border hover:border-accent/40 bg-card hover:text-foreground"
                                            }`}
                                        >
                                          <Icon className="h-3 w-3" />
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Floating Save Changes Banner for Remarks */}
      {hasUnsavedRemarks && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <span className="text-xs font-semibold text-foreground animate-pulse">
            You have unsaved remarks changes.
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRemarksDraft({})}
              className="text-xs rounded-full h-8"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRemarks}
              disabled={savingRemarks}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-full h-8 px-4 flex items-center gap-1.5"
            >
              {savingRemarks ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Remarks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTrackerPage;
