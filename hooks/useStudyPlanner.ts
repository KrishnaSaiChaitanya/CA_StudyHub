"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { saveUserChapterProgress, saveUserSubtopicProgress, saveBatchSubtopicProgress } from "@/app/(main)/study/study-planning/actions";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";

export type TrackerPhase = "study1" | "rev1" | "rev2";
export type ChapterStatus = "pending" | "completed" | "skipped";

export interface ChapterProgressState {
  status: ChapterStatus;
  remarks: string;
  subtopics: Record<number, { status: ChapterStatus }>;
}

export interface SubjectTrackerState {
  tracker: Record<TrackerPhase, Record<number, ChapterProgressState>>;
}

export interface SubjectStats {
  sub: {
    slug: SubjectCategory;
    name: string;
    shortName: string;
    level: StudentLevel;
  };
  lectures: {
    id: string;
    topic: string;
    hours: number;
    subtopics: { id: string; name: string }[];
  }[];
}

export const useStudyPlanner = () => {
  const { studentLevel } = useStudent();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [state, setState] = useState<{ subjects: Record<string, SubjectTrackerState> }>({ subjects: {} });

  const fetchTrackerData = useCallback(async () => {
    if (!studentLevel) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch subjects
      const { data: subjectsData } = await supabase
        .from("planner_subjects")
        .select("*")
        .eq("level", studentLevel)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (!subjectsData) {
        setLoading(false);
        return;
      }

      // 2. Fetch all chapters for these subjects
      const { data: chaptersData } = await supabase
        .from("planner_chapters")
        .select("*")
        .in("subject_slug", subjectsData.map((s) => s.slug))
        .order("sort_order", { ascending: true });

      // 3. Fetch all subtopics for these chapters
      const chapterIds = chaptersData?.map((c) => c.id) || [];
      const { data: subtopicsData } = await supabase
        .from("planner_subtopics")
        .select("*")
        .in("chapter_id", chapterIds)
        .order("sort_order", { ascending: true });

      // Group subtopics by chapter_id
      const subtopicsByChapter = new Map<string, { id: string; name: string }[]>();
      subtopicsData?.forEach((st) => {
        const list = subtopicsByChapter.get(st.chapter_id) || [];
        list.push({ id: st.id, name: st.name });
        subtopicsByChapter.set(st.chapter_id, list);
      });

      // 4. Fetch user chapter progress
      const { data: userChapterProgress } = await supabase
        .from("user_chapter_progress")
        .select("*")
        .eq("user_id", user.id);

      // 5. Fetch user subtopic progress
      const { data: userSubtopicProgress } = await supabase
        .from("user_subtopic_progress")
        .select("*")
        .eq("user_id", user.id);

      // Create stats mapping
      const formattedStats: SubjectStats[] = subjectsData.map((sub) => {
        const subChapters = chaptersData?.filter((c) => c.subject_slug === sub.slug) || [];
        const lectures = subChapters.map((ch) => ({
          id: ch.id,
          topic: ch.topic,
          hours: Number(ch.hours),
          subtopics: subtopicsByChapter.get(ch.id) || [],
        }));

        return {
          sub: {
            slug: sub.slug,
            name: sub.name,
            shortName: sub.short_name,
            level: sub.level,
          },
          lectures,
        };
      });

      setSubjectStats(formattedStats);

      // Build index-based state structure for the frontend UI
      const subjectsState: Record<string, SubjectTrackerState> = {};

      subjectsData.forEach((sub) => {
        const subChapters = chaptersData?.filter((c) => c.subject_slug === sub.slug) || [];
        const tracker: Record<TrackerPhase, Record<number, ChapterProgressState>> = {
          study1: {},
          rev1: {},
          rev2: {},
        };

        const phases: TrackerPhase[] = ["study1", "rev1", "rev2"];

        phases.forEach((phase) => {
          subChapters.forEach((ch, chIdx) => {
            const chProg = userChapterProgress?.find(
              (p) => p.chapter_id === ch.id && p.phase === phase
            );
            const parentStatus = (chProg?.status as ChapterStatus) || "pending";

            // Fetch subtopics for this chapter
            const chSubtopics = subtopicsByChapter.get(ch.id) || [];
            const subtopicsState: Record<number, { status: ChapterStatus }> = {};

            chSubtopics.forEach((st, stIdx) => {
              const stProg = userSubtopicProgress?.find(
                (p) => p.subtopic_id === st.id && p.phase === phase
              );
              // If individual subtopic progress exists use it; otherwise fallback to parent status
              subtopicsState[stIdx] = {
                status: (stProg?.status as ChapterStatus) || (chProg ? parentStatus : "pending"),
              };
            });

            tracker[phase][chIdx] = {
              status: parentStatus,
              remarks: chProg?.remarks || "",
              subtopics: subtopicsState,
            };
          });
        });

        subjectsState[sub.slug] = { tracker };
      });

      setState({ subjects: subjectsState });
    } catch (err) {
      console.error("Failed to load tracker progress details:", err);
    } finally {
      setLoading(false);
    }
  }, [studentLevel, supabase]);

  useEffect(() => {
    fetchTrackerData();
  }, [fetchTrackerData]);

  // Update a chapter status or remarks in the DB & state
  const updateChapter = async (
    subjectSlug: string,
    phase: TrackerPhase,
    chapterIdx: number,
    patch: { status?: ChapterStatus; remarks?: string }
  ) => {
    const subStat = subjectStats.find((s) => s.sub.slug === subjectSlug);
    const chapter = subStat?.lectures[chapterIdx];
    const chapterId = chapter?.id;

    if (!chapterId) return;

    const subtopicsList = chapter?.subtopics || [];

    // Optimistic Update
    setState((prev) => {
      const nextSubjects = { ...prev.subjects };
      const subState = nextSubjects[subjectSlug];
      if (subState) {
        const nextTracker = { ...subState.tracker };
        const phaseTracker = { ...nextTracker[phase] };
        const chTracker = { ...phaseTracker[chapterIdx] };

        if (patch.status !== undefined) {
          chTracker.status = patch.status;

          // When chapter status is changed, cascade to all subtopics
          if (subtopicsList.length > 0) {
            const nextSubtopics: Record<number, { status: ChapterStatus }> = {};
            subtopicsList.forEach((_, si) => {
              nextSubtopics[si] = { status: patch.status! };
            });
            chTracker.subtopics = nextSubtopics;
          }
        }

        if (patch.remarks !== undefined) chTracker.remarks = patch.remarks;

        phaseTracker[chapterIdx] = chTracker;
        nextTracker[phase] = phaseTracker;
        nextSubjects[subjectSlug] = { tracker: nextTracker };
      }
      return { subjects: nextSubjects };
    });

    // DB Mutation for chapter
    await saveUserChapterProgress({
      chapterId,
      phase,
      status: patch.status,
      remarks: patch.remarks,
    });

    // Cascade to all subtopics in DB
    if (patch.status !== undefined && subtopicsList.length > 0) {
      const subtopicUpdates = subtopicsList.map((st) => ({
        subtopicId: st.id,
        phase,
        status: patch.status!,
      }));
      await saveBatchSubtopicProgress(subtopicUpdates);
    }
  };

  // Update a subtopic status in the DB & state
  const updateSubtopic = async (
    subjectSlug: string,
    phase: TrackerPhase,
    chapterIdx: number,
    subtopicIdx: number,
    patch: { status: ChapterStatus }
  ) => {
    const subStat = subjectStats.find((s) => s.sub.slug === subjectSlug);
    const chapter = subStat?.lectures[chapterIdx];
    const chapterId = chapter?.id;
    const subtopicsList = chapter?.subtopics || [];
    const subtopicId = subtopicsList[subtopicIdx]?.id;

    if (!subtopicId || !chapterId) return;

    let newChapterStatus: ChapterStatus | null = null;
    let shouldUpdateChapter = false;

    // Optimistic Update
    setState((prev) => {
      const nextSubjects = { ...prev.subjects };
      const subState = nextSubjects[subjectSlug];
      if (subState) {
        const nextTracker = { ...subState.tracker };
        const phaseTracker = { ...nextTracker[phase] };
        const chTracker = { ...phaseTracker[chapterIdx] };
        const nextSubtopics = { ...chTracker.subtopics };

        nextSubtopics[subtopicIdx] = { status: patch.status };
        chTracker.subtopics = nextSubtopics;

        // Check if all subtopics share a specific status
        if (subtopicsList.length > 0) {
          const allCompleted = subtopicsList.every((_, si) => {
            return (nextSubtopics[si]?.status ?? "pending") === "completed";
          });
          const allSkipped = subtopicsList.every((_, si) => {
            return (nextSubtopics[si]?.status ?? "pending") === "skipped";
          });
          const allPending = subtopicsList.every((_, si) => {
            return (nextSubtopics[si]?.status ?? "pending") === "pending";
          });

          if (allCompleted) {
            newChapterStatus = "completed";
          } else if (allSkipped) {
            newChapterStatus = "skipped";
          } else if (allPending) {
            newChapterStatus = "pending";
          } else {
            // Mixed subtopic statuses
            newChapterStatus = "pending";
          }

          if (chTracker.status !== newChapterStatus) {
            chTracker.status = newChapterStatus;
            shouldUpdateChapter = true;
          }
        }

        phaseTracker[chapterIdx] = chTracker;
        nextTracker[phase] = phaseTracker;
        nextSubjects[subjectSlug] = { tracker: nextTracker };
      }
      return { subjects: nextSubjects };
    });

    // DB Mutation for subtopic
    await saveUserSubtopicProgress({
      subtopicId,
      phase,
      status: patch.status,
    });

    // DB Mutation for chapter if status changed
    if (shouldUpdateChapter && newChapterStatus) {
      await saveUserChapterProgress({
        chapterId,
        phase,
        status: newChapterStatus,
      });
    }
  };

  const updateBatchRemarksLocally = (
    subjectSlug: string,
    updates: { chapterIdx: number; phase: TrackerPhase; remarks: string }[]
  ) => {
    setState((prev) => {
      const nextSubjects = { ...prev.subjects };
      const subState = nextSubjects[subjectSlug];
      if (subState) {
        const nextTracker = { ...subState.tracker };
        updates.forEach(({ chapterIdx, phase, remarks }) => {
          const phaseTracker = { ...nextTracker[phase] };
          const chTracker = { ...phaseTracker[chapterIdx] };
          chTracker.remarks = remarks;
          phaseTracker[chapterIdx] = chTracker;
          nextTracker[phase] = phaseTracker;
        });
        nextSubjects[subjectSlug] = { tracker: nextTracker };
      }
      return { subjects: nextSubjects };
    });
  };

  const setLastActivity = (activity: { slug: string; phase: TrackerPhase }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("planner_last_activity", JSON.stringify(activity));
    }
  };

  return {
    state,
    subjectStats,
    loading,
    updateChapter,
    updateSubtopic,
    setLastActivity,
    updateBatchRemarksLocally,
    refreshProgress: fetchTrackerData,
  };
};
