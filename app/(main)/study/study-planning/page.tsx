"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ExamDateModal from "@/components/study-planner/ExamDateModal";
import SubjectStatusModal from "@/components/study-planner/SubjectStatusModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudyPlannerState } from "@/hooks/useStudyPlannerState";
import { CalendarDays, ArrowRight, TrendingUp, Gauge, Settings2, Sparkles, BookOpen, Minus, Plus, Save, History } from "lucide-react";
import { saveManualAllocations } from "./actions";
import { toast } from "sonner";

const StudyPlanningPage = () => {
  const router = useRouter();
  const {
    state,
    setExam,
    daysLeft,
    subjectStats,
    setSubjectStats,
    overallPct,
    difficulty,
    loading,
    updateSubjectPreps,
    refreshStats,
    recentTask,
    hasSetupPreps,
  } = useStudyPlannerState();

  const [showExamModal, setShowExamModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // local draft adjustments for manual days allocation
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [savingDays, setSavingDays] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!state.examLabel) {
        setShowExamModal(true);
      } else if (!hasSetupPreps) {
        setShowStatusModal(true);
      }
    }
  }, [loading, state.examLabel, hasSetupPreps]);

  // Force refetch on page mount to ensure tracker updates are reflected
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const draftTotal = subjectStats.reduce((sum, s) => {
    const override = draft[s.sub.slug];
    return sum + (override !== undefined ? override : s.allocatedDays);
  }, 0);
  const balanced = draftTotal === daysLeft;

  // Adjust local draft days
  const adjust = (slug: string, offset: number) => {
    const currentAllocated = subjectStats.find(s => s.sub.slug === slug)?.allocatedDays ?? 0;
    const currentValue = draft[slug] ?? currentAllocated;
    const newValue = Math.max(1, currentValue + offset);
    setDraft(d => ({ ...d, [slug]: newValue }));
  };

  const handleConfirmExam = async (label: string) => {
    await setExam(label);
    setShowExamModal(false);
  };

  const handleSaveStatus = async (draftPreps: any) => {
    await updateSubjectPreps(draftPreps);
    setShowStatusModal(false);
  };

  // Save manual day allocations to the database
  const handleSaveManualDays = async () => {
    setSavingDays(true);
    const deltaPayload: Record<string, number> = {};
    subjectStats.forEach((s) => {
      const draftVal = draft[s.sub.slug];
      if (draftVal !== undefined) {
        deltaPayload[s.sub.slug] = draftVal - s.defaultDays;
      }
    });
    const res = await saveManualAllocations(deltaPayload);
    setSavingDays(false);
    if (res.success) {
      toast.success("Study planning allocations updated!");
      // Update local state without API call
      setSubjectStats((prev) =>
        prev.map((s) => {
          const draftVal = draft[s.sub.slug];
          if (draftVal !== undefined) {
            return { ...s, allocatedDays: draftVal };
          }
          return s;
        })
      );
      setDraft({}); // Clear draft so banner disappears
    } else {
      toast.error(res.error || "Failed to save adjustments");
    }
  };

  // Check if draft adjustments differ from subjectStats allocatedDays
  const hasChanges = Object.entries(draft).some(([slug, val]) => {
    const current = subjectStats.find(s => s.sub.slug === slug)?.allocatedDays;
    return current !== undefined && val !== current;
  });

  const status = (pct: number) => {
    if (pct === 0) return { label: "Not Started", cls: "bg-muted text-muted-foreground border-muted-foreground/30" };
    if (pct >= 100) return { label: "Completed", cls: "bg-green-500/10 text-green-600 border-green-500/30" };
    return { label: "In Progress", cls: "bg-accent/10 text-accent border-accent/30" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading your custom plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <ExamDateModal
        open={showExamModal}
        onConfirm={handleConfirmExam}
        onClose={() => setShowExamModal(false)}
        initialAttempt={state.examLabel}
      />
      <SubjectStatusModal
        open={showStatusModal}
        subjectStats={subjectStats}
        onSave={handleSaveStatus}
        onClose={() => setShowStatusModal(false)}
        preventClose={!hasSetupPreps}
      />

      <div className="container py-8 px-8 md:px-4 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" /> Study Planning
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure target attempts, define subject standings, and dynamically adjust study schedules.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusModal(true)}
              className="gap-2 border-accent/20 hover:border-accent text-accent"
            >
              <Settings2 className="h-4 w-4" /> Tailor Allocations
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/study")}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" /> Study Materials
            </Button> */}
          </div>
        </div>

        {state.examLabel && (
          <>
            {/* Countdown banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-muted/50 via-muted/30 to-background border border-border/80 p-5 sm:p-6 overflow-hidden relative">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                  <div className="p-3 bg-accent/10 rounded-xl text-accent self-start sm:self-auto shadow-sm border border-accent/20">
                    <CalendarDays className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {daysLeft} <span className="text-sm sm:text-base font-medium text-muted-foreground">days left</span>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span>for your CA {subjectStats[0]?.sub.level.toUpperCase()} Exam — {state.examLabel}</span>
                      <button
                        onClick={() => setShowExamModal(true)}
                        className="text-xs text-accent hover:text-accent/80 hover:underline font-bold transition-colors inline-flex items-center"
                      >
                        (Change attempt)
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Dashboard Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card
                className={`p-5 flex flex-col justify-between ${recentTask ? "cursor-pointer hover:border-accent/50 transition-colors" : ""}`}
                onClick={() => recentTask && router.push(`/study/study-planning/${recentTask.slug}`)}
              >
                <div className="flex items-center gap-3 text-muted-foreground text-xs uppercase tracking-wide font-bold">
                  <History className="h-4 w-4" /> Recent Task
                </div>
                {recentTask ? (
                  <div className="mt-2">
                    <div className="text-lg font-bold leading-tight line-clamp-1 text-foreground">{recentTask.subjectName}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {recentTask.phaseLabel}{recentTask.chapterName ? ` · ${recentTask.chapterName}` : ""}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-accent font-medium">
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="text-lg font-bold text-foreground">No activity yet</div>
                    <div className="text-xs text-muted-foreground mt-1">Open a subject to start tracking</div>
                  </div>
                )}
              </Card>

              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider font-bold">
                  <span className="flex items-center gap-2.5">
                    <TrendingUp className="h-4 w-4" /> Overall Completion
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-3xl font-extrabold text-foreground">{overallPct}%</div>
                  <Progress value={overallPct} className="h-2" />
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2.5 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                  <Gauge className="h-4 w-4" /> Difficulty
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`h-3.5 w-3.5 rounded-full ${difficulty.color}`} />
                  <span className="text-2xl font-extrabold text-foreground">{difficulty.label}</span>
                </div>
              </Card>
            </div>

            {/* Subject Allocation Grid */}
            <Card className="border border-border/80 overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Subject-wise Study Planning</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Suggested allocated days are calculated automatically. Use buttons to manually tweak allocations.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`text-xs px-2.5 py-1 rounded-md border ${balanced ? "bg-green-500/10 text-green-700 border-green-500/30" : "bg-amber-500/10 text-amber-700 border-amber-500/30"}`}>
                    Allocated <span className="font-semibold">{draftTotal}</span> / {daysLeft} days
                    {!balanced && (
                      <span className="ml-1">
                        ({draftTotal > daysLeft ? `+${draftTotal - daysLeft} over` : `${daysLeft - draftTotal} short`})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Allocated Days</TableHead>
                      <TableHead>Completion %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectStats.map(({ sub, allocatedDays, defaultDays, practice, expertise, classesDone, rev1Done, rev2Done }) => {
                      const completionPct = practice.pct;
                      const st = status(completionPct);
                      const phaseSummary = [classesDone && "Classes", rev1Done && "Rev 1", rev2Done && "Rev 2"].filter(Boolean).join(" • ") || "Not started";
                      const value = draft[sub.slug] ?? allocatedDays;
                      const changed = value !== allocatedDays;

                      return (
                        <TableRow key={sub.slug} className="group hover:bg-muted/5 transition-colors">
                          <TableCell className="font-semibold text-foreground py-4">
                            <div>{sub.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                              {phaseSummary}{expertise ? ` · ${expertise}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                type="button"
                                variant="outline"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => adjust(sub.slug, -1)}
                                disabled={value <= 1}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className={`min-w-[3rem] text-center text-sm font-semibold ${changed ? "text-accent font-bold" : ""}`}>
                                {value} <span className="text-xs font-normal text-muted-foreground">d</span>
                              </span>
                              <Button
                                size="icon"
                                type="button"
                                variant="outline"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => adjust(sub.slug, 1)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              {value !== defaultDays && (
                                <button
                                  type="button"
                                  onClick={() => setDraft((d) => ({ ...d, [sub.slug]: defaultDays }))}
                                  className="text-xs text-muted-foreground hover:text-accent ml-1.5 transition-colors"
                                  title={`Reset to suggested ${defaultDays} days`}
                                >
                                  ({defaultDays})
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <Progress value={completionPct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-10 text-right">{completionPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>
                              {st.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/study/study-planning/${sub.slug}`)}
                              className="group-hover:border-accent/40  font-semibold transition-all"
                            >
                              Track Subject <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-border/60">
                {subjectStats.map(({ sub, allocatedDays, defaultDays, practice, expertise, classesDone, rev1Done, rev2Done }) => {
                  const completionPct = practice.pct;
                  const st = status(completionPct);
                  const phaseSummary = [classesDone && "Classes", rev1Done && "Rev 1", rev2Done && "Rev 2"].filter(Boolean).join(" • ") || "Not started";
                  const value = draft[sub.slug] ?? allocatedDays;
                  const changed = value !== allocatedDays;

                  return (
                    <div key={sub.slug} className="p-5 space-y-4 hover:bg-muted/5 transition-colors">
                      {/* Top Row: Name and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-foreground text-sm tracking-tight">{sub.name}</h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            {phaseSummary}{expertise ? ` · ${expertise}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* Middle Section: Progress & Allocated Days */}
                      <div className="grid grid-cols-1 gap-3.5 pt-1">
                        {/* Completion Pct */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Completion</span>
                          <div className="flex items-center gap-3">
                            <Progress value={completionPct} className="h-2 flex-1" />
                            <span className="text-xs font-bold text-foreground w-8 text-right">{completionPct}%</span>
                          </div>
                        </div>

                        {/* Allocated Days Adjustment */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Allocated Days</span>
                          <div className="flex items-center gap-2.5">
                            <Button
                              size="icon"
                              type="button"
                              variant="outline"
                              className="h-8 w-8 rounded-lg shrink-0"
                              onClick={() => adjust(sub.slug, -1)}
                              disabled={value <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className={`min-w-[2.5rem] text-center text-sm font-bold ${changed ? "text-accent" : "text-foreground"}`}>
                              {value}<span className="text-xs font-normal text-muted-foreground ml-0.5">d</span>
                            </span>
                            <Button
                              size="icon"
                              type="button"
                              variant="outline"
                              className="h-8 w-8 rounded-lg shrink-0"
                              onClick={() => adjust(sub.slug, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {value !== defaultDays && (
                              <button
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, [sub.slug]: defaultDays }))}
                                className="text-xs text-accent hover:underline font-semibold ml-1.5 transition-colors"
                                title={`Reset to suggested ${defaultDays} days`}
                              >
                                Reset ({defaultDays})
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Track Subject Action */}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/study/study-planning/${sub.slug}`)}
                          className="w-full justify-between font-semibold border-accent/20 hover:border-accent/60 text-foreground transition-all group"
                        >
                          <span>Track Subject Details</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Floating Save Changes Banner */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-auto max-w-lg bg-card/95 backdrop-blur border border-border rounded-2xl sm:rounded-full shadow-2xl px-4 py-3 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <span className="text-xs font-semibold text-foreground text-center sm:text-left">
            You have unsaved day adjustments.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDraft({})}
              className="text-xs rounded-full h-8 flex-1 sm:flex-initial"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSaveManualDays}
              disabled={savingDays}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-full h-8 px-4 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              {savingDays ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanningPage;

// Helper components loader
import { Loader2 } from "lucide-react";
