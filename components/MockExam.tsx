"use client"
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowLeft, Loader2, Bookmark, BookmarkCheck, Maximize2, Minimize2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface Test {
  id: string;
  name: string;
  duration?: number;
  questions_count: number;
}

interface MockExamProps {
  testId: string;
  onExit: () => void;
}


const letterMap = ['A', 'B', 'C', 'D'];

const MockExam = ({ testId, onExit }: MockExamProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [bookmarkedQs, setBookmarkedQs] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qToRemove, setQToRemove] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const userRes = await supabase.auth.getUser();
        
        const { data: testData, error: testErr } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .eq('state', 'published')
          .single();
        if (testErr) throw testErr;

        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', testId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (qErr) throw qErr;

        setTest(testData);
        setQuestions(qData || []);
        
        // Use test duration from DB (in minutes) or fallback to questions count * 1.5
        const durationInMinutes = testData.duration || (qData ? qData.length * 1.5 : 30);
        setTimeLeft(Math.floor(durationInMinutes * 60));

        if (userRes.data.user) {
          const uid = userRes.data.user.id;
          setUserId(uid);
          const { data: bData } = await supabase
            .from('user_bookmarks')
            .select('question_id')
            .eq('user_id', uid)
            .not('question_id', 'is', null);
          
          if (bData) {
            setBookmarkedQs(new Set(bData.map(b => b.question_id as string)));
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load exam data.");
        onExit();
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchExamData();
  }, [testId, supabase, onExit]);

  useEffect(() => {
    if (submitted || loading || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { 
          clearInterval(interval); 
          handleSubmit(true); // force submit on timeout
          return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, loading, questions]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const calculateScore = () => {
    return questions.reduce((acc, q, i) => {
      const uA = answers[i] !== undefined ? letterMap[answers[i]] : null;
      return acc + (uA === q.correct_answer ? 1 : 0);
    }, 0);
  };

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
    // Optimistic Update
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
       // Revert optimistic update
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleSubmit = async (isTimeout = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!userId) {
        toast.error("Please login to submit the exam.");
        return;
      }

      const currentScore = calculateScore();
      setScore(currentScore);

      // Calculate time taken
      const totalTimeSeconds = (test?.duration || questions.length * 1.5) * 60;
      const timeUsed = totalTimeSeconds - timeLeft;

      // Create test_attempts
      const { data: attempt, error: attemptErr } = await supabase
        .from('test_attempts')
        .insert({
          user_id: userId,
          test_id: testId,
          score: currentScore,
          total_questions: questions.length,
          time_taken: timeUsed
        })
        .select()
        .single();
      
      if (attemptErr) throw attemptErr;

      // Create test_attempt_answers
      const answerRows = questions.map((q, i) => {
        const uA = answers[i] !== undefined ? letterMap[answers[i]] : null;
        return {
          attempt_id: attempt.id,
          question_id: q.id,
          selected_option: uA,
          is_correct: uA === q.correct_answer
        };
      });

      const { error: ansErr } = await supabase
        .from('test_attempt_answers')
        .insert(answerRows);

      if (ansErr) throw ansErr;

      setSubmitted(true);
      setShowResults(true);
      toast.success("Exam submitted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="mt-4 text-muted-foreground">Loading your exam...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <p className="text-muted-foreground">No questions found for this test.</p>
        <Button onClick={onExit} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const q = questions[currentQ];
  const qOptions = [q.option_a, q.option_b, q.option_c, q.option_d];

  if (submitted && showResults) {
    const isPassing = score >= Math.ceil(questions.length * 0.4); // 40% pass
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container max-w-2xl py-12">
        <Card className="border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            {isPassing ? <CheckCircle2 className="h-8 w-8 text-accent" /> : <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <h2 className="text-2xl font-semibold text-card-foreground">Exam Complete</h2>
          <p className="mt-2 text-sm text-muted-foreground">Here&apos;s how you performed</p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
           
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-card-foreground">{answered}/{questions.length}</p>
              <p className="text-xs text-muted-foreground">Attempted</p>
            </div>
             <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-accent">{score}/{questions.length}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-card-foreground">
                {formatTime((test?.duration || questions.length * 1.5) * 60 - timeLeft)}
              </p>
              <p className="text-xs text-muted-foreground">Time Taken</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-left">
            {questions.map((sq, i) => {
              const uA = answers[i] !== undefined ? letterMap[answers[i]] : null;
              const isCorrect = uA === sq.correct_answer;
              const correctIdx = letterMap.indexOf(sq.correct_answer);
              const opts = [sq.option_a, sq.option_b, sq.option_c, sq.option_d];

              return (
                <div key={sq.id} className={`rounded-lg border p-3 ${isCorrect ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <p className="text-xs font-medium text-card-foreground">{i + 1}. {sq.question_text}</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {opts.map((o, idx) => (o && o.trim() !== "") && (
                       <div key={idx} className={`text-xs p-1.5 rounded ${sq.correct_answer === letterMap[idx] ? "bg-accent/10 border border-accent/20 text-accent font-medium" : "text-muted-foreground"}`}>
                         {letterMap[idx]}. {o}
                       </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
                    Your answer: <span className={isCorrect ? "text-accent" : (uA ? "text-destructive" : "text-muted-foreground italic")}>{uA ? opts[answers[i]] : "Not answered"}</span>
                    {!isCorrect && <> &middot; Correct: <span className="text-accent font-medium">{opts[correctIdx]}</span></>}
                  </p>
                </div>
              );
            })}
          </div>
          <Button onClick={onExit} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">Back to Practice</Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setIsExitModalOpen(true)} className="gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${timeLeft < 300 ? "border-destructive/50 text-destructive" : "border-border text-card-foreground"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {currentQ + 1} of {questions.length}</span>
        <span>{answered} answered</span>
      </div>
      <Progress value={((currentQ + 1) / questions.length) * 100} className="mb-6 h-1.5" />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={`question-${currentQ}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-accent">Question {currentQ + 1}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-accent"
                onClick={() => toggleBookmark(q.id)}
                title={bookmarkedQs.has(q.id) ? "Remove Bookmark" : "Bookmark Question"}
              >
                {bookmarkedQs.has(q.id) ? (
                  <BookmarkCheck className="h-4 w-4 text-accent" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
            <h3 className="mt-2 text-base font-semibold text-card-foreground leading-relaxed">{q.question_text}</h3>
            <RadioGroup
              className="mt-6 space-y-3"
              value={answers[currentQ]?.toString()}
              onValueChange={(v) => setAnswers({ ...answers, [currentQ]: parseInt(v) })}
            >
              {qOptions.map((opt, i) => {
                if (!opt || opt.trim() === "") return null;
                return (
                  <label
                    key={`opt-${i}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                      answers[currentQ] === i ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={i.toString()} />
                    <span className="text-sm text-card-foreground">{opt}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={currentQ === 0 || submitting} onClick={() => setCurrentQ(currentQ - 1)} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {currentQ === questions.length - 1 ? (
          <Button size="sm" disabled={submitting} onClick={() => handleSubmit(false)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Exam
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCurrentQ(currentQ + 1)} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Question map */}
      <div className="mt-6 flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={`nav-${i}`}
            onClick={() => setCurrentQ(i)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all ${
              i === currentQ ? "bg-accent text-accent-foreground" : answers[i] !== undefined ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmRemoveQ}
        title="Remove Bookmark?"
        description="Are you sure you want to remove this question from your bookmarks?"
        confirmText="Remove"
      />
      <ConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={onExit}
        title="Exit Test?"
        description="Are you sure you want to exit? Your progress for this attempt will not be saved."
        confirmText="Exit Anyway"
        variant="destructive"
      />
    </div>
  );
};

export default MockExam;
