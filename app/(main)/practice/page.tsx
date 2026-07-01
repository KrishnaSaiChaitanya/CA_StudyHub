"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import MockExam from "@/components/MockExam";
import PerformanceHistory from "@/components/PerformanceHistory";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ClipboardCheck, Clock, Award, Lock, Crown, X, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ProFeatureLock } from "@/components/ProFeatureLock";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudent } from "@/components/StudentTypeProvider";


const Practice = () => {
  const router = useRouter();
  const supabase = createClient();
  const { studentLevel, subjects: studentSubjects, loading: studentLoading } = useStudent();
  const [counts, setCounts] = useState<Record<string, number | null>>({
    mtp: null,
    rtp: null,
    pyq: null,
    online: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        // Fetch all papers matching the student's level and subjects
        let query = supabase
          .from("practice_papers")
          .select("type");

        if (studentLevel) {
          query = query.eq("level", studentLevel);
        }

        if (studentSubjects.length > 0) {
          query = query.in("subject", studentSubjects);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching paper counts:", error);
          return;
        }

        if (data) {
          const newCounts: Record<string, number> = {
            mtp: 0,
            rtp: 0,
            pyq: 0,
            online: 0,
          };

          data.forEach((paper) => {
            if (newCounts[paper.type] !== undefined) {
              newCounts[paper.type]++;
            }
          });

          setCounts(newCounts);
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!studentLoading) {
      fetchCounts();
    }
  }, [supabase, studentLevel, studentSubjects, studentLoading]);

  const resources = [
    { icon: FileText, title: "Mock Test Papers (MTP)", type: "mtp", description: " Simulate exams and strengthen concepts with MTPs.", link: "/practice/mtp", isDisabled: false, unit: "Papers" },
    { icon: FileText, title: "Revision Test Papers (RTP)", type: "rtp", description: "Refine concepts with ICAI-aligned revision practice tests", link: "/practice/rtp", isDisabled: false, unit: "Papers" },
    { icon: FileText, title: "Previous Year Questions", type: "pyq", description: "Understand examiner mindset through previous year questions", link: "/practice/pyq", isDisabled: false, unit: "Papers" },
    { icon: ClipboardCheck, title: "Online Mock Exams", type: "online", description: "Simulate final exam pressure and boost performance", link: "/practice/online", isDisabled: true, unit: "Tests" },
  ];

  return (
    <div className="bg-background w-full">
      <main className="pb-12">
        <section className="bg-primary py-20">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl text-center">
              <h1 className="text-4xl font-bold text-primary-foreground">Practice & <span className="text-gradient-blue">Excel</span></h1>
              <p className="mt-4 text-sm text-primary-foreground/50">Access MTPs, RTPs, PYQs, and take mock exams to sharpen your skills.</p>
            </motion.div>
          </div>
        </section>
        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-2 mb-12">
            {resources.map((res, i) => (
              <div key={res.title} className={res.isDisabled ? "opacity-80" : ""}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col h-full rounded-xl border border-border bg-card p-6 shadow-card hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <res.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">{res.title}</h3>
                      <div className="flex items-center gap-1.5 h-4">
                        {loading ? (
                          <Skeleton className="h-3 w-16" />
                        ) : (
                          <>
                          {!res.isDisabled && <span className="text-xs font-medium text-accent">
                            {counts[res.type] || 0} {res.unit}
                          </span>}
                          </>
                        )}
                        {res.isDisabled && <Badge variant="secondary" className="text-[10px] py-0 h-4 uppercase bg-muted text-muted-foreground border-none">Coming Soon</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-xs text-muted-foreground">{res.description}</p>
                  
                  {res.type === "rtp" ? (
                    <Button variant="outline" size="sm" className="mt-4 w-full text-xs" disabled={res.isDisabled} asChild={!res.isDisabled}>
                      {res.isDisabled ? "Coming soon" : <Link href={res.link}>Browse Papers</Link>}
                    </Button>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                       <Button variant="outline" size="sm" className="text-xs" disabled={res.isDisabled} asChild={!res.isDisabled}>
                          {res.isDisabled ? "Coming soon" : <Link href={`${res.link}?category=questions`}>Questions</Link>}
                       </Button>
                       <Button variant="outline" size="sm" className="text-xs" disabled={res.isDisabled} asChild={!res.isDisabled}>
                          {res.isDisabled ? "Coming soon" : <Link href={`${res.link}?category=solutions`}>Solutions</Link>}
                       </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          <ProFeatureLock>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl bg-primary p-8 text-center"
            >
              <Award className="mx-auto h-8 w-8 text-accent" />
              <h3 className="mt-4 text-xl font-bold text-primary-foreground">Take a MCQ Mock Exam</h3>
              <p className="mt-2 text-xs text-primary-foreground/50"> Revise concepts, strengthen recall, and excel confidently.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" onClick={() => router.push('/practice/mock-exams')} className="bg-accent text-accent-foreground shadow-accent hover:bg-accent/90">View Mock Exams</Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/practice/performance')} className="border-accent/30 text-accent hover:bg-accent/10">View My Performance</Button>
              </div>
            </motion.div>
          </ProFeatureLock>
        </section>
      </main>
      
    </div>
  );
};

export default Practice;
