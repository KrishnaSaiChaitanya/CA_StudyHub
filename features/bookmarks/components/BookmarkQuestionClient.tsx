"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, BookmarkCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

import Footer from "@/components/Footer";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  notes?: string;
  tests?: {
    name: string;
    category: string;
  };
}

const letterMap = ['A', 'B', 'C', 'D'];

export default function BookmarkQuestionClient({ id }: { id: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select(`
            *,
            tests ( name, category )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setQuestion(data);
      } catch (err: any) {
        console.error("Error fetching question:", err);
        setError("Could not load the question. It may have been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-bold">Error</h2>
        <p className="mt-2 text-muted-foreground">{error || "Question not found"}</p>
        <Button className="mt-6" onClick={() => router.push("/bookmarks")}>
          Back to Bookmarks
        </Button>
      </div>
    );
  }

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ].filter(opt => opt.text && opt.text.trim() !== "");

  return (
    <div className="min-h-screen">

      <main className="container max-w-3xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Bookmarks
          </Button>

          <Card className="border-border bg-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                    <BookmarkCheck className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-card-foreground">Bookmarked Question</h2>
                    <p className="text-[10px] text-muted-foreground">
                      {question.tests?.name} &bull; {question.tests?.category}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-lg font-medium leading-relaxed text-card-foreground whitespace-pre-wrap">
                  {question.question_text}
                </div>

                <div className="mt-8 space-y-3">
                  {options.map((opt) => {
                    const isCorrect = opt.key === question.correct_answer;
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                          isCorrect
                            ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                            : "border-border bg-secondary/30"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${isCorrect ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {opt.text}
                          </p>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {question.notes && (
                <div className="mt-10 rounded-xl border border-accent/20 bg-accent/5 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent">Explanation & Notes</h4>
                  </div>
                  <div className="text-sm italic leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {question.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
