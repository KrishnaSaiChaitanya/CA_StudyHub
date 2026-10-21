"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  BarChart2,
  Sparkles,
  BookMarked,
  CheckCircle,
  Crown,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudyPlanningPreview } from "./StudyPlanningPreview";
import { DailySummaryPreview } from "./DailySummaryPreview";
import { FlashcardRequestPreview } from "./FlashcardRequestPreview";
import { NotesBookmarksPreview } from "./NotesBookmarksPreview";
import { McqPerformancePreview } from "./McqPerformancePreview";

interface ProFeaturesShowcaseProps {
  onUpgradeClick?: () => void;
}

export const ProFeaturesShowcase: React.FC<ProFeaturesShowcaseProps> = ({ onUpgradeClick }) => {
  return (
    <section className="relative mt-20 pt-10 border-t border-border">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-72 w-full max-w-5xl rounded-full bg-accent/5 blur-3xl -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-4 shadow-sm"
        >
          <Crown className="h-3.5 w-3.5" />
          Pro Member Experience
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          Everything You Unlock With Pro
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3 text-base text-muted-foreground leading-relaxed"
        >
          Engineered specifically for CA aspirants. From strategic day-by-day exam schedules
          to custom flashcards and deep MCQ rationales, study smarter and clear on your first attempt.
        </motion.p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 max-w-6xl mx-auto">
        {/* =========================================================
            1. STUDY PLANNING (Col span: 12 on mobile, 7 on desktop)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="col-span-12 lg:col-span-7 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-accent/50 hover:shadow-card-hover group relative overflow-hidden backdrop-blur-sm"
        >
          {/* Subtle top corner gradient */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Feature 01</span>
                  <h3 className="text-xl font-bold text-foreground">Study Planning</h3>
                </div>
              </div>
              <Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent text-[11px] font-medium">
                ICAI Aligned
              </Badge>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Enter your exam date and we’ll divide the days left across your subjects, so you know how much time each one gets.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Track your progress topic by topic against ICAI’s module structure, and see at a glance what’s done and what’s pending.
                </span>
              </li>
            </ul>
          </div>

          {/* Interactive Preview Widget */}
          <div className="mt-2">
            <StudyPlanningPreview />
          </div>
        </motion.div>

        {/* =========================================================
            2. DAILY SUMMARY & STATISTICS (Col span: 12 on mobile, 5 on desktop)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="col-span-12 lg:col-span-5 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-accent/50 hover:shadow-card-hover group relative overflow-hidden backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Feature 02</span>
                  <h3 className="text-xl font-bold text-foreground">Daily Summary & Statistics</h3>
                </div>
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground text-[11px] font-medium">
                Analytics
              </Badge>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Track your streak, study sessions and hours logged, all in one place.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  See your complete history broken down subject-wise, so you know exactly where your time is going.
                </span>
              </li>
            </ul>
          </div>

          {/* Interactive Preview Widget */}
          <div className="mt-2">
            <DailySummaryPreview />
          </div>
        </motion.div>

        {/* =========================================================
            3. CUSTOM FLASHCARD REQUESTS (Col span: 12 on mobile, 4 on desktop)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-accent/50 hover:shadow-card-hover group relative overflow-hidden backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Feature 03</span>
                  <h3 className="text-lg font-bold text-foreground">Custom Flashcard Requests</h3>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Can’t find flashcards for a chapter or concept? Request it and we’ll create a set for you.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Revise exactly what you need, made for the topics you find toughest.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-2">
            <FlashcardRequestPreview />
          </div>
        </motion.div>

        {/* =========================================================
            4. NOTES & BOOKMARKS (Col span: 12 on mobile, 4 on desktop)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-accent/50 hover:shadow-card-hover group relative overflow-hidden backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Feature 04</span>
                  <h3 className="text-lg font-bold text-foreground">Notes & Bookmarks</h3>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Jot down quick notes while you study: a tricky provision, a formula, or a doubt to revisit later.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Save and organise everything in one place so nothing slips through before the exam.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-2">
            <NotesBookmarksPreview />
          </div>
        </motion.div>

        {/* =========================================================
            5. MCQ PERFORMANCE (Col span: 12 on mobile, 4 on desktop)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="col-span-12 md:col-span-12 lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-accent/50 hover:shadow-card-hover group relative overflow-hidden backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Feature 05</span>
                  <h3 className="text-lg font-bold text-foreground">MCQ Performance</h3>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Get a clear explanation for every answer, so you understand why an option is right and not just which one it is.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-foreground/90">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  See your full history of tests taken and scores, and watch your progress build attempt after attempt.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-2">
            <McqPerformancePreview />
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-12 max-w-4xl mx-auto rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-accent/10 p-6 sm:p-8 text-center shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h4 className="text-lg font-bold text-foreground">Ready to take control of your CA journey?</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Join hundreds of CA aspirants studying with structure, clarity, and confidence.
            </p>
          </div>

          {onUpgradeClick && (
            <Button
              onClick={onUpgradeClick}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20 font-semibold px-6 shrink-0 flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
};
