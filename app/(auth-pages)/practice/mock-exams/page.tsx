"use client"

import { useState, useEffect } from "react";
import MockExam from "@/components/MockExam";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { FileText, Clock, ChevronRight, BookOpen, Sparkles, TrendingUp, History, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useStudent } from "@/components/StudentTypeProvider";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { formatSubjectName } from "@/utils/subjects";
import Link from "next/link";

interface Test {
  id: string;
  name: string;
  category: string;
  questions_count: number;
  duration?: number;
  level?: string;
  description?: string;
  test_no?: string;
  updated_at: string;
  attempts?: {
    score: number;
    total_questions: number;
    completed_at: string;
  }[];
}

export default function MockExamsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { subjects, loading: studentLoading } = useStudent();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        let testQuery = supabase.from('tests').select('*');

        if (subjects.length > 0) {
          testQuery = testQuery.in('category', subjects);
        }

        const { data: testData, error } = await testQuery.order('created_at', { ascending: false });
        if (error) throw error;
        
        // Fetch latest attempts for each test for the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: attemptData } = await supabase
            .from('test_attempts')
            .select('test_id, score, total_questions, completed_at')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

          const testsWithAttempts = (testData || []).map((t: any) => ({
            ...t,
            attempts: attemptData?.filter(a => a.test_id === t.id) || []
          }));
          setTests(testsWithAttempts);
        } else {
          setTests(testData || []);
        }
      } catch (error: any) {
        console.error('Error fetching tests:', error.message);
        toast.error('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [supabase, subjects, studentLoading]);

  const handleStartTest = (testId: string) => {
    router.push(`/practice/mock-exams/${testId}`);
  };

  const formatCategory = (category: string) => {
    if (!category) return "";
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex flex-col">
      <main className="flex-1 pb-12">
        {/* <section className="bg-primary py-20 relative overflow-hidden"> */}
          {/* Background decorations */}
          {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[150%] rounded-full bg-accent/5 blur-3xl" />
          </div> */}
          
          {/* <div className="container relative z-10"> */}
            {/* <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 px-3 py-1 text-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Premium Mock Tests
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight">Available <span className="text-gradient-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Mock Exams</span></h1>
              <p className="mt-4 text-base text-primary-foreground/70 leading-relaxed">Select a test below to start your simulated exam experience. Track your performance and identify areas for improvement.</p>
            </motion.div> */}
              <section className="bg-primary py-12">
      <div className="container">
       <Link href="/practice"
                                   className="mb-4 flex items-center gap-1.5  w-[150px] text-xs text-primary-foreground/50  mx-auto hover:text-primary-foreground transition-colors"
                                 >
                                   <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
                                 </Link>
        <h1 className="text-center text-3xl font-bold text-primary-foreground">Mock  <span className="text-accent">Exams</span></h1>
        <p className="mt-2 text-center text-sm text-primary-foreground/50">Comprehensive PYQ bank organized by subject and difficulty</p>
      </div>
    </section>
          {/* </div> */}
        {/* </section> */}

        <section className="container py-16">
          <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-card-foreground">All Tests</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose from our curated list of ICAI-aligned mock exams</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="w-full sm:w-[250px]">
                <input 
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="w-[200px]">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Filter by Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(sub => (
                      <SelectItem key={sub} value={sub}>{formatSubjectName(sub as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => router.push('/practice/performance')}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                View Performance
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-24"
              >
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-4 text-muted-foreground text-sm font-medium">Loading premium tests...</p>
              </motion.div>
            ) : tests.filter(t => {
                const matchesSubject = selectedSubject === "all" || t.category === selectedSubject;
                if (!matchesSubject) return false;
                if (!searchQuery) return true;
                const sq = searchQuery.toLowerCase();
                return (
                  t.name.toLowerCase().includes(sq) ||
                  t.category.toLowerCase().includes(sq) ||
                  (t.description && t.description.toLowerCase().includes(sq)) ||
                  (t.test_no && t.test_no.toLowerCase().includes(sq)) ||
                  (t.level && t.level.toLowerCase().includes(sq))
                );
              }).length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-16 text-center shadow-sm "
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground/50 mb-6">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">No tests available</h3>
                <p className="mt-2 text-muted-foreground max-w-md">We're currently updating our test bank. Please check back later for new mock exams.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {tests
                  .filter(t => {
                    const matchesSubject = selectedSubject === "all" || t.category === selectedSubject;
                    if (!matchesSubject) return false;
                    if (!searchQuery) return true;
                    const sq = searchQuery.toLowerCase();
                    return (
                      t.name.toLowerCase().includes(sq) ||
                      t.category.toLowerCase().includes(sq) ||
                      (t.description && t.description.toLowerCase().includes(sq)) ||
                      (t.test_no && t.test_no.toLowerCase().includes(sq)) ||
                      (t.level && t.level.toLowerCase().includes(sq))
                    );
                  })
                  .map((test, i) => {
                  const lastAttempt = test.attempts && test.attempts.length > 0 ? test.attempts[0] : null;
                  const isAttempted = !!lastAttempt;
                  const scorePct = lastAttempt ? Math.round((lastAttempt.score / lastAttempt.total_questions) * 100) : 0;
                  
                  return (
                  <motion.div
  key={test.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4 }} // Subtler, more modern hover lift
  transition={{ delay: i * 0.05, duration: 0.3 }}
 className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-[3px] before:w-full before:bg-[linear-gradient(90deg,hsl(197_100%_50%),transparent)] before:opacity-80 hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100 after:bg-[radial-gradient(circle_at_top,hsl(197_100%_50%/0.15),transparent_60%)]"
>
  <div className="flex flex-col flex-1">
    {/* Top Row: Category & Status */}
    <div className="mb-4 flex items-center justify-between">
      <Badge 
        variant="secondary" 
        className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold shadow-none truncate text-ellipsis w-60 line-clamp-1"
      >
        {formatCategory(test.category)}
      </Badge>
      
      {test.test_no && (
        <Badge variant="outline" className="ml-2 bg-accent/5 text-accent border-accent/20">
          Test {test.test_no}
        </Badge>
      )}

     
    </div>

    {/* Title */}
    <div className="mb-4">
      <h3 className="text-xl font-bold tracking-tight text-card-foreground line-clamp-2 transition-colors group-hover:text-primary">
        {test.name}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Updated {formatDistanceToNow(new Date(test.updated_at), { addSuffix: true })}
      </p>
    </div>

    {/* Quick Stats Grid - Inline and clean */}
    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 opacity-70" />
        <span className="font-medium">{test.duration || test.questions_count * 1.5}m</span>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-4 w-4 opacity-70" />
        <span className="font-medium capitalize">{test.level === "intermediate" ? "Moderate" : test.level || 'Standard'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <FileText className="h-4 w-4 opacity-70" />
        <span className="font-medium">{test.questions_count} Qs</span>
      </div>
       {isAttempted && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Attempted</span>
        </div>
      )}
    </div>
    
    {/* Description */}
    {test.description && (
      <p className="mb-6 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
        {test.description}
      </p>
    )}

    {/* Spacer to push content up and button down */}
    <div className="flex-1" />

    {/* Last Score Summary (Only visible if attempted) */}
    {isAttempted && (
      <div className="mb-6 rounded-xl bg-muted/50 p-4 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Previous Score
          </span>
          <span className="text-sm font-bold text-foreground">
            {scorePct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${scorePct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${scorePct >= 70 ? 'bg-emerald-500' : scorePct >= 40 ? 'bg-amber-500' : 'bg-destructive'}`}
          />
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
          <span>{lastAttempt.score} of {lastAttempt.total_questions} correct</span>
          <span>{new Date(lastAttempt.completed_at).toLocaleDateString()}</span>
        </div>
      </div>
    )}
  </div>

  {/* Action Area */}
  <Button 
    onClick={() => handleStartTest(test.id)}
    variant={isAttempted ? "outline" : "default"}
    className="w-full group/btn h-12 rounded-xl font-semibold "
  >
    {isAttempted ? "Retake Exam" : "Start Exam"}
    <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
  </Button>
</motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
    <Footer/>
    </>
  );
}
