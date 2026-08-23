"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  ArrowRight,
  Loader2,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Layers,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { LogoElement } from "@/assets/logo";

interface StudyRoom {
  id: string;
  title: string;
  subject: string | null;
  meet_link: string | null;
  description: string | null;
  is_creator_room: boolean;
  session_status: "idle" | "live" | "ended";
  created_at: string;
}

export default function RoomRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [redirectTriggered, setRedirectTriggered] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // User not logged in, redirect to login page with redirect_to param
        router.replace(`/sign-in?redirect_to=/rooms/${id}`);
        return;
      }

      // Fetch custom study room details
      const { data, error } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setRoom(data as StudyRoom);
      }
      setLoading(false);
    };

    init();
  }, [id, router]);

  // Countdown and redirection logic
  useEffect(() => {
    if (loading || !room || !room.meet_link || room.session_status === "ended") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!redirectTriggered) {
      setRedirectTriggered(true);
      window.open(room.meet_link, "_blank", "noopener,noreferrer");
    }
  }, [countdown, loading, room, redirectTriggered]);

  const handleManualJoin = () => {
    if (room?.meet_link) {
      window.open(room.meet_link, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white selection:bg-accent/30 overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-accent/15 blur-[120px]"
          />
          <motion.div
            animate={{
              x: [0, -30, 40, 0],
              y: [0, 20, -35, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-600/15 blur-[120px]"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-2xl"
          >
            <LogoElement width={60} height={60} />
          </motion.div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium tracking-wide">Preparing your study lobby...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.1),rgba(255,255,255,0))]" />
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Room Not Found</h1>
          <p className="mt-3 text-slate-400">
            The study room you are trying to join might have been deleted, closed, or the link is incorrect.
          </p>
          <Button
            onClick={() => router.push("/community/rooms")}
            className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Go back to Study Rooms
          </Button>
        </div>
      </div>
    );
  }

  // Handle inactive creator sessions
  if (room.is_creator_room && room.session_status !== "live") {
    const isEnded = room.session_status === "ended";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(197,100,50,0.1),rgba(255,255,255,0))]" />
        <div className="relative z-10 max-w-md w-full text-center bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent"
          >
            <Video className="h-8 w-8" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">{room.title}</h1>
          <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-semibold">
            {room.subject || "CA Study Session"}
          </p>
          <div className="mt-6 border-t border-white/5 pt-6">
            <p className="text-sm text-slate-300">
              {isEnded
                ? "This session has already ended. Please wait for the creator to restart it."
                : "The creator hasn't started the session yet. Stay tuned, you will be able to join as soon as it goes live!"}
            </p>
          </div>
          <Button
            onClick={() => router.push("/community/rooms")}
            className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 w-full rounded-2xl py-6 animate-pulse"
          >
            Return to Study Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white selection:bg-accent/30 overflow-hidden relative">
      {/* Background Decorative Dynamic Gradients */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[130px] opacity-70"
        />
        <motion.div
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 20, -35, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px] opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Logo Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-2xl"
          >
            <LogoElement width={45} height={45} />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {!redirectTriggered ? (
            /* Countdown Phase */
            <motion.div
              key="countdown-phase"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl text-center max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />

              <p className="text-xs font-semibold tracking-widest text-accent uppercase flex items-center justify-center gap-1.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Connecting to Google Meet
              </p>

              <h1 className="text-xl font-extrabold text-white line-clamp-2 leading-snug">
                {room.title}
              </h1>

              {room.description && (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                  {room.description}
                </p>
              )}

              {/* Circular Countdown Progress */}
              <div className="my-8 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-24 w-24 flex items-center justify-center"
                >
                  <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="42" className="stroke-white/5 fill-none" strokeWidth="5" />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="42"
                      className="stroke-accent fill-none"
                      strokeWidth="5"
                      strokeDasharray="264"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: (3 - countdown) * (264 / 3) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 1.6, opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.3 }}
                      className="text-3xl font-black text-white select-none"
                    >
                      {countdown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleManualJoin}
                  className="w-full bg-accent hover:bg-accent/90 text-white rounded-2xl py-6 font-bold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(197,100,50,0.25)] hover:shadow-[0_8px_30px_rgba(197,100,50,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Join Google Meet Now
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <p className="text-[10px] text-slate-400">
                  Google Meet will open in a new tab automatically. If it gets blocked, please click the button.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Post-Redirect Explorer Dashboard */
            <motion.div
              key="explorer-phase"
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-lg shadow-2xl w-full text-center relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-violet-500 to-transparent" />

              <h1 className="text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                Google Meet Opened!
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
                Your study session has launched in a new tab. While you study, discover tools that make CA preparation easier.
              </p>

              {/* Bento Grid layout for app features */}
              <div className="grid gap-6 md:grid-cols-2 mt-8 text-left">
                {/* Progress Tracking Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/5 hover:border-accent/40 rounded-2xl p-5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                      Progress Tracking Dashboard
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Track your syllabus coverage chapter-by-chapter, monitor revision phases, and log study duration metrics automatically.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    variant="ghost"
                    className="mt-4 p-0 h-auto self-start text-xs text-accent hover:text-accent/80 hover:bg-transparent font-semibold gap-1"
                  >
                    Open Tracker <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>

                {/* Study Planner Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/5 hover:border-accent/40 rounded-2xl p-5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                      Personalized Study Planners
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Stay on track with trackers, customizable schedules, and study planners created by top faculties for your CA Inter and Final groups.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/study")}
                    variant="ghost"
                    className="mt-4 p-0 h-auto self-start text-xs text-accent hover:text-accent/80 hover:bg-transparent font-semibold gap-1"
                  >
                    View Planners <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>

                {/* Active Recall Flashcards */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/5 hover:border-accent/40 rounded-2xl p-5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                      Active Recall Flashcards
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Memorize Accounting Standards, Tax sections, and corporate law clauses using interactive student-created and admin-approved flashcards.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/study/flash-cards")}
                    variant="ghost"
                    className="mt-4 p-0 h-auto self-start text-xs text-accent hover:text-accent/80 hover:bg-transparent font-semibold gap-1"
                  >
                    Study Flashcards <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>

                {/* Practice Engine Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/5 hover:border-accent/40 rounded-2xl p-5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-4 border border-violet-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                      Mock Exams & Practice Papers
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Practice under real exam conditions using online proctored MCQ tests, RTPs, MTPs, and previous year question papers.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/practice")}
                    variant="ghost"
                    className="mt-4 p-0 h-auto self-start text-xs text-accent hover:text-accent/80 hover:bg-transparent font-semibold gap-1"
                  >
                    Start Practice <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>
              </div>

              {/* CTAs Bar */}
              <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs text-slate-400">
                    Did Google Meet fail to open?
                  </p>
                  <button
                    onClick={handleManualJoin}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 mt-1"
                  >
                    Click here to open Google Meet manually
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="bg-accent hover:bg-accent/90 text-white rounded-xl px-6 py-5 font-bold shadow-md"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
