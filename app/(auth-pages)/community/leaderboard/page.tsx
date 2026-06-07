"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  getLeaderboardRankings, 
  getLeaderboardConfig,
  LeaderboardEntry,
  LeaderboardConfig 
} from "@/utils/supabase/leaderboard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Flame, Target, MessageSquare, Info, 
  Loader2, Crown, Medal, Award, Star, Zap, X, HelpCircle, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import LeaderboardRulesModal from "@/components/leader-board/LeaderBoardModal";

// Custom Confetti Component using Framer Motion
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
}

const particleColors = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#14B8A6"];

const ConfettiEffect = () => {
  const particles: ConfettiParticle[] = Array.from({ length: 90 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * -110 - 40,
    color: particleColors[Math.floor(Math.random() * particleColors.length)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.4,
    duration: Math.random() * 2 + 1.8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-end justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 50, scale: 0.2, rotate: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: `${p.x}vw`, 
            y: `${p.y}vh`, 
            scale: [0.2, 1, 1, 0.4],
            rotate: p.rotate * 3
          }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : p.id % 3 === 1 ? "0%" : "30%",
          }}
        />
      ))}
    </div>
  );
};

export default function LeaderboardPage() {
  const supabase = createClient();
  
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [configs, setConfigs] = useState<LeaderboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rankIncreased, setRankIncreased] = useState(false);

  // Helper to extract initials
  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to assign badges
  const getBadge = (rank: number): string => {
    if (rank === 1) return "Diamond";
    if (rank === 2) return "Platinum";
    if (rank <= 5) return "Gold";
    if (rank <= 10) return "Silver";
    if (rank <= 20) return "Bronze";
    return "Rising Star";
  };

  const badgeColor: Record<string, string> = {
    Diamond: "bg-accent/20 text-accent border-accent/30",
    Platinum: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    Gold: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    Silver: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
    Bronze: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-850",
    "Rising Star": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 animate-bounce" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-550" />;
    return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
  };

  const fetchLeaderboardData = async () => {
    try {
      const [rankingsData, configsData, authData] = await Promise.all([
        getLeaderboardRankings(supabase),
        getLeaderboardConfig(supabase),
        supabase.auth.getUser()
      ]);

      setRankings(rankingsData);
      setConfigs(configsData);

      const user = authData.data.user;
      if (user) {
        setCurrentUser(user);
        
        // Find user rank
        const userEntry = rankingsData.find(r => r.user_id === user.id);
        if (userEntry) {
          const currentRank = userEntry.rank;
          const prevRankStr = localStorage.getItem("studyhub_user_rank");
          
          if (prevRankStr) {
            const prevRank = parseInt(prevRankStr, 10);
            // Lower numeric value is a higher/better rank
            if (currentRank < prevRank) {
              setRankIncreased(true);
              setShowConfetti(true);
              toast.success(`Congratulations! You climbed from #${prevRank} to #${currentRank} on the leaderboard! 🚀`);
              
              // Reset animation states after a few seconds
              setTimeout(() => {
                setRankIncreased(false);
              }, 4000);
              setTimeout(() => {
                setShowConfetti(false);
              }, 6000);
            }
          }
          localStorage.setItem("studyhub_user_rank", currentRank.toString());
        }
      }

      // Check for first time onboarding view
      const onboarded = localStorage.getItem("studyhub_leaderboard_onboarded");
      if (!onboarded) {
        setRulesOpen(true);
        localStorage.setItem("studyhub_leaderboard_onboarded", "true");
      }

    } catch (error) {
      toast.error("Failed to load rankings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Find current user rank stats
  const loggedInEntry = currentUser ? rankings.find(r => r.user_id === currentUser.id) : null;
  const userRank = loggedInEntry ? loggedInEntry.rank : rankings.length + 1;
  const userScore = loggedInEntry ? loggedInEntry.total_xp : 0;
  const userStreak = loggedInEntry ? loggedInEntry.streak : 0;
  const percentile = rankings.length > 0 ? Math.round(((rankings.length - userRank + 1) / rankings.length) * 100) : 0;

  // Split rankings for Podium (top 3) and remaining rows
  const top3 = rankings.slice(0, 3);
  const restUsers = rankings.slice(3);

  const getWeightValue = (key: string) => {
    return configs.find(c => c.key === key)?.weight ?? 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
     

      {/* Confetti Celebration */}
      {showConfetti && <ConfettiEffect />}

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
        <div className="container relative z-10 flex flex-col items-center text-center">
         
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/25 border border-accent/35 shadow-inner"
          >
            <Trophy className="h-8 w-8 text-accent animate-pulse" />
          </motion.div>
          <Link href="/community" className=" md:left-8 flex items-center gap-1.5 text-xs text-primary-foreground/50 my-2 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Community
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            Study <span className="text-gradient-blue">Leaderboard</span>
          </motion.h1>
         
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 max-w-md text-sm text-primary-foreground/75"
          >
            Compete, stay consistent, and excel. Review where you stand amongst peers in CA preparation.
          </motion.p>
        </div>
      </section>

      {loading ? (
        <div className="container py-20 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground font-semibold">Gathering scores and rankings...</p>
        </div>
      ) : (
        <>
          {/* Your Stats Banner */}
          <section className="container -mt-10 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              // 3D glow transition if rank increased
              // animate={rankIncreased ? {
              //   scale: [1, 1.05, 0.98, 1.02, 1],
              //   rotateY: [0, 360, 0],
              //   boxShadow: [
              //     "0px 4px 20px rgba(0, 0, 0, 0.05)",
              //     "0px 10px 40px rgba(245, 158, 11, 0.5)",
              //     "0px 4px 20px rgba(0, 0, 0, 0.05)"
              //   ]
              // } : {}}
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
                      {loggedInEntry ? `#${userRank}` : "Unranked"}
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
                    onClick={() => setRulesOpen(true)}
                    className="gap-1.5 font-bold border-accent/30 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent transition-colors"
                  >
                    <Info className="h-4 w-4" /> Scoring Rules
                  </Button>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Leaderboard Table / Podium */}
          <section className="container py-12 mt-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Podium for top 3 */}
              {top3.length > 0 && (
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
                      <h3 className="mt-5 text-sm font-bold text-card-foreground text-center line-clamp-1">{top3[1].full_name || "Anonymous"}</h3>
                      <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Silver"]}`}>
                        Silver
                      </Badge>
                      <p className="mt-3.5 text-2xl font-black text-slate-700 dark:text-slate-300">{top3[1].total_xp.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
                      
                      <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-1.5 border w-full justify-around">
                        <div className="text-center"><p className="font-bold text-foreground">{top3[1].streak}d</p><p className="scale-90 opacity-80">Streak</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[1].test_attempts_count}</p><p className="scale-90 opacity-80">Tests</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[1].forum_posts_count + top3[1].forum_replies_count}</p><p className="scale-90 opacity-80">Forum</p></div>
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
                      <h3 className="mt-5 text-base font-black text-card-foreground text-center line-clamp-1">{top3[0].full_name || "Anonymous"}</h3>
                      <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Diamond"]}`}>
                        Diamond
                      </Badge>
                      <p className="mt-3.5 text-3xl font-black text-accent">{top3[0].total_xp.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
                      
                      <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-2 border w-full justify-around">
                        <div className="text-center"><p className="font-bold text-foreground">{top3[0].streak}d</p><p className="scale-90 opacity-80">Streak</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[0].test_attempts_count}</p><p className="scale-90 opacity-80">Tests</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[0].forum_posts_count + top3[0].forum_replies_count}</p><p className="scale-90 opacity-80">Forum</p></div>
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
                      <h3 className="mt-5 text-sm font-bold text-card-foreground text-center line-clamp-1">{top3[2].full_name || "Anonymous"}</h3>
                      <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor["Bronze"]}`}>
                        Bronze
                      </Badge>
                      <p className="mt-3.5 text-2xl font-black text-orange-655">{top3[2].total_xp.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">XP Points</p>
                      
                      <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-1.5 border w-full justify-around">
                        <div className="text-center"><p className="font-bold text-foreground">{top3[2].streak}d</p><p className="scale-90 opacity-80">Streak</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[2].test_attempts_count}</p><p className="scale-90 opacity-80">Tests</p></div>
                        <div className="text-center"><p className="font-bold text-foreground">{top3[2].forum_posts_count + top3[2].forum_replies_count}</p><p className="scale-90 opacity-80">Forum</p></div>
                      </div>
                    </motion.div>
                  )}

                </div>
              )}

              {/* Leaderboard Table headers & Remaining rankings */}
              <div className="space-y-3">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" /> Leaderboard Rankings
                </h2>
                
                {rankings.length === 0 ? (
                  <Card className="p-12 text-center border border-dashed">
                    <Trophy className="h-10 w-10 text-muted-foreground mx-auto opacity-30" />
                    <p className="text-sm text-muted-foreground mt-4 font-semibold">No participants ranked yet. Start studying to climb the ranks!</p>
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
                          transition={{ delay: i * 0.03 }}
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
                                <p className="font-bold text-foreground text-xs">{user.forum_posts_count + user.forum_replies_count}</p>
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
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Motivation Banner / Rules Breakdown */}
          <section className="container pb-16">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl bg-primary/5 border border-primary/10 p-8 text-center"
              >
                <Flame className="mx-auto h-8 w-8 text-accent animate-pulse" />
                <h2 className="mt-3 text-xl font-black text-foreground">Earn XP & Level Up Your Preparation</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Consistent actions build study habits. Here is how you accumulate points.
                </p>
                <div className="mx-auto mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="rounded-xl bg-card border p-4 shadow-sm hover:shadow-md transition-shadow">
                    <Target className="mx-auto h-5 w-5 text-accent" />
                    <p className="mt-3.5 text-sm font-bold text-foreground">Ace Mock Tests</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Complete tests to get completion XP + bonus points for every correct answer.
                    </p>
                  </div>
                  <div className="rounded-xl bg-card border p-4 shadow-sm hover:shadow-md transition-shadow">
                    <Flame className="mx-auto h-5 w-5 text-orange-550" />
                    <p className="mt-3.5 text-sm font-bold text-foreground">Study Daily</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Log in and study consecutive days to boost streak points.
                    </p>
                  </div>
                  <div className="rounded-xl bg-card border p-4 shadow-sm hover:shadow-md transition-shadow">
                    <MessageSquare className="mx-auto h-5 w-5 text-blue-500" />
                    <p className="mt-3.5 text-sm font-bold text-foreground">Be Active</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Start discussion forum posts and write replies to support peers.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      )}

      {/* Rules & Info Dialog Modal */}
      <AnimatePresence>
        {rulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRulesOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Modal Box */}
            {/* <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-black text-foreground">Leaderboard Rules & XP</h3>
                </div>
                <button 
                  onClick={() => setRulesOpen(false)} 
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Welcome to the **Study Leaderboard**! Earn XP (Experience Points) automatically as you complete study activities on CAStudyHub. Ranks are recalculated dynamically.
                </p>

                <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wider mt-4">Current XP Points Rules</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 rounded-lg border bg-secondary/35 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-orange-550" /> Study Streak (per day)</span>
                    <span className="text-foreground">+{getWeightValue("streak_weight")} XP</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg border bg-secondary/35 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-500" /> Mock Test completed (per attempt)</span>
                    <span className="text-foreground">+{getWeightValue("test_attempt_weight")} XP</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg border bg-secondary/35 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><Target className="h-4 w-4 text-emerald-500" /> Correct MCQs in tests (per answer)</span>
                    <span className="text-foreground">+{getWeightValue("test_score_weight")} XP</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg border bg-secondary/35 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-blue-500" /> Forum thread created (per post)</span>
                    <span className="text-foreground">+{getWeightValue("forum_post_weight")} XP</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg border bg-secondary/35 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-indigo-500" /> Forum comment / reply (per post)</span>
                    <span className="text-foreground">+{getWeightValue("forum_reply_weight")} XP</span>
                  </div>
                </div>

                <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-accent text-xs font-medium flex gap-2.5 mt-4">
                  <Star className="h-5 w-5 shrink-0" />
                  <p>
                    <strong>Formula:</strong> Streak XP + Test XP + Forum XP. The weights are configured by the admin panel and apply immediately to all participants.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t pt-4">
                <Button onClick={() => setRulesOpen(false)} className="bg-primary text-primary-foreground font-semibold">
                  Get Started!
                </Button>
              </div>
            </motion.div> */}

            <LeaderboardRulesModal setRulesOpen={setRulesOpen} getWeightValue={getWeightValue} />
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
