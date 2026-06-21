"use client"
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import NotificationsBell from "@/components/notifications/Notification";
import {
  BarChart3,
  Users,
  Clock,
  Flame,
  CheckCircle2,
  CalendarDays,
  FileText,
  Library,
  Loader2,
  ClipboardCheck,
  GraduationCap,
  Timer,
  Target,
  MessageCircle,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useStudent } from "@/components/StudentTypeProvider";
import { format } from "date-fns";

type DbPaper = {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: string;
  created_at: string;
  pdf_url: string;
};

type DbEvent = {
  id: string;
  title: string;
  subject: string;
  level?: string;
  type?: string;
  created_at?: string;
  event_month: number;
  event_year: number;
  event_date: number;
  event_time: string;
};

type QuickAccessOption = {
  icon: typeof FileText;
  title: string;
  path: string;
};

const defaultQuickLinks: QuickAccessOption[] = [
  { icon: BarChart3, title: "Progress Dashboard", path: "/study/progress" },
  { icon: FileText, title: "Mock Exams", path: "/practice/mock-exams" },
  { icon: Library, title: "Community Library", path: "/study/planner" },
  { icon: Users, title: "Group Study Rooms", path: "/community/rooms" },
];

const quickAccessOptions: QuickAccessOption[] = [
  { icon: FileText, title: "MTP", path: "/practice/mtp" },
  { icon: ClipboardCheck, title: "Mock Exams", path: "/practice/mock-exams" },
  { icon: GraduationCap, title: "Faculty Database", path: "/faculty" },
  { icon: Users, title: "Group Study", path: "/community/rooms" },
  { icon: Timer, title: "RTP", path: "/practice/rtp" },
  { icon: Target, title: "PYQ", path: "/practice/pyq" },
  { icon: BarChart3, title: "Progress Tracking", path: "/study/progress" },
  { icon: CalendarDays, title: "Calendar", path: "/study/events" },
  { icon: MessageCircle, title: "Community Library", path: "/community/upload" },
  { icon: BookOpen, title: "Study Resources", path: "/study/planner" },
  { icon: Lightbulb, title: "Notes & Bookmarks", path: "/study/bookmarks" },
];

const normalizeQuickAccessPreference = (preference: unknown): string[] => {
  if (Array.isArray(preference)) {
    return preference.filter((item): item is string => typeof item === "string");
  }

  if (typeof preference === "string" && preference.length) {
    return [preference];
  }

  return [];
};

