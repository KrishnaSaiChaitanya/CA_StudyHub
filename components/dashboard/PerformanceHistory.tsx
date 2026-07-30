import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, Target, Clock, Calendar, BarChart3, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Attempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  time_taken?: number;
  tests: {
    name: string;
    category: string;
  };
}

interface AttemptAnswer {
  id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  questions: {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    notes: string;
  };
}

interface PerformanceHistoryProps {
  onBack: () => void;
}

const formatCategory = (category: string) => {
  if (!category) return "";
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimeTaken = (seconds: number) => {
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const PerformanceHistory = ({ onBack }: PerformanceHistoryProps) => {
  const [history, setHistory] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [bookmarkedQs, setBookmarkedQs] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [qToRemove, setQToRemove] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAttemptDetails = async (attempt: Attempt) => {
    setSelectedAttempt(attempt);
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('test_attempt_answers')
        .select(`
          id,
          question_id,
          selected_option,
          is_correct,
          questions (
            id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            notes
          )
        `)
        .eq('attempt_id', attempt.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttemptAnswers(data as unknown as AttemptAnswer[] || []);
    } catch (error) {
      console.error("Error fetching attempt details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('test_attempts')
          .select(`
            id,
            score,
            total_questions,
            completed_at,
            time_taken,
            tests (
              name,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) throw error;
        setHistory(data as unknown as Attempt[] || []);

        // Fetch user bookmarks
        const { data: bData } = await supabase
          .from('user_bookmarks')
          .select('question_id')
          .eq('user_id', user.id)
          .not('question_id', 'is', null);

        if (bData) {
          setBookmarkedQs(new Set(bData.map(b => b.question_id as string)));
        }
        setUserId(user.id);
      } catch (error) {
        console.error("Error fetching performance history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [supabase]);

  const totalTests = history.length;
  const percentages = history.map(t => Math.round((t.score / Math.max(t.total_questions, 1)) * 100));
  const avgScore = totalTests > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / totalTests) : 0;
  const bestScore = totalTests > 0 ? Math.max(...percentages) : 0;

  const toggleBookmark = async (qId: string) => {
    if (!userId) {
      toast.error("Please login to bookmark questions.");
      return;
    }

    const isBookmarked = bookmarkedQs.has(qId);

    if (isBookmarked) {
      setQToRemove(qId);
      setIsConfirmModalOpen(true);
      return;
    }

    await executeBookmarkUpdate(qId, false);
  };

  const executeBookmarkUpdate = async (qId: string, isRemove: boolean) => {
    setBookmarkedQs(prev => {
      const next = new Set(prev);
      if (isRemove) next.delete(qId);
      else next.add(qId);
      return next;
    });

    try {
      if (isRemove) {
        await supabase.from('user_bookmarks').delete().match({ user_id: userId, question_id: qId });
        toast.success("Bookmark removed");
      } else {
        await supabase.from('user_bookmarks').insert({ user_id: userId, question_id: qId });
        toast.success("Question bookmarked");
      }
    } catch (error) {
      setBookmarkedQs(prev => {
        const next = new Set(prev);
        if (isRemove) next.add(qId);
        else next.delete(qId);
        return next;
      });
      toast.error("Failed to update bookmark.");
    }
  };

  const handleConfirmRemoveQ = async () => {
    if (qToRemove) {
      await executeBookmarkUpdate(qToRemove, true);
      setQToRemove(null);
      setIsConfirmModalOpen(false);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-accent";
    if (pct >= 60) return "text-yellow-400";
    return "text-destructive";
  };

  const getScoreBadge = (pct: number) => {
    if (pct >= 80) return { label: "Excellent", cls: "bg-accent/10 text-accent border-accent/20" };
    if (pct >= 60) return { label: "Good", cls: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" };
    return { label: "Needs Work", cls: "bg-destructive/10 text-destructive border-destructive/20" };
  };

  if (loading) {
    return (
      <div className="container max-w-3xl py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
        </Button>

        <h2 className="text-2xl font-semibold text-foreground">My Performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track your mock exam history and progress</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: BarChart3, label: "Tests Taken", value: totalTests.toString() },
            { icon: Target, label: "Avg Score", value: `${avgScore}%` },
            { icon: TrendingUp, label: "Best Score", value: `${bestScore}%` },
            { icon: Clock, label: "Avg Time", value: totalTests > 0 ? formatTimeTaken(Math.round(history.reduce((a, b) => a + (b.time_taken || 0), 0) / totalTests)) : "N/A" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border bg-card p-4 text-center">
                <stat.icon className="mx-auto h-4 w-4 text-accent" />
                <p className="mt-2 text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {totalTests === 0 ? (
          <Card className="mt-10 border-border bg-card p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">No Performance Data</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              You haven't completed any mock exams yet. Take your first test to see your performance stats here.
            </p>
            <Button onClick={onBack} className="mt-6 bg-accent text-accent-foreground">
              Go to Mock Exams
            </Button>
          </Card>
        ) : (
          <>
            <Card className="mt-6 border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Score Trend</h3>
              <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
                {history.slice().reverse().map((test, i) => {
                  const pct = Math.round((test.score / Math.max(test.total_questions, 1)) * 100);
                  return (
                    <motion.div
                      key={test.id}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="group relative flex-1 cursor-pointer rounded-t-md bg-accent/20 transition-colors hover:bg-accent/40 flex flex-col justify-end"
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        {pct}%
                      </div>
                      <div className="w-full rounded-t-md bg-accent" style={{ height: `${pct}%` }} />
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2 overflow-hidden">
                {history.slice().reverse().map((test) => (
                  <p key={test.id} className="flex-1 text-center text-[9px] text-muted-foreground truncate">
                    {new Date(test.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                ))}
              </div>
            </Card>

            <h3 className="mt-8 text-sm font-semibold text-foreground">Test History</h3>
            <div className="mt-3 space-y-2">
              {history.map((test, i) => {
                const pct = Math.round((test.score / Math.max(test.total_questions, 1)) * 100);
                const badge = getScoreBadge(pct);
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className="border-border bg-card p-4 cursor-pointer hover:bg-secondary/20 transition-colors group"
                      onClick={() => fetchAttemptDetails(test)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{test.tests?.name}</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {formatCategory(test.tests?.category)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeTaken(test.time_taken || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(test.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className={`text-lg font-bold ${getScoreColor(pct)}`}>
                            {test.score}/{test.total_questions}
                          </p>
                          <Progress value={pct} className="mt-1 h-1.5 w-16" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedAttempt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                  onClick={() => setSelectedAttempt(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-card border border-border w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{selectedAttempt.tests?.name}</h3>
                        <p className="text-xs text-muted-foreground">Attempted on {new Date(selectedAttempt.completed_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black ${getScoreColor(Math.round((selectedAttempt.score / selectedAttempt.total_questions) * 100))}`}>
                          {selectedAttempt.score}/{selectedAttempt.total_questions}
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Score</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {loadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="mt-2 text-sm text-muted-foreground">Loading answers...</p>
                        </div>
                      ) : (
                        attemptAnswers.map((ans, i) => {
                          const q = ans.questions;
                          const options = [
                            { key: 'A', text: q.option_a },
                            { key: 'B', text: q.option_b },
                            { key: 'C', text: q.option_c },
                            { key: 'D', text: q.option_d },
                          ];

                          return (
                            <div key={ans.id} className="space-y-3">
                              <div className="flex items-start gap-3">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ans.is_correct ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>
                                  {i + 1}
                                </span>
                                <div className="flex-1 text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                                  {q.question_text}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground group"
                                  onClick={() => toggleBookmark(q.id)}
                                  title={bookmarkedQs.has(q.id) ? "Remove Bookmark" : "Bookmark Question"}
                                >
                                  {bookmarkedQs.has(q.id) ? (
                                    <BookmarkCheck className="h-4 w-4 text-accent group-hover:text-accent-foreground" />
                                  ) : (
                                    <Bookmark className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-9">
                                {options.map((opt) => opt.text && (
                                  <div
                                    key={opt.key}
                                    className={`text-xs p-3 rounded-lg border flex items-center gap-2 ${opt.key === q.correct_answer
                                      ? "bg-accent/10 border-accent/30 text-accent font-semibold"
                                      : opt.key === ans.selected_option
                                        ? "bg-destructive/10 border-destructive/30 text-destructive font-semibold"
                                        : "bg-secondary/50 border-border text-muted-foreground"
                                      }`}
                                  >
                                    <span className="w-5 h-5 flex items-center justify-center rounded bg-background/50 border border-current/20">{opt.key}</span>
                                    {opt.text}
                                  </div>
                                ))}
                              </div>

                              <div className="ml-9 p-3 rounded-lg bg-secondary/30 border border-border/50 text-[11px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-muted-foreground font-semibold uppercase tracking-tighter">Your Answer: <span className={ans.is_correct ? "text-accent" : "text-destructive"}>{ans.selected_option || 'Skipped'}</span></span>
                                  <span className="text-muted-foreground font-semibold uppercase tracking-tighter">Correct: <span className="text-accent">{q.correct_answer}</span></span>
                                </div>
                                {q.notes && (
                                  <div className="mt-2 pt-2 border-t border-border/50 text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
                                    <span className="font-bold text-foreground not-italic mr-1">Explanation:</span> {q.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-4 mr-10 md:mr-0 border-t border-border flex justify-end">
                      <Button variant="outline" onClick={() => setSelectedAttempt(null)}>Close</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <ConfirmModal
              isOpen={isConfirmModalOpen}
              onClose={() => setIsConfirmModalOpen(false)}
              onConfirm={handleConfirmRemoveQ}
              title="Remove Bookmark?"
              description="Are you sure you want to remove this question from your bookmarks?"
              confirmText="Remove"
            />
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PerformanceHistory;
