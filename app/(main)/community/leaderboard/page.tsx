"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  getLeaderboardRankings, 
  getLeaderboardConfig,
  LeaderboardEntry,
  LeaderboardConfig 
} from "@/utils/supabase/leaderboard";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import LeaderboardRulesModal from "@/components/leader-board/LeaderBoardModal";
import ConfettiEffect from "@/components/leader-board/ConfettiEffect";
import LeaderboardHero from "@/components/leader-board/LeaderboardHero";
import StatsBanner from "@/components/leader-board/StatsBanner";
import LeaderboardPodium from "@/components/leader-board/LeaderboardPodium";
import LeaderboardTable from "@/components/leader-board/LeaderboardTable";
import MotivationBanner from "@/components/leader-board/MotivationBanner";

export default function LeaderboardPage() {
  const supabase = createClient();
  
  // Data states
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [configs, setConfigs] = useState<LeaderboardConfig[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [totalRankedCount, setTotalRankedCount] = useState<number>(0);
  
  // Pagination / loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Animation / Modal states
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rankIncreased, setRankIncreased] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const authData = await supabase.auth.getUser();
      const user = authData.data?.user;

      const [rankingsData, configsData, countResult] = await Promise.all([
        getLeaderboardRankings(supabase, 0, 29),
        getLeaderboardConfig(supabase),
        supabase.from("user_leaderboard").select("*", { count: "exact", head: true })
      ]);

      setConfigs(configsData);
      setRankings(rankingsData);
      setTotalRankedCount(countResult.count || 0);

      // Check if there are more items to load
      if (rankingsData.length < 30 || (countResult.count !== null && rankingsData.length >= countResult.count)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (user) {
        setCurrentUser(user);
        
        // Fetch specific entry for logged-in user in case they are not in the first page
        const { data: userEntryData } = await supabase
          .from("user_leaderboard")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userEntryData) {
          const typedEntry = userEntryData as unknown as LeaderboardEntry;
          setCurrentUserEntry(typedEntry);
          const currentRank = typedEntry.rank;
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

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const from = (nextPage - 1) * 30;
      const to = nextPage * 30 - 1;
      
      const newRankings = await getLeaderboardRankings(supabase, from, to);
      
      if (newRankings.length > 0) {
        setRankings(prev => [...prev, ...newRankings]);
        setPage(nextPage);
        
        // If we fetched fewer than 30 items or total list matches/exceeds total ranked count, stop loading more
        if (newRankings.length < 30 || (rankings.length + newRankings.length >= totalRankedCount)) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more rankings.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Compute stats banner values
  const userRank = currentUserEntry ? currentUserEntry.rank : 0;
  const userScore = currentUserEntry ? currentUserEntry.total_xp : 0;
  const userStreak = currentUserEntry ? currentUserEntry.streak : 0;
  const percentile = totalRankedCount > 0 && userRank > 0 
    ? Math.round(((totalRankedCount - userRank + 1) / totalRankedCount) * 100) 
    : 0;

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
      <LeaderboardHero />

      {loading ? (
        <div className="container py-20 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground font-semibold">Gathering scores and rankings...</p>
        </div>
      ) : (
        <>
          {/* Your Stats Banner */}
          <StatsBanner
            userRank={userRank || null}
            userScore={userScore}
            userStreak={userStreak}
            percentile={percentile}
            onOpenRules={() => setRulesOpen(true)}
          />

          {/* Leaderboard Table / Podium */}
          <section className="container py-12 mt-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Podium for top 3 */}
              <LeaderboardPodium top3={top3} />

              {/* Leaderboard Table headers & Remaining rankings */}
              <LeaderboardTable
                restUsers={restUsers}
                hasPodiumItems={top3.length > 0}
                currentUser={currentUser}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
              />

            </div>
          </section>

          {/* Motivation Banner / Rules Breakdown */}
          <MotivationBanner />
        </>
      )}

      {/* Rules & Info Dialog Modal */}
      <AnimatePresence>
        {rulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setRulesOpen(false)}
            />
            <LeaderboardRulesModal setRulesOpen={setRulesOpen} getWeightValue={getWeightValue} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
