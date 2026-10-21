"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  BarChart2,
  Sparkles,
  BookMarked,
  Zap,
  CheckCircle2,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudyPlanningPreview } from "./StudyPlanningPreview";
import { DailySummaryPreview } from "./DailySummaryPreview";
import { FlashcardRequestPreview } from "./FlashcardRequestPreview";
import { NotesBookmarksPreview } from "./NotesBookmarksPreview";
import { McqPerformancePreview } from "./McqPerformancePreview";

interface ProFeaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
}

const features = [
  {
    id: "planning",
    num: "1",
    title: "Study Planning",
    shortTitle: "Study Planning",
    icon: CalendarRange,
    badge: "ICAI Aligned",
    points: [
      "Enter your exam date and we’ll divide the days left across your subjects, so you know how much time each one gets.",
      "Track your progress topic by topic against ICAI’s module structure, and see at a glance what’s done and what’s pending.",
    ],
    component: <StudyPlanningPreview />,
  },
  {
    id: "summary",
    num: "2",
    title: "Daily Summary & Statistics",
    shortTitle: "Daily Summary",
    icon: BarChart2,
    badge: "Analytics",
    points: [
      "Track your streak, study sessions and hours logged, all in one place.",
      "See your complete history broken down subject-wise, so you know exactly where your time is going.",
    ],
    component: <DailySummaryPreview />,
  },
  {
    id: "flashcards",
    num: "3",
    title: "Custom Flashcard Requests",
    shortTitle: "Flashcards",
    icon: Sparkles,
    badge: "Active Recall",
    points: [
      "Can’t find flashcards for a chapter or concept? Request it and we’ll create a set for you.",
      "Revise exactly what you need, made for the topics you find toughest.",
    ],
    component: <FlashcardRequestPreview />,
  },
  {
    id: "notes",
    num: "4",
    title: "Notes & Bookmarks",
    shortTitle: "Notes & Bookmarks",
    icon: BookMarked,
    badge: "Organized",
    points: [
      "Jot down quick notes while you study: a tricky provision, a formula, or a doubt to revisit later.",
      "Save and organise everything in one place so nothing slips through before the exam.",
    ],
    component: <NotesBookmarksPreview />,
  },
  {
    id: "mcq",
    num: "5",
    title: "MCQ Performance",
    shortTitle: "MCQ Analytics",
    icon: Zap,
    badge: "Why-Rationales",
    points: [
      "Get a clear explanation for every answer, so you understand why an option is right and not just which one it is.",
      "See your full history of tests taken and scores, and watch your progress build attempt after attempt.",
    ],
    component: <McqPerformancePreview />,
  },
];

export const ProFeaturesModal: React.FC<ProFeaturesModalProps> = ({
  open,
  onOpenChange,
  onUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<string>("planning");

  const currentFeature = features.find((f) => f.id === activeTab) || features[0];

  const handleUpgradeClick = () => {
    onOpenChange(false);
    if (onUpgrade) {
      setTimeout(() => {
        onUpgrade();
      }, 150);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent text-xs">
              <Crown className="mr-1 h-3 w-3" /> Pro Access
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground mt-1.5">
            Features Available With Pro
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Explore the 5 core tools built to streamline your CA preparation. Click through each feature to see how it works.
          </DialogDescription>

          {/* Horizontal scrollable tab buttons */}
          <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 -mx-1 px-1 scrollbar-none">
            {features.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeTab === feat.id;
              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => setActiveTab(feat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{feat.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Feature Content Body */}
        <ScrollArea className="max-h-[60vh] p-5 sm:p-6">
          <div className="space-y-4">
            {/* Feature title bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-[11px] font-bold text-accent">
                  {currentFeature.num}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {currentFeature.title}
                </h3>
              </div>
              <Badge variant="outline" className="border-accent/30 text-[10px] text-accent">
                {currentFeature.badge}
              </Badge>
            </div>

            {/* Bullets with user-specified copy */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
              {currentFeature.points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="leading-relaxed">{pt}</span>
                </div>
              ))}
            </div>

            {/* Small UI Preview Component */}
            {/* <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Live Feature Preview
              </p>
              {currentFeature.component}
            </div> */}
          </div>
        </ScrollArea>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Included with all monthly & annual Pro plans.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleUpgradeClick}
              className="flex-1 sm:flex-none bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