// Utility: Format Enum to Title Case
const formatSubjectName = (subject: string | null) => {
  if (!subject) return "General";
  return subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// Utility: Time Ago format
const timeAgo = (dateString: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Remove static calculation

const Home = () => {
  const supabase = createClient();
  const { studentLevel, subjects, loading: studentLoading } = useStudent();
  const queryClient = useQueryClient();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [selectedQuickAccess, setSelectedQuickAccess] = useState<string[]>([]);

  const quickAccessMutation = useMutation({
    mutationFn: async (paths: string[]) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { error } = await supabase.from('profiles')
        .update({ quick_access_preference: paths, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      return paths;
    },
    onSuccess: (paths) => {
      queryClient.setQueryData(["dashboardData", studentLevel], (oldData: any) => ({
        ...(oldData || {}),
        quickAccessPreference: paths,
      }));
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardData", studentLevel],
    enabled: !studentLoading,
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "Student";
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch Stats, Events, Papers, Exam Dates, Planners, Ticker, and Announcements concurrently
      const [
        profileRes,
        sessionsRes,
        todosRes,
        eventsRes,
        papersRes,
        examDatesRes,
        plannersRes,
        tickerRes,
        announcementsRes
      ] = await Promise.all([
        supabase.from('profiles').select('current_streak, quick_access_preference').eq('id', user.id).single(),
        supabase.from('study_sessions').select('duration_seconds').eq('user_id', user.id).eq('session_date', todayStr),
        supabase.from('todos').select('*').eq('user_id', user.id),
        supabase.from('calendar_events').select('*').in('subject', ['general', ...subjects]),
        supabase.from('practice_papers')
          .select('*')
          .eq('level', studentLevel || 'foundation')
          .in('subject', subjects)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('exam_dates').select('*'),
        supabase.from('study_planners').select('*').in('category', subjects).order('created_at', { ascending: false }).limit(5),
        supabase.from('site_content').select('*').eq('page_id', 'dashboard_ticker').maybeSingle(),
        studentLevel
          ? supabase.from('announcements').select('*').or(`student_level.eq.${studentLevel},student_level.is.null`)
          : supabase.from('announcements').select('*').is("student_level", null)
      ]);

      // Process Stats
      const totalSeconds = sessionsRes.data?.reduce((acc: number, curr: any) => acc + curr.duration_seconds, 0) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const allowedSubjects = ['general', ...subjects];
      const completed = todosRes.data?.filter((t: any) => t.done && allowedSubjects.includes(t.subject)).length || 0;
      const total = todosRes.data?.filter((t: any) => allowedSubjects.includes(t.subject)).length || 0;

      // Process Exam Date
      const userLevel = studentLevel || 'foundation';
      const examDateData = examDatesRes.data?.find((d: any) => d.level === userLevel);
      const targetDate = examDateData ? new Date(examDateData.exam_date) : new Date("2026-05-15");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Process Events
      let upcoming: DbEvent[] = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const combinedEvents: any[] = [];

      // 1. Calendar Events
      if (eventsRes.data) {
        eventsRes.data.forEach((e: any) => {
          combinedEvents.push({
            id: e.id,
            title: e.title,
            subject: e.subject || "general",
            event_year: e.event_year,
            event_month: e.event_month,
            event_date: e.event_date,
            event_time: e.event_time || "",
            fullDate: new Date(e.event_year, e.event_month - 1, e.event_date),
          });
        });
      }

      // 2. Todos
      if (todosRes.data) {
        todosRes.data.forEach((todo: any) => {
          if (todo.todo_date) {
            const dateObj = new Date(todo.todo_date);
            if (!isNaN(dateObj.getTime())) {
              combinedEvents.push({
                id: todo.id,
                title: `To-Do: ${todo.text}`,
                subject: todo.subject || "general",
                event_year: dateObj.getFullYear(),
                event_month: dateObj.getMonth() + 1,
                event_date: dateObj.getDate(),
                event_time: todo.done ? "Completed" : "Pending",
                fullDate: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
              });
            }
          }
        });
      }

      // 3. Announcements
      if (announcementsRes.data) {
        const dateRegex = /^[A-Za-z]{3,9}\s\d{1,2},\s\d{4}$/;
        announcementsRes.data.forEach((ann: any) => {
          if (ann.date && dateRegex.test(ann.date.trim())) {
            const dateObj = new Date(ann.date.trim());
            if (!isNaN(dateObj.getTime())) {
              combinedEvents.push({
                id: ann.id,
                title: `ICAI: ${ann.title}`,
                subject: "general",
                event_year: dateObj.getFullYear(),
                event_month: dateObj.getMonth() + 1,
                event_date: dateObj.getDate(),
                event_time: "All Day",
                fullDate: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
              });
            }
          }
        });
      }

      upcoming = combinedEvents
        .filter((e: any) => e.fullDate >= now)
        .sort((a: any, b: any) => a.fullDate.getTime() - b.fullDate.getTime())
        .slice(0, 3) as DbEvent[];

      let tickerMessages: string[] = [];
      if (tickerRes?.data && tickerRes.data.content && Array.isArray(tickerRes.data.content.messages)) {
        tickerMessages = tickerRes.data.content.messages;
      }

      return {
        userName: name,
        stats: {
          streak: profileRes.data?.current_streak || 0,
          studyTime: `${hours}h ${minutes}m`,
          tasksDone: `${completed} / ${total}`
        },
        events: upcoming,
        recentPapers: [...(papersRes.data || []), ...(plannersRes.data || [])].slice(0, 5) as DbPaper[],
        daysLeft,
        targetDate: format(targetDate, "MMMM dd, yyyy"),
        userLevel: userLevel.charAt(0).toUpperCase() + userLevel.slice(1),
        quickAccessPreference: profileRes.data?.quick_access_preference || null,
        tickerMessages,
      };
    }
  });

  useEffect(() => {
    const preference = normalizeQuickAccessPreference(data?.quickAccessPreference);
    if (preference.length) {
      setSelectedQuickAccess(preference);
    } else if (!selectedQuickAccess.length) {
      setSelectedQuickAccess(defaultQuickLinks.map((link) => link.path));
    }
  }, [data?.quickAccessPreference]);

  const quickLinks = useMemo(() => {
    const preference = normalizeQuickAccessPreference(data?.quickAccessPreference);

    const selectedOptions = preference
      .map((path) => quickAccessOptions.find((option) => option.path === path))
      .filter((option): option is QuickAccessOption => Boolean(option));

    const fallbackOptions = defaultQuickLinks.filter((link) => !preference.includes(link.path));
    return [...selectedOptions, ...fallbackOptions].slice(0, 4);
  }, [data?.quickAccessPreference]);

  const handleToggleQuickAccess = (path: string) => {
    setSelectedQuickAccess((current) => {
      if (current.includes(path)) {
        return current.filter((item) => item !== path);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, path];
    });
  };

  const handleSavePreference = () => {
    if (!selectedQuickAccess.length) return;

    quickAccessMutation.mutate(selectedQuickAccess, {
      onSuccess: () => setIsCustomizeOpen(false),
    });
  };

  // Extract variables with fallbacks to prevent breaking the UI while loading
  const {
    userName = "Student",
    stats = { streak: 0, studyTime: "0h 0m", tasksDone: "0 / 0" },
    events = [],
    recentPapers = [],
    daysLeft = 0,
    targetDate = "...",
    userLevel = "...",
    tickerMessages = []
  } = data || {};


  const announcementsList = tickerMessages;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* <Navbar /> */}


    {announcementsList?.length > 0 && (() => {
        const repeatCount = Math.max(10, Math.ceil(20 / announcementsList.length));
        const singleSet = Array.from({ length: repeatCount }, (_, setIdx) =>
          announcementsList.map((ann: string, idx: number) => (
            <span key={`${setIdx}-${idx}`} className="flex items-center gap-8 shrink-0">
              <span>{ann}</span>
              <span className="text-white/40">•</span>
            </span>
          ))
        ).flat();
        return (
          <div className="overflow-hidden bg-black py-1.5 border-y border-black/10 text-xs font-medium text-white">
            <div
              className="flex items-center gap-8 whitespace-nowrap animate-marquee"
              style={{ animationDuration: `${Math.max(10, repeatCount * announcementsList.length * 1)}s` }}
            >
              {singleSet}
              {singleSet}
            </div>
          </div>
        );
      })()}

      <main className="container max-w-5xl py-10 lg:py-16 flex-1">
        {/* Greeting */}
        <div className="flex items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl capitalize">
              Welcome back, {userName}! 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's your study overview for today.
            </p>
          </motion.div>
          <NotificationsBell />
        </div>

        {/* Exam Countdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="mt-10">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-8 px-6">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Days Left for Exam
              </p>
              {isLoading || studentLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-20 rounded bg-accent/20 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-accent/20 animate-pulse rounded-full" />
                </div>
              ) : (
                <>
                  <p className="text-5xl font-extrabold text-accent">{daysLeft}</p>
                  <p className="text-sm text-muted-foreground">CA {userLevel} — {targetDate}</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Flame, label: "Day Streak", value: `${stats.streak} days` },
            { icon: Clock, label: "Today's Study", value: stats.studyTime },
            { icon: CheckCircle2, label: "Tasks Done", value: stats.tasksDone },
          ].map((stat, i) => (
            <Card key={i} className="border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <stat.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {isLoading ? (
                    <div className="h-6 w-16 mt-1 rounded bg-muted animate-pulse" />
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left Column — Quick Access */}
          <div className="">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-foreground">Quick Access</h2>
                <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Customize</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Customize Quick Access</DialogTitle>
                      <DialogDescription>
                        Choose one quick access shortcut to show first in your dashboard.
                      </DialogDescription>
                    </DialogHeader>

                  <div className="mt-6 space-y-3">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-muted-foreground">Quick Access</p>
    <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">
      {selectedQuickAccess.length}/4 selected
    </span>
  </div>

  {/* 1. Mobile: Single column with horizontal scroll or vertical list 
      2. sm: Grid with 2 columns
      3. Added 'max-h' and custom scrollbar for better mobile containment
  */}
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1 pb-2 scrollbar-thin">
    {quickAccessOptions.map((option) => {
      const isSelected = selectedQuickAccess.includes(option.path);
      const isDisabled = !isSelected && selectedQuickAccess.length >= 4;
      
      return (
        <button
          key={option.path}
          type="button"
          onClick={() => handleToggleQuickAccess(option.path)}
          // 4. Enhanced active state for touch (active:scale-[0.98])
          className={`
            flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all 
            active:scale-[0.98] touch-manipulation
            ${isSelected 
              ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent/30' 
              : 'border-border bg-background'
            } 
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent/50'}
          `}
          disabled={isDisabled}
        >
          {/* 5. Icon Container: Slightly larger on mobile for better visibility */}
          <div className={`
            flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors
            ${isSelected ? 'bg-accent text-white' : 'bg-secondary text-accent'}
          `}>
            <option.icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-accent' : 'text-foreground'}`}>
              {option.title}
            </p>
            <p className="text-[11px] text-muted-foreground truncate opacity-80">
              {option.path}
            </p>
          </div>

          {/* 6. Selection Indicator: Visual feedback is crucial on small screens */}
          <div className={`
            h-5 w-5 rounded-full border flex items-center justify-center transition-all
            ${isSelected ? 'bg-accent border-accent' : 'border-border'}
          `}>
            {isSelected && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      );
    })}
  </div>
</div>

                    <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleSavePreference}
                        disabled={!selectedQuickAccess.length}
                      >
                        Save Preference
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {quickLinks.map((link, i) => (
                  <Link href={link.path} key={i} prefetch={false}>
                    <Card className="group cursor-pointer border-border transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <link.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{link.title}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column — Upcoming Events */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Upcoming Events</h2>
              <Link href="/study/events" className="text-sm font-medium text-accent hover:underline" prefetch={false}>
                Calendar
              </Link>
            </div>
            <Card className="mt-4 border-border">
              <CardContent className="divide-y divide-border p-0 min-h-[220px]">
                {isLoading ? (
                  <div className="flex h-[220px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex h-[220px] flex-col items-center justify-center text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">No upcoming events</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex h-[74px] items-start gap-3 p-4 transition-colors hover:bg-secondary/50">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md border bg-card">
                        <span className="text-[10px] font-bold text-accent leading-none uppercase">
                          {new Date(event.event_year, event.event_month - 1).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-xs font-semibold leading-tight">{event.event_date}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate sm:w-full w-60">
                          {event.event_time} · {formatSubjectName(event.subject)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recently Uploaded — Practice Papers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recently Added Papers</h2>
            {/* <Link href="/practice" className="text-sm font-medium text-accent hover:underline" prefetch={false}>
              View all
            </Link> */}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="flex-shrink-0 w-52 border-border animate-pulse">
                  <CardContent className="p-0">
                    <div className="flex aspect-video w-full items-center justify-center bg-muted rounded-t-lg" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentPapers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent papers available.</p>
            ) : (
              recentPapers.map((paper) => (
                <Link href={paper.pdf_url} prefetch={false} target="_blank">
                <Card key={paper.id} className="group flex-shrink-0 w-52 snap-start cursor-pointer border-border transition-all hover:shadow-md hover:border-accent/30">
                  <CardContent className="p-0">
                    <div className="relative flex aspect-video w-full items-center justify-center bg-secondary rounded-t-lg border-b">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                          <FileText className="h-5 w-5 text-accent" />
                        </div>
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider line-clamp-1">
                          {paper.type ?? "Study Planner"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-2" title={paper.title}>
                        {paper.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 font-medium border-border line-clamp-1">
                          {formatSubjectName(paper.subject)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="capitalize">{paper.level}</span>
                        <span>·</span>
                        <span>{timeAgo(paper.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;