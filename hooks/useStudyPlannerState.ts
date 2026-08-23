"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { saveUserExamAttempt, saveUserSubjectStates } from "@/app/(main)/study/study-planning/actions";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";

export interface SubjectPracticeStats {
  sub: {
    slug: SubjectCategory;
    name: string;
    shortName: string;
    level: StudentLevel;
    baseWeight: number;
  };
  allocatedDays: number;
  defaultDays: number;
  practice: {
    total: number;
    study1Done: number;
    rev1Done: number;
    rev2Done: number;
    pct: number;
  };
  classesDone: boolean;
  rev1Done: boolean;
  rev2Done: boolean;
  expertise: string;
}

export interface RecentTaskInfo {
  slug: string;
  subjectName: string;
  phaseLabel: string;
  chapterName: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const useStudyPlannerState = () => {
  const { studentLevel, examAttemptMonth, examAttemptYear, refreshProfile } = useStudent();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const [subjectStats, setSubjectStats] = useState<SubjectPracticeStats[]>([]);
  const [overallPct, setOverallPct] = useState(0);
  const [difficulty, setDifficulty] = useState({ label: "Moderate", color: "bg-amber-500" });
  const [recentTask, setRecentTask] = useState<RecentTaskInfo | null>(null);
  const [hasSetupPreps, setHasSetupPreps] = useState(true);

  const examLabel = examAttemptMonth && examAttemptYear
    ? `${MONTH_NAMES[examAttemptMonth - 1]} ${examAttemptYear}`
    : "";

  // 1. Calculate Days Left
  useEffect(() => {
    if (examAttemptMonth && examAttemptYear) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = new Date(examAttemptYear, examAttemptMonth - 1, 1);
      const diffTime = examDate.getTime() - today.getTime();
      const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setDaysLeft(days);
    } else {
      setDaysLeft(0);
    }
  }, [examAttemptMonth, examAttemptYear]);

  const totalAvailableDays = daysLeft > 0 ? daysLeft : 200;

