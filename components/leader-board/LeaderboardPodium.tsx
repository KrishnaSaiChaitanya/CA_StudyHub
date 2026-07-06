"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeaderboardEntry } from "@/utils/supabase/leaderboard";

interface LeaderboardPodiumProps {
  top3: LeaderboardEntry[];
}

const badgeColor: Record<string, string> = {
  Diamond: "bg-accent/20 text-accent border-accent/30",
  Platinum: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  Gold: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  Silver: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
  Bronze: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-850",
  "Rising Star": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
};

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function LeaderboardPodium({ top3 }: LeaderboardPodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div className="mb-14 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
      
      {/* Rank 2 (Silver) */}
      {top3[1] && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-900/10 p-6 shadow-md order-2 sm:order-1"
        >
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-slate-300">
              <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-lg font-bold text-slate-700 dark:text-slate-300">
                {getInitials(top3[1].full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-slate-300 bg-card px-2.5 py-0.5 text-xs font-black shadow">
              #2
            </div>
          </div>
          <h3 className="mt-5 text-sm font-bold text-card-foreground text-center line-clamp-1">
            {top3[1].full_name || "Anonymous"}
          </h3>
          <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Silver"]}`}>
            Silver
          </Badge>
          <p className="mt-3.5 text-2xl font-black text-slate-700 dark:text-slate-300">
            {top3[1].total_xp.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
          
          <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-1.5 border w-full justify-around">
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[1].streak}d</p>
              <p className="scale-90 opacity-80">Streak</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[1].test_attempts_count}</p>
              <p className="scale-90 opacity-80">Tests</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">
                {top3[1].forum_posts_count + top3[1].forum_replies_count}
              </p>
              <p className="scale-90 opacity-80">Forum</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rank 1 (Gold/Diamond) */}
      {top3[0] && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center rounded-3xl border-2 border-accent/40 bg-gradient-to-b from-amber-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-950/5 p-8 shadow-2xl order-1 sm:order-2 scale-105 sm:-mt-6 relative"
        >
          <div className="absolute -top-6 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-lg border border-yellow-300 animate-bounce">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-yellow-400 ring-offset-2">
              <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900/30 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {getInitials(top3[0].full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-yellow-400 bg-yellow-400 text-white px-3 py-0.5 text-xs font-black shadow">
              #1
            </div>
          </div>
          <h3 className="mt-5 text-base font-black text-card-foreground text-center line-clamp-1">
            {top3[0].full_name || "Anonymous"}
          </h3>
          <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Diamond"]}`}>
            Diamond
          </Badge>
          <p className="mt-3.5 text-3xl font-black text-accent">
            {top3[0].total_xp.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
          
          <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-2 border w-full justify-around">
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[0].streak}d</p>
              <p className="scale-90 opacity-80">Streak</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[0].test_attempts_count}</p>
              <p className="scale-90 opacity-80">Tests</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">
                {top3[0].forum_posts_count + top3[0].forum_replies_count}
              </p>
              <p className="scale-90 opacity-80">Forum</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rank 3 (Bronze) */}
      {top3[2] && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center rounded-2xl border border-border bg-gradient-to-b from-amber-50/50 to-orange-100/30 dark:from-orange-950/10 dark:to-orange-950/5 p-6 shadow-md order-3"
        >
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-orange-400">
              <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-lg font-bold text-orange-700 dark:text-orange-300">
                {getInitials(top3[2].full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-orange-400 bg-card px-2.5 py-0.5 text-xs font-black shadow">
              #3
            </div>
          </div>
          <h3 className="mt-5 text-sm font-bold text-card-foreground text-center line-clamp-1">
            {top3[2].full_name || "Anonymous"}
          </h3>
          <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Bronze"]}`}>
            Bronze
          </Badge>
          <p className="mt-3.5 text-2xl font-black text-orange-655">
            {top3[2].total_xp.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
          
          <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-1.5 border w-full justify-around">
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[2].streak}d</p>
              <p className="scale-90 opacity-80">Streak</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{top3[2].test_attempts_count}</p>
              <p className="scale-90 opacity-80">Tests</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">
                {top3[2].forum_posts_count + top3[2].forum_replies_count}
              </p>
              <p className="scale-90 opacity-80">Forum</p>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
