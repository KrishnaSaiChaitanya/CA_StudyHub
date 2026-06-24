"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SubjectCategory } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useStudent } from "./StudentTypeProvider";

interface StudyTimerContextType {
  seconds: number;
  remaining: number;
  running: boolean;
  activeSubject: SubjectCategory | null;
  timerMode: 'stopwatch' | 'timer';
  timerDuration: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setActiveSubject: (subject: SubjectCategory) => void;
  setTimerMode: (mode: 'stopwatch' | 'timer') => void;
  setTimerDuration: (seconds: number) => void;
  saveSession: (tag?: string) => Promise<boolean>;
  isSaving: boolean;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

export const useStudyTimer = () => {
  const context = useContext(StudyTimerContext);
  if (!context) {
    throw new Error("useStudyTimer must be used within a StudyTimerProvider");
  }
  return context;
};

export const StudyTimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [timerDuration, setTimerDurationState] = useState(0);
  const [timerMode, setTimerModeState] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [running, setRunning] = useState(false);
  const [activeSubject, setActiveSubjectState] = useState<SubjectCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { subjects } = useStudent();
  const { toast } = useToast();
  const supabase = createClient();

  // Load from localStorage on mount
  useEffect(() => {
    const savedSeconds = localStorage.getItem("studyTimer_seconds");
    const savedRemaining = localStorage.getItem("studyTimer_remaining");
    const savedDuration = localStorage.getItem("studyTimer_duration");
    const savedMode = localStorage.getItem("studyTimer_mode") as 'stopwatch' | 'timer' | null;
    const savedRunning = localStorage.getItem("studyTimer_running");
    const savedSubject = localStorage.getItem("studyTimer_activeSubject");
    const savedTime = localStorage.getItem("studyTimer_lastSavedTime");

    if (savedMode) setTimerModeState(savedMode);
    if (savedDuration) setTimerDuration(parseInt(savedDuration, 10));

    if (savedSeconds) {
      let secs = parseInt(savedSeconds, 10);
      let rem = savedRemaining ? parseInt(savedRemaining, 10) : 0;
      
      // Calculate elapsed time if it was running before reload for accuracy
      if (savedRunning === "true" && savedTime) {
         const elapsed = Math.floor((Date.now() - parseInt(savedTime, 10)) / 1000);
         if (savedMode === 'stopwatch') {
           secs += elapsed;
         } else {
           rem = Math.max(0, rem - elapsed);
         }
      }
      setSeconds(secs);
      setRemaining(rem);
    }
    
    if (savedSubject) setActiveSubjectState(savedSubject as SubjectCategory);
    setRunning(false);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("studyTimer_seconds", seconds.toString());
    localStorage.setItem("studyTimer_remaining", remaining.toString());
    localStorage.setItem("studyTimer_duration", timerDuration.toString());
    localStorage.setItem("studyTimer_mode", timerMode);
    localStorage.setItem("studyTimer_running", running.toString());
    if (activeSubject) localStorage.setItem("studyTimer_activeSubject", activeSubject);
    localStorage.setItem("studyTimer_lastSavedTime", Date.now().toString());
  }, [seconds, remaining, timerDuration, timerMode, running, activeSubject]);

  // Set default subject if none selected
  useEffect(() => {
    if (subjects.length > 0 && !activeSubject) {
      setActiveSubjectState(subjects[0]);
    } else if (subjects.length > 0 && activeSubject && !subjects.includes(activeSubject)) {
      setActiveSubjectState(subjects[0]);
    }
  }, [subjects, activeSubject]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (running) {
      interval = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setSeconds((s) => s + 1);
        } else {
          setRemaining((r) => {
            if (r <= 1) {
              setRunning(false);
              return 0;
            }
            return r - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, timerMode]);

  const startTimer = useCallback(() => {
    if (timerMode === 'timer' && remaining === 0) return;
    setRunning(true);
  }, [timerMode, remaining]);

  const pauseTimer = useCallback(() => setRunning(false), []);
  
  const resetTimer = useCallback(() => {
    setRunning(false);
    if (timerMode === 'stopwatch') {
      setSeconds(0);
    } else {
      setRemaining(timerDuration);
    }
  }, [timerMode, timerDuration]);

  const setActiveSubject = useCallback((subject: SubjectCategory) => {
    if (!running) {
      if (timerMode === 'stopwatch') setSeconds(0);
    }
    setActiveSubjectState(subject);
  }, [running, timerMode]);

  const setTimerMode = useCallback((mode: 'stopwatch' | 'timer') => {
    setRunning(false);
    setTimerModeState(mode);
  }, []);

  const setTimerDuration = useCallback((secs: number) => {
    setTimerDurationState(secs);
    setRemaining(secs);
  }, []);

  const saveSession = useCallback(async (tag?: string) => {
    let sessionSeconds = 0;
    if (timerMode === 'stopwatch') {
      sessionSeconds = seconds;
    } else {
      sessionSeconds = timerDuration - remaining;
    }

    if (sessionSeconds <= 0 || !activeSubject) return false;
    
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Please sign in to save your progress", variant: "destructive" });
      setIsSaving(false);
      return false;
    }

    const { error } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      category: activeSubject,
      duration_seconds: sessionSeconds,
      tag: tag || null
    });

    if (error) {
      toast({ title: "Failed to save session", variant: "destructive" });
      setIsSaving(false);
      return false;
    }

    toast({ title: "Session saved successfully!" });
    if (timerMode === 'stopwatch') {
      setSeconds(0);
    } else {
      // For timer mode, we might want to reset to original duration or keep as is.
      // Resetting seems cleaner.
      setRemaining(0);
      setTimerDuration(0);
    }
    setRunning(false);
    setIsSaving(false);
    return true;
  }, [seconds, remaining, timerDuration, timerMode, activeSubject, supabase, toast]);

  return (
    <StudyTimerContext.Provider
      value={{
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
        isSaving,
      }}
    >
      {children}
    </StudyTimerContext.Provider>
  );
};
