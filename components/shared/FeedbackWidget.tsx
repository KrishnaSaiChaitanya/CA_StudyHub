"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Star, Bug, Lightbulb, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { submitFeedbackRatingAction, submitFeedbackSubmissionAction } from "@/app/actions";
import { syncContactRequestAction } from "@/app/public-api-actions";
import Image from "next/image";

type Tab = "rating" | "bug" | "feature";

const problemOptions = [
  "Saving time",
  "Finding new resources",
  "Tracking progress",
  "Revising topics",
];

const StarRow = ({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="transition-transform hover:scale-110"
        aria-label={`${n} star`}
      >
        <Star
          size={size}
          className={cn(
            "transition-colors",
            n <= value ? "fill-accent text-accent" : "fill-transparent text-muted-foreground"
          )}
        />
      </button>
    ))}
  </div>
);

const FeedbackWidget = () => {
  const { toast } = useToast();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("rating");
  const [user, setUser] = useState<any>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState("");

  const [overall, setOverall] = useState(0);
  const [flashcards, setFlashcards] = useState(0);
  const [navEase, setNavEase] = useState(0);
  const [recommend, setRecommend] = useState(0);
  const [problem, setProblem] = useState<string>("");

  const [bug, setBug] = useState("");
  const [feature, setFeature] = useState("");

  useEffect(() => {
    const initWidget = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          const { data: profile } = await supabase
            .from("profiles")
            .select("feedback, full_name")
            .eq("id", authUser.id)
            .maybeSingle();

          const userHasRated = !!profile?.feedback;
          setHasRated(userHasRated);
          setUserName(profile?.full_name || authUser.email || "");

          if (userHasRated) {
            setTab("bug");
          }

          const dismissed = localStorage.getItem("feedback_widget_dismissed");
          if (!dismissed && !userHasRated) {
            setOpen(true);
          }
        }
      } catch (err) {
        console.error("Error initializing feedback widget:", err);
      } finally {
        setLoading(false);
      }
    };
    initWidget();
  }, []);

  const reset = () => {
    setOverall(0);
    setFlashcards(0);
    setNavEase(0);
    setRecommend(0);
    setProblem("");
    setBug("");
    setFeature("");
  };

  const handleDismiss = () => {
    localStorage.setItem("feedback_widget_dismissed", "true");
    setOpen(false);
  };

  const handleFabClick = () => {
    if (open) {
      handleDismiss();
    } else {
      setOpen(true);
    }
  };

  const submit = async () => {
    if (tab === "rating" && overall === 0) {
      toast({ title: "Please rate the site first", variant: "destructive" });
      return;
    }
    if (tab === "bug" && !bug.trim()) {
      toast({ title: "Please describe the bug", variant: "destructive" });
      return;
    }
    if (tab === "feature" && !feature.trim()) {
      toast({ title: "Please describe the feature", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "rating") {
        const res = await submitFeedbackRatingAction({
          overall,
          flashcards,
          navEase,
          recommend,
          problem,
        });
        if (res.success) {
          toast({ title: "Thanks for your feedback! 💙", description: "We really appreciate it." });
          setHasRated(true);
          setTab("bug");
          localStorage.setItem("feedback_widget_dismissed", "true");
          setOpen(false);
          reset();
        } else {
          toast({ title: "Submission failed", description: res.error, variant: "destructive" });
        }
      } else {
        const type = tab === "bug" ? "bug" : "feature_request";
        const message = tab === "bug" ? bug : feature;
        const res = await submitFeedbackSubmissionAction({
          type,
          message,
        });
        if (res.success) {
          // Mirror to external tracker — fire-and-forget, errors are silent
          syncContactRequestAction({
            name: userName || user?.email || "Unknown",
            email: user?.email ?? "",
            subject: tab === "bug" ? "Bug Report" : "Feature Request",
            message,
          }).catch(() => { /* silently ignored — never surfaces to the user */ });

          toast({ title: "Feedback submitted! 💙", description: "Thank you for helping us improve." });
          localStorage.setItem("feedback_widget_dismissed", "true");
          setOpen(false);
          reset();
        } else {
          toast({ title: "Submission failed", description: res.error, variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "An error occurred", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const tabsList = [
    ...(!hasRated ? [{ id: "rating" as Tab, label: "Rate", icon: Star }] : []),
    { id: "bug" as Tab, label: "Bug", icon: Bug },
    { id: "feature" as Tab, label: "Idea", icon: Lightbulb },
  ];

  return (
    <div className="fixed right-4 bottom-20 z-50 md:right-6 md:bottom-6 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[92vw] max-w-sm origin-bottom-right rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border px-4 bg-card">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Share feedback</h3>
                <p className="text-xs text-muted-foreground">Help us improve CA Study Hub</p>
              </div>
              <Image width={60} height={50} alt="star gif" src="https://res.cloudinary.com/dsfems7vy/image/upload/v1783190647/Star_rating_glqwzr.gif" />
            </div>

            <div className="flex gap-1 border-b border-border p-2 bg-muted/20">
              {tabsList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    tab === t.id
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
              {tab === "rating" && (
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm">Overall rating</Label>
                    <div className="mt-2">
                      <StarRow value={overall} onChange={setOverall} size={28} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {overall > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5 overflow-hidden"
                      >
                        <div>
                          <Label className="text-sm">Quality of Flashcards / MCQ mocks</Label>
                          <div className="mt-2">
                            <StarRow value={flashcards} onChange={setFlashcards} />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Ease of navigating the website</Label>
                          <div className="mt-2">
                            <StarRow value={navEase} onChange={setNavEase} />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">
                            How likely are you to recommend us?
                          </Label>
                          <div className="mt-2">
                            <StarRow value={recommend} onChange={setRecommend} />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">
                            Which problem does the website solve for you?
                          </Label>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {problemOptions.map((opt) => {
                              const selected = problem === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setProblem(opt)}
                                  className={cn(
                                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                                    selected
                                      ? "bg-accent text-accent-foreground"
                                      : "border border-border bg-background text-muted-foreground hover:bg-accent/5"
                                  )}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {tab === "bug" && (
                <div className="space-y-2">
                  <Label className="text-sm">Describe the bug</Label>
                  <Textarea
                    value={bug}
                    onChange={(e) => setBug(e.target.value)}
                    placeholder="What went wrong? Steps to reproduce…"
                    rows={5}
                  />
                </div>
              )}

              {tab === "feature" && (
                <div className="space-y-2">
                  <Label className="text-sm">Feature request</Label>
                  <Textarea
                    value={feature}
                    onChange={(e) => setFeature(e.target.value)}
                    placeholder="What would make CA Study Hub better for you?"
                    rows={5}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 bg-card">
              <Button onClick={submit} className="w-full gap-2" size="sm" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {submitting ? "Submitting..." : "Submit feedback"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleFabClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/30 transition-shadow h-12 w-12 hover:shadow-xl text-accent-foreground`}
        aria-label="Give feedback"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquarePlus size={20} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FeedbackWidget;
