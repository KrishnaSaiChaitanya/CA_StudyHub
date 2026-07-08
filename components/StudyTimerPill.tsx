"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Pause } from "lucide-react";
import { useStudyTimer } from "./StudyTimerProvider";
import { getSubjectColor } from "@/utils/subjects";

export const StudyTimerPill = () => {
  const { seconds, remaining, timerMode, running, activeSubject } = useStudyTimer();
  const router = useRouter();
  const pathname = usePathname();

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const displayTime = timerMode === 'stopwatch' ? seconds : remaining;
  const subjectColor = activeSubject ? getSubjectColor(activeSubject) : "hsl(var(--accent))";

  if (displayTime === 0 && !running && timerMode === 'stopwatch') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: 20 }}
        className="flex items-center gap-2 fixed bottom-6 left-4 z-100"
      >
        <button
          onClick={() => router.push("/study/progress")}
          className="group relative flex items-center gap-2.5 rounded-full border border-white/10 px-3.5 py-2 backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ 
            backgroundColor: subjectColor,
            boxShadow: `0 4px 14px 0 ${subjectColor}40`
          }}
          title="Go to Study Progress"
        >
          <div 
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
          >
            {running ? (
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="flex items-center justify-center"
               >
                 <Clock className="h-3 w-3 text-white" />
               </motion.div>
            ) : (
              <Pause className="h-3 w-3 text-white" />
            )}
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-tight">
            {formatTime(displayTime)}
          </span>
          {activeSubject && (
            <div className="h-3 w-[1px] bg-white/30 mx-0.5" />
          )}
          {activeSubject && (
            <span 
              className="text-[10px] font-bold text-white/90 uppercase tracking-tighter"
            >
              {activeSubject.split('_').map(w => w[0]).join('').slice(0, 3)}
            </span>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
