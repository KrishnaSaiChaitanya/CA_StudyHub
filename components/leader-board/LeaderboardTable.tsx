"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Crown, Medal, Award, Flame, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LeaderboardEntry } from "@/utils/supabase/leaderboard";

interface LeaderboardTableProps {
  restUsers: LeaderboardEntry[];
  hasPodiumItems: boolean;
  currentUser: any;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

const badgeColor: Record<string, string> = {
  Diamond: "bg-accent/20 text-accent border-accent/30",
  Platinum: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  Gold: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  Silver: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
  Bronze: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-850",
  "Rising Star": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
};

const getBadge = (rank: number): string => {
  if (rank === 1) return "Diamond";
  if (rank === 2) return "Platinum";
  if (rank <= 5) return "Gold";
  if (rank <= 10) return "Silver";
  if (rank <= 20) return "Bronze";
  return "Rising Star";
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 animate-bounce" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-550" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
};

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function LeaderboardTable({
  restUsers,
  hasPodiumItems,
  currentUser,
  hasMore,
  loadingMore,
  onLoadMore,
}: LeaderboardTableProps) {
  const isEmpty = !hasPodiumItems && restUsers.length === 0;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
        <Star className="h-5 w-5 text-accent fill-accent" /> Leaderboard Rankings
      </h2>
      
      {isEmpty ? (
        <Card className="p-12 text-center border border-dashed">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto opacity-30" />
          <p className="text-sm text-muted-foreground mt-4 font-semibold">
            No participants ranked yet. Start studying to climb the ranks!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {restUsers.map((user, i) => {
            const isMe = currentUser && user.user_id === currentUser.id;
            const badge = getBadge(user.rank);
            
            return (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }} // Cap delay for large lists
                className={`flex flex-col md:flex-row md:items-center gap-4 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:scale-[1.01] ${
                  isMe 
                    ? "bg-accent/10 border-accent shadow-md" 
                    : "bg-card border-border hover:bg-secondary/40"
                }`}
              >
                {/* Rank Icon / Initials */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {rankIcon(user.rank)}
                  </div>
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${isMe ? "text-accent" : "text-foreground"}`}>
                      {user.full_name || "Anonymous"} {isMe && "(You)"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 leading-none font-bold ${badgeColor[badge]}`}>
                        {badge}
                      </Badge>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-semibold">
                        <Flame className="h-3.5 w-3.5 text-orange-550 fill-orange-550/10" /> {user.streak}d streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                  
                  {/* Breakdown labels */}
                  <div className="flex gap-4 md:gap-8 text-right text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <div>
                      <p className="font-bold text-foreground text-xs">{user.test_attempts_count}</p>
                      <p className="scale-90 origin-right">Tests</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs">{user.test_correct_answers}</p>
                      <p className="scale-90 origin-right">Answers</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs">
                        {user.forum_posts_count + user.forum_replies_count}
                      </p>
                      <p className="scale-90 origin-right">Forum</p>
                    </div>
                  </div>

                  {/* Total XP Score */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-foreground">{user.total_xp.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">XP Points</p>
                  </div>

                </div>
              </motion.div>
            );
          })}

          {/* Infinite Scroll Sentinel / Spinner */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center pt-8 pb-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
