"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Clock, Timer, Tag, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ProFeatureLock } from "@/components/shared/ProFeatureLock";
import { useStudyTimer } from "@/components/providers/StudyTimerProvider";
import { SubjectCategory } from "@/utils/supabase/types";
import { SUBJECT_ABBREVIATIONS, getSubjectAbbreviation } from "@/utils/subjects";

interface StudySessionType {
  id: string;
  category: SubjectCategory;
  duration_seconds: number;
  created_at: string;
  tag?: string;
}

interface StudyTimerCardProps {
  userId: string | null;
  isSubscribed: boolean;
  subjects: SubjectCategory[];
  dynamicSubjects: { label: string; value: string; color: string }[];
  getSubjectColor: (val: string) => string;
  sessions: StudySessionType[];
  onSessionSaved: () => void;
}

export const StudyTimerCard = ({
  userId,
  isSubscribed,
  subjects,
  dynamicSubjects,
  getSubjectColor,
  sessions,
  onSessionSaved,
}: StudyTimerCardProps) => {
  const {
    seconds,
    remaining,
    running,
    activeSubject,
    timerMode,
    timerDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    setActiveSubject,
    setTimerMode,
    setTimerDuration,
    saveSession,
    isSaving: isSavingSession
  } = useStudyTimer();

  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [sessionTag, setSessionTag] = useState("");

  const applyCustomDuration = () => {
    const totalSeconds = (inputHours * 3600) + (inputMinutes * 60);
    if (totalSeconds > 0) {
      setTimerDuration(totalSeconds);
    }
  };

  useEffect(() => {
    if (subjects.length > 0 && !activeSubject) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject, setActiveSubject]);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const handleSaveSession = async () => {
    setIsTagModalOpen(true);
  };

  const confirmSaveSession = async () => {
    const success = await saveSession(sessionTag);
    if (success) {
      onSessionSaved();
      setIsTagModalOpen(false);
      setSessionTag("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 pb-0">
        <h2 className="text-sm font-semibold">Study Timer</h2>
      </div>
      <ProFeatureLock label="Unlock Study timer with Pro Subscription">
        <div className="p-6 flex flex-col items-center">
          <div className="flex justify-center mb-5">
            <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
              <button
                onClick={() => setTimerMode("stopwatch")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${timerMode === "stopwatch"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                disabled={running}
              >
                <Clock className="h-3.5 w-3.5" /> Stopwatch
              </button>
              <button
                onClick={() => setTimerMode("timer")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${timerMode === "timer"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                disabled={running}
              >
                <Timer className="h-3.5 w-3.5" /> Timer
              </button>
            </div>
          </div>

          {timerMode === "timer" && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
                  disabled={running}
                  className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">hr</span>
              </div>
              <span className="text-muted-foreground font-bold">:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                  disabled={running}
                  className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={applyCustomDuration}
                disabled={running || (inputHours === 0 && inputMinutes === 0)}
                className="ml-1 text-xs h-8"
              >
                Set
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {dynamicSubjects.map((s) => (
              <button
                key={s.value}
                onClick={() => { setActiveSubject(s.value as SubjectCategory); }}
                disabled={running}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeSubject === s.value ? "text-white shadow-sm" : "bg-secondary text-muted-foreground"
                  } ${running ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                style={activeSubject === s.value ? { backgroundColor: running ? "#94a3b8" : s.color } : {}}
              >
                {SUBJECT_ABBREVIATIONS[s.value as SubjectCategory]}
              </button>
            ))}
          </div>

          <div className="relative mb-8">
            <svg width="200" height="200" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="95" fill="none" className="stroke-secondary" strokeWidth="6" />
              <motion.circle
                cx="110" cy="110" r="95" fill="none" stroke={getSubjectColor(activeSubject || subjects[0])}
                strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 95}
                strokeDashoffset={
                  timerMode === 'stopwatch'
                    ? -(2 * Math.PI * 95 * ((Math.min(seconds, 3600) / 3600)))
                    : -(2 * Math.PI * 95 * (1 - (timerDuration > 0 ? remaining / timerDuration : 0)))
                }
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                animate={{
                  strokeDashoffset: timerMode === 'stopwatch'
                    ? -(2 * Math.PI * 95 * ((Math.min(seconds, 3600) / 3600)))
                    : -(2 * Math.PI * 95 * (1 - (timerDuration > 0 ? remaining / timerDuration : 0)))
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-mono font-bold">
                {formatTime(timerMode === 'stopwatch' ? seconds : remaining)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">{activeSubject ? getSubjectAbbreviation(activeSubject) : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-border"
              title="Reset Counter"
              onClick={resetTimer}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              className="h-14 w-14 rounded-full shadow-md"
              style={{ backgroundColor: getSubjectColor(activeSubject || subjects[0]) }}
              onClick={() => running ? pauseTimer() : startTimer()}
              disabled={timerMode === "timer" && remaining === 0}
            >
              {running ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-border bg-accent/10 hover:bg-accent/20 text-accent"
              title="Save Session"
              onClick={handleSaveSession}
              disabled={(timerMode === 'stopwatch' ? seconds === 0 : (timerDuration - remaining) === 0) || isSavingSession}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 w-full text-left">
            <h3 className="text-xs font-semibold mb-3">Today's Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col rounded-lg bg-secondary px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: getSubjectColor(session.category) }}
                      />
                      <span className="text-xs font-medium shrink-0">{getSubjectAbbreviation(session.category)}</span>
                      {session.tag && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-tight truncate">
                          <Tag className="h-2 w-2" />
                          <span className="truncate max-w-[100px]">{session.tag}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-semibold">
                        {formatTime(session.duration_seconds)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No sessions yet.</p>
              )}
            </div>
          </div>
        </div>
      </ProFeatureLock>

      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Tag className="h-5 w-5 text-accent" />
                </div>
                Name your Session
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Adding a tag helps you track specific topics or activities (e.g., "Mock Test", "Chapter 1 Revision").
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Session Tag (Optional)
              </Label>
              <Input
                placeholder="e.g. Revision, Practice Test..."
                value={sessionTag}
                onChange={(e) => setSessionTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmSaveSession()}
                className="h-12 border-border focus:ring-accent/20 bg-muted/20"
                autoFocus
              />
            </div>
            <DialogFooter className="flex sm:justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsTagModalOpen(false);
                  setSessionTag("");
                }}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSaveSession}
                disabled={isSavingSession}
                className="flex-1 h-12 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
              >
                {isSavingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Session"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