  // 2. Fetch Data and Calculate Allocations
  const fetchPlannerStats = useCallback(async () => {
    if (!studentLevel) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Inline helper to fetch the user's most recent activity sequentially in a separate concurrent thread
      const fetchRecentTask = async (): Promise<RecentTaskInfo | null> => {
        const { data: recentData } = await supabase
          .from("user_chapter_progress")
          .select("chapter_id, phase")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (!recentData || recentData.length === 0) return null;

        const lastProg = recentData[0];
        const { data: chapData } = await supabase
          .from("planner_chapters")
          .select("topic, subject_slug")
          .eq("id", lastProg.chapter_id)
          .single();

        if (!chapData) return null;

        const { data: subData } = await supabase
          .from("planner_subjects")
          .select("name")
          .eq("slug", chapData.subject_slug)
          .single();

        const phaseLabels: Record<string, string> = {
          study1: "Study 1",
          rev1: "Revision 1",
          rev2: "Revision 2",
        };

        return {
          slug: chapData.subject_slug,
          subjectName: subData?.name || "",
          phaseLabel: phaseLabels[lastProg.phase] || lastProg.phase,
          chapterName: chapData.topic,
        };
      };

      // Fetch all primary datasets and recent task details in parallel
      const [
        subjectsRes,
        userStatesRes,
        chaptersRes,
        subtopicsRes,
        progressRes,
        subtopicProgressRes,
        recentTaskInfo
      ] = await Promise.all([
        supabase.from("planner_subjects").select("*").eq("level", studentLevel),
        supabase.from("user_subject_states").select("*").eq("user_id", user.id),
        supabase.from("planner_chapters").select("id, subject_slug"),
        supabase.from("planner_subtopics").select("id, chapter_id"),
        supabase.from("user_chapter_progress").select("chapter_id, phase, status").eq("user_id", user.id).eq("status", "completed"),
        supabase.from("user_subtopic_progress").select("subtopic_id, phase, status").eq("user_id", user.id).eq("status", "completed"),
        fetchRecentTask()
      ]);

      const subjectsData = subjectsRes.data;
      if (!subjectsData || subjectsData.length === 0) {
        setSubjectStats([]);
        setLoading(false);
        return;
      }

      const userStates = userStatesRes.data;
      const statesMap = new Map(userStates?.map((s) => [s.subject_slug, s]) || []);
      const hasSetup = !!(userStates && userStates.length > 0);
      setHasSetupPreps(hasSetup);

      const chaptersData = chaptersRes.data;
      const chaptersBySubject = new Map<string, string[]>();
      chaptersData?.forEach((c) => {
        const list = chaptersBySubject.get(c.subject_slug) || [];
        list.push(c.id);
        chaptersBySubject.set(c.subject_slug, list);
      });

      const subtopicsData = subtopicsRes.data;
      const subtopicsByChapter = new Map<string, string[]>();
      subtopicsData?.forEach((s) => {
        const list = subtopicsByChapter.get(s.chapter_id) || [];
        list.push(s.id);
        subtopicsByChapter.set(s.chapter_id, list);
      });

      const progressData = progressRes.data;
      const progressMap = new Map<string, Set<string>>();
      progressData?.forEach((p) => {
        const set = progressMap.get(p.chapter_id) || new Set<string>();
        set.add(p.phase);
        progressMap.set(p.chapter_id, set);
      });

      const subtopicProgressData = subtopicProgressRes.data;
      const subtopicProgressMap = new Map<string, Set<string>>();
      subtopicProgressData?.forEach((p) => {
        const set = subtopicProgressMap.get(p.subtopic_id) || new Set<string>();
        set.add(p.phase);
        subtopicProgressMap.set(p.subtopic_id, set);
      });

      // Calculate Day Allocations & Subject Stats
      const items = subjectsData.map((sub) => {
        const userState = statesMap.get(sub.slug) || {
          classes_done: false,
          rev1_done: false,
          rev2_done: false,
          expertise: "Moderate",
          allocated_days: 0,
        };

        let prepMultiplier = 1.0;
        if (userState.rev2_done) prepMultiplier = 0.20;
        else if (userState.rev1_done) prepMultiplier = 0.45;
        else if (userState.classes_done) prepMultiplier = 0.75;

        let comfortMultiplier = 1.0;
        if (userState.expertise === "Easy") comfortMultiplier = 0.75;
        else if (userState.expertise === "Tough") comfortMultiplier = 1.25;

        const effectiveWeight = Number(sub.base_weight) * prepMultiplier * comfortMultiplier;

        // Progress metrics across 3 phases (study1, rev1, rev2)
        const chapterIds = chaptersBySubject.get(sub.slug) || [];
        const totalChapters = chapterIds.length;
        
        let totalItems = 0;
        let study1Done = 0;
        let rev1Done = 0;
        let rev2Done = 0;

        chapterIds.forEach((cid) => {
          const chSubtopics = subtopicsByChapter.get(cid) || [];
          const chPhases = progressMap.get(cid); // Set of phases where chapter is completed

          if (chSubtopics.length > 0) {
            totalItems += chSubtopics.length;
            const phases = ["study1", "rev1", "rev2"] as const;
            phases.forEach((p) => {
              if (chPhases?.has(p)) {
                // If chapter itself is complete, all subtopics in this phase count as complete!
                if (p === "study1") study1Done += chSubtopics.length;
                else if (p === "rev1") rev1Done += chSubtopics.length;
                else if (p === "rev2") rev2Done += chSubtopics.length;
              } else {
                // Otherwise count only individual subtopics checked complete in this phase
                chSubtopics.forEach((sid) => {
                  const subPhases = subtopicProgressMap.get(sid);
                  if (subPhases?.has(p)) {
                    if (p === "study1") study1Done++;
                    else if (p === "rev1") rev1Done++;
                    else if (p === "rev2") rev2Done++;
                  }
                });
              }
            });
          } else {
            totalItems += 1;
            if (chPhases?.has("study1")) study1Done++;
            if (chPhases?.has("rev1")) rev1Done++;
            if (chPhases?.has("rev2")) rev2Done++;
          }
        });

        const totalSlots = totalItems * 3; // 3 phases total
        const attempted = study1Done + rev1Done + rev2Done;
        const pct = totalSlots > 0 ? Math.round((attempted / totalSlots) * 100) : 0;

        return {
          sub: {
            slug: sub.slug,
            name: sub.name,
            shortName: sub.short_name,
            level: sub.level,
            baseWeight: Number(sub.base_weight),
          },
          effectiveWeight,
          practice: {
            total: totalChapters,
            study1Done,
            rev1Done,
            rev2Done,
            pct,
          },
          classesDone: userState.classes_done,
          rev1Done: userState.rev1_done,
          rev2Done: userState.rev2_done,
          expertise: userState.expertise,
          dbAllocatedDays: userState.allocated_days || 0,
          totalItems,
        };
      });

      // Total Effective Weight
      const totalEffectiveWeight = items.reduce((sum, item) => sum + item.effectiveWeight, 0);

      // Calculate Allocated Days
      let totalAttempted = 0;
      let totalSlotsCount = 0;
      let difficultySum = 0;

      const finalStats: SubjectPracticeStats[] = items.map((item) => {
        let calculatedDays = 0;
        if (totalEffectiveWeight > 0) {
          calculatedDays = Math.round((totalAvailableDays * item.effectiveWeight) / totalEffectiveWeight);
        }

        totalAttempted += item.practice.study1Done + item.practice.rev1Done + item.practice.rev2Done;
        totalSlotsCount += item.totalItems * 3;

        const diffWeight = item.expertise === "Easy" ? 1 : item.expertise === "Tough" ? 3 : 2;
        difficultySum += diffWeight;

        return {
          sub: item.sub,
          defaultDays: calculatedDays,
          allocatedDays: Math.max(1, calculatedDays + item.dbAllocatedDays),
          practice: item.practice,
          classesDone: item.classesDone,
          rev1Done: item.rev1Done,
          rev2Done: item.rev2Done,
          expertise: item.expertise,
        };
      });

      setSubjectStats(finalStats);

      // Overall Progress
      const overall = totalSlotsCount > 0 ? Math.round((totalAttempted / totalSlotsCount) * 100) : 0;
      setOverallPct(overall);

      // Difficulty calculation
      if (finalStats.length > 0) {
        const avgDifficulty = difficultySum / finalStats.length;
        if (avgDifficulty < 1.7) {
          setDifficulty({ label: "Easy", color: "bg-green-500" });
        } else if (avgDifficulty >= 2.5) {
          setDifficulty({ label: "Tough", color: "bg-red-500" });
        } else {
          setDifficulty({ label: "Moderate", color: "bg-amber-500" });
        }
      }

      setRecentTask(recentTaskInfo);
    } catch (err) {
      console.error("Error loading planner statistics:", err);
    } finally {
      setLoading(false);
    }
  }, [studentLevel, supabase, totalAvailableDays]);

  useEffect(() => {
    fetchPlannerStats();
  }, [fetchPlannerStats]);

  const setExam = async (label: string) => {
    const res = await saveUserExamAttempt(label);
    if (res.success) {
      await refreshProfile();
    }
    return res;
  };

  const updateSubjectPreps = async (draftStates: Record<string, Partial<SubjectPracticeStats>>) => {
    const upsertPayload: Record<string, any> = {};

    const items = subjectStats.map((subStat) => {
      const draft = draftStates[subStat.sub.slug] || {};
      const classesDone = draft.classesDone ?? subStat.classesDone;
      const rev1Done = draft.rev1Done ?? subStat.rev1Done;
      const rev2Done = draft.rev2Done ?? subStat.rev2Done;
      const expertise = draft.expertise ?? subStat.expertise;

      let prepMultiplier = 1.0;
      if (rev2Done) prepMultiplier = 0.20;
      else if (rev1Done) prepMultiplier = 0.45;
      else if (classesDone) prepMultiplier = 0.75;

      let comfortMultiplier = 1.0;
      if (expertise === "Easy") comfortMultiplier = 0.75;
      else if (expertise === "Tough") comfortMultiplier = 1.25;

      const effectiveWeight = subStat.sub.baseWeight * prepMultiplier * comfortMultiplier;

      return {
        slug: subStat.sub.slug,
        classesDone,
        rev1Done,
        rev2Done,
        expertise,
        effectiveWeight,
      };
    });

    const totalEffWeight = items.reduce((sum, item) => sum + item.effectiveWeight, 0);

    items.forEach((item) => {
      let calculatedDays = 0;
      if (totalEffWeight > 0) {
        calculatedDays = Math.round((totalAvailableDays * item.effectiveWeight) / totalEffWeight);
      }
      upsertPayload[item.slug] = {
        classesDone: item.classesDone,
        rev1Done: item.rev1Done,
        rev2Done: item.rev2Done,
        expertise: item.expertise,
        allocatedDays: 0,
      };
    });

    const res = await saveUserSubjectStates(upsertPayload);
    if (res.success) {
      await fetchPlannerStats();
    }
    return res;
  };

  return {
    state: { examLabel },
    setExam,
    daysLeft,
    subjectStats,
    setSubjectStats,
    overallPct,
    difficulty,
    loading,
    refreshStats: fetchPlannerStats,
    updateSubjectPreps,
    totalAvailableDays,
    recentTask,
    hasSetupPreps,
  };
};
