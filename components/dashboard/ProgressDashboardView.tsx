"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { SubjectCategory } from "@/utils/supabase/types";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { formatSubjectName, getSubjectColor as getGlobalSubjectColor } from "@/utils/subjects";

// Import refactored components
import { DailySummaryCard } from "./DailySummaryCard";
import { StatisticsCard } from "./StatisticsCard";
import { StudyTimerCard } from "./StudyTimerCard";
import { TodoListCard } from "./TodoListCard";
import { StatisticsHistory } from "./StatisticsHistory";
import PageHeader from "@/components/shared/PageHeader";

interface StudySessionType {
  id: string;
  category: SubjectCategory;
  duration_seconds: number;
  created_at: string;
  tag?: string;
}

interface Props {
  onBack: () => void;
}

const ProgressDashboardView = ({ onBack }: Props) => {
  const supabase = createClient();
  const { subjects, loading: studentLoading } = useStudent();
  const { isSubscribed } = useSubscription();

  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StudySessionType[]>([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const dynamicSubjects = useMemo(() => {
    return subjects.map((subj) => ({
      label: formatSubjectName(subj),
      value: subj,
      color: getGlobalSubjectColor(subj)
    }));
  }, [subjects]);

  const getSubjectLabel = useCallback((val: string) => {
    return dynamicSubjects.find(s => s.value === val)?.label || formatSubjectName(val as SubjectCategory);
  }, [dynamicSubjects]);

  const getSubjectColor = useCallback((val: string) => {
    return dynamicSubjects.find(s => s.value === val)?.color || getGlobalSubjectColor(val as SubjectCategory);
  }, [dynamicSubjects]);

  const fetchSessions = async (uid: string) => {
    const today = new Date().toDateString();
    let sessionsQuery = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (subjects.length > 0) {
      sessionsQuery = sessionsQuery.in('category', subjects);
    }

    const { data: todaySessions } = await sessionsQuery;
    if (todaySessions) {
      setSessions(todaySessions.filter((session) => new Date(session.created_at).toDateString() === today));
    }

    let countQuery = supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid);
    if (subjects.length > 0) {
      countQuery = countQuery.in('category', subjects);
    }
    const { count } = await countQuery;
    if (count !== null) {
      setTotalSessionsCount(count);
    }
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('current_streak').eq('id', uid).single();
    if (data) {
      setStreak(data.current_streak || 0);
    }
  };

  useEffect(() => {
    if (studentLoading) return;

    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchSessions(user.id);
        fetchProfile(user.id);
      }
    };
    initData();
  }, [supabase.auth, subjects, studentLoading]);

  const handleSessionSaved = () => {
    if (userId) {
      fetchSessions(userId);
    }
  };

  const dailyDataMap = useMemo(() => {
    return sessions.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = 0;
      acc[curr.category] += curr.duration_seconds;
      return acc;
    }, {} as Record<string, number>);
  }, [sessions]);

  const dailyData = useMemo(() => {
    return Object.entries(dailyDataMap)
      .map(([category, duration_seconds]) => ({
        category,
        hours: duration_seconds / 3600
      }))
      .filter(x => x.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [dailyDataMap]);

  const totalHours = useMemo(() => {
    return sessions.reduce((s, d) => s + d.duration_seconds, 0) / 3600;
  }, [sessions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background text-foreground">
      <PageHeader title="Progress" gradientTitle="Dashboard" description="Track focus, manage tasks, and analyze performance in one dashboard" onBack={onBack} />

      <div className="container py-6">
        <div className="grid gap-5 lg:grid-cols-[280px_1fr_300px]">
          {/* Left column (Summary & Statistics) */}
          <div className="space-y-5">
            <DailySummaryCard
              isSubscribed={isSubscribed}
              dailyData={dailyData}
              totalHours={totalHours}
              getSubjectColor={getSubjectColor}
              getSubjectLabel={getSubjectLabel}
            />

            <StatisticsCard
              isSubscribed={isSubscribed}
              streak={streak}
              totalSessionsCount={totalSessionsCount}
              totalHours={totalHours}
              onOpenHistory={() => setHistoryOpen(true)}
            />
          </div>

          {/* Center column (Study Timer) */}
          <StudyTimerCard
            userId={userId}
            isSubscribed={isSubscribed}
            subjects={subjects}
            dynamicSubjects={dynamicSubjects}
            getSubjectColor={getSubjectColor}
            sessions={sessions}
            onSessionSaved={handleSessionSaved}
          />

          {/* Right column (To-Do List) */}
          <TodoListCard
            userId={userId}
            subjects={subjects}
            dynamicSubjects={dynamicSubjects}
            getSubjectColor={getSubjectColor}
          />
        </div>
      </div>

      {/* Statistics History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-accent" /> Statistics History
            </DialogTitle>
          </DialogHeader>
          {userId && <StatisticsHistory userId={userId} />}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProgressDashboardView;
