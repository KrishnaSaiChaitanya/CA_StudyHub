"use client";

import { motion } from "framer-motion";
import { Zap, Flame, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatsBannerProps {
  userRank: number | null;
  userScore: number;
  userStreak: number;
  percentile: number;
  onOpenRules: () => void;
}

export default function StatsBanner({
  userRank,
  userScore,
  userStreak,
  percentile,
  onOpenRules,
}: StatsBannerProps) {
  return (
    <section className="container -mt-10 relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="rounded-2xl border border-accent/20 bg-card p-4 shadow-xl backdrop-blur"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          
          {/* Rank info */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 border border-accent/20 shadow-inner shrink-0">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your Standings</p>
              <p className="text-2xl font-black text-foreground">
                {userRank ? `#${userRank}` : "Unranked"}
              </p>
            </div>
          </div>

          {/* Score details */}
          <div className="flex flex-wrap items-center gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Score</p>
              <p className="text-lg font-black text-foreground mt-0.5">{userScore.toLocaleString()} XP</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Streak</p>
              <p className="text-lg font-black text-foreground mt-0.5 flex items-center gap-1 justify-center">
                <Flame className="h-4.5 w-4.5 text-orange-550 fill-orange-550/20" /> {userStreak} Days
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Top Percentile</p>
              <p className="text-lg font-black text-foreground mt-0.5">{percentile}%</p>
            </div>
          </div>

          {/* Actions: Rules Button */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenRules}
              className="gap-1.5 font-bold border-accent/30 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent transition-colors"
            >
              <Info className="h-4 w-4" /> Scoring Rules
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
