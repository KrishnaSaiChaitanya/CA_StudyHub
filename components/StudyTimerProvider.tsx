"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SubjectCategory } from "@/utils/supabase/types";
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

  // New helper states for inactive tracking and persistence
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [accumulatedRemaining, setAccumulatedRemaining] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
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
    const savedStartTime = localStorage.getItem("studyTimer_startTime");
    const savedAccumulatedSeconds = localStorage.getItem("studyTimer_accumulatedSeconds");
    const savedAccumulatedRemaining = localStorage.getItem("studyTimer_accumulatedRemaining");

    let mode: 'stopwatch' | 'timer' = 'stopwatch';
    if (savedMode === 'stopwatch' || savedMode === 'timer') {
      mode = savedMode;
      setTimerModeState(mode);
    }

    let duration = 0;
    if (savedDuration) {
      duration = parseInt(savedDuration, 10);
      setTimerDurationState(duration);
    }

    if (savedSubject) setActiveSubjectState(savedSubject as SubjectCategory);

    let run = savedRunning === "true";
    let st = savedStartTime ? parseInt(savedStartTime, 10) : 0;
    let accSec = savedAccumulatedSeconds ? parseInt(savedAccumulatedSeconds, 10) : 0;
    let accRem = savedAccumulatedRemaining ? parseInt(savedAccumulatedRemaining, 10) : 0;

    // Check 24 hour scrap condition
    if (run && st > 0) {
      const elapsedMs = Date.now() - st;
      if (elapsedMs > 24 * 60 * 60 * 1000) {
        // Scrap session since it was active for > 24 hours
        run = false;
        st = 0;
        accSec = 0;
        accRem = 0;
        
        // Use timeout to ensure toaster/DOM is ready
        setTimeout(() => {
          toast({
            title: "Study Session Scrapped",
            description: "Your previous study session was discarded because it ran for more than 24 hours.",
            variant: "destructive"
          });
        }, 100);
      } else {
        // Active and < 24 hours. Calculate progress.
        const elapsedSec = Math.floor(elapsedMs / 1000);
        if (mode === 'stopwatch') {
          setSeconds(accSec + elapsedSec);
          setAccumulatedSeconds(accSec);
        } else {
          const rem = Math.max(0, accRem - elapsedSec);
          setRemaining(rem);
          setAccumulatedRemaining(accRem);
          if (rem === 0) {
            run = false;
            st = 0;
            setAccumulatedRemaining(0);
            setTimeout(() => {
              toast({
                title: "Timer Completed",
                description: "Your study timer completed while you were away!"
              });
            }, 100);
          }
        }
      }
    } else {
      // Not running, restore paused stats
      setSeconds(accSec);
      setRemaining(accRem);
      setAccumulatedSeconds(accSec);
      setAccumulatedRemaining(accRem);
    }

    setStartTime(st);
    setRunning(run);
    setIsLoaded(true);
  }, [toast]);

  // Save to localStorage whenever state changes after isLoaded is true
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("studyTimer_seconds", seconds.toString());
    localStorage.setItem("studyTimer_remaining", remaining.toString());
    localStorage.setItem("studyTimer_duration", timerDuration.toString());
    localStorage.setItem("studyTimer_mode", timerMode);
    localStorage.setItem("studyTimer_running", running.toString());
    if (activeSubject) {
      localStorage.setItem("studyTimer_activeSubject", activeSubject);
    } else {
      localStorage.removeItem("studyTimer_activeSubject");
    }
    localStorage.setItem("studyTimer_startTime", startTime.toString());
    localStorage.setItem("studyTimer_accumulatedSeconds", accumulatedSeconds.toString());
    localStorage.setItem("studyTimer_accumulatedRemaining", accumulatedRemaining.toString());
  }, [seconds, remaining, timerDuration, timerMode, running, activeSubject, startTime, accumulatedSeconds, accumulatedRemaining, isLoaded]);

  // Set default subject if none selected
  useEffect(() => {
    if (subjects.length > 0 && !activeSubject) {
      setActiveSubjectState(subjects[0]);
    } else if (subjects.length > 0 && activeSubject && !subjects.includes(activeSubject)) {
      setActiveSubjectState(subjects[0]);
    }
  }, [subjects, activeSubject]);

  // Smoother 500ms tick interval for inactive / throttled tab adjustments
  useEffect(() => {
    if (!running || !isLoaded || startTime === 0) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;

      // 24 hour scrap check
      if (elapsedMs >= 24 * 60 * 60 * 1000) {
        setRunning(false);
        setSeconds(0);
        setRemaining(0);
        setStartTime(0);
        setAccumulatedSeconds(0);
        setAccumulatedRemaining(0);
        toast({
          title: "Study Session Scrapped",
          description: "Your session was scrapped because it ran for more than 24 hours.",
          variant: "destructive"
        });
        return;
      }

      const elapsedSec = Math.floor(elapsedMs / 1000);

      if (timerMode === 'stopwatch') {
        setSeconds(accumulatedSeconds + elapsedSec);
      } else {
        const rem = Math.max(0, accumulatedRemaining - elapsedSec);
        setRemaining(rem);
        if (rem === 0) {
          setRunning(false);
          setStartTime(0);
          setAccumulatedRemaining(0);
          toast({
            title: "Timer Completed",
            description: "Your study timer has completed!",
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [running, isLoaded, startTime, timerMode, accumulatedSeconds, accumulatedRemaining, toast]);

  const startTimer = useCallback(() => {
    if (timerMode === 'timer' && remaining === 0) return;
    
    const now = Date.now();
    setStartTime(now);
    setAccumulatedSeconds(seconds);
    setAccumulatedRemaining(remaining);
    setRunning(true);
  }, [timerMode, remaining, seconds]);

  const pauseTimer = useCallback(() => {
    setRunning(false);

    if (startTime > 0) {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      if (timerMode === 'stopwatch') {
        const newAcc = accumulatedSeconds + elapsedSec;
        setAccumulatedSeconds(newAcc);
        setSeconds(newAcc);
      } else {
        const newAcc = Math.max(0, accumulatedRemaining - elapsedSec);
        setAccumulatedRemaining(newAcc);
        setRemaining(newAcc);
      }
    }
    setStartTime(0);
  }, [startTime, timerMode, accumulatedSeconds, accumulatedRemaining]);
  
  const resetTimer = useCallback(() => {
    setRunning(false);
    setStartTime(0);
    setAccumulatedSeconds(0);
    setAccumulatedRemaining(0);
    if (timerMode === 'stopwatch') {
      setSeconds(0);
    } else {
      setRemaining(timerDuration);
      setAccumulatedRemaining(timerDuration);
    }
  }, [timerMode, timerDuration]);

  const setActiveSubject = useCallback((subject: SubjectCategory) => {
    if (!running) {
      if (timerMode === 'stopwatch') {
        setSeconds(0);
        setAccumulatedSeconds(0);
      }
    }
    setActiveSubjectState(subject);
  }, [running, timerMode]);

  const setTimerMode = useCallback((mode: 'stopwatch' | 'timer') => {
    setRunning(false);
    setStartTime(0);
    setAccumulatedSeconds(0);
    setAccumulatedRemaining(0);
    setTimerModeState(mode);
    if (mode === 'stopwatch') {
      setSeconds(0);
    } else {
      setRemaining(timerDuration);
    }
  }, [timerDuration]);

  const setTimerDuration = useCallback((secs: number) => {
    setTimerDurationState(secs);
    setRemaining(secs);
    setAccumulatedRemaining(secs);
  }, []);

  const saveSession = useCallback(async (tag?: string) => {
    let sessionSeconds = 0;
    
    if (running && startTime > 0) {
      // Calculate current live duration if saving while running
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      if (timerMode === 'stopwatch') {
        sessionSeconds = accumulatedSeconds + elapsedSec;
      } else {
        sessionSeconds = timerDuration - Math.max(0, accumulatedRemaining - elapsedSec);
      }
    } else {
      if (timerMode === 'stopwatch') {
        sessionSeconds = seconds;
      } else {
        sessionSeconds = timerDuration - remaining;
      }
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
    
    // Completely reset state upon save
    setRunning(false);
    setStartTime(0);
    setAccumulatedSeconds(0);
    setAccumulatedRemaining(0);
    setSeconds(0);
    setRemaining(0);
    setTimerDuration(0);

    setIsSaving(false);
    return true;
  }, [seconds, remaining, timerDuration, timerMode, activeSubject, supabase, toast, running, startTime, accumulatedSeconds, accumulatedRemaining]);

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
