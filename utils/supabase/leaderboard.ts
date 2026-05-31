import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  streak: number;
  test_attempts_count: number;
  test_correct_answers: number;
  forum_posts_count: number;
  forum_replies_count: number;
  total_xp: number;
  rank: number;
}

export interface LeaderboardConfig {
  key: string;
  weight: number;
  label: string;
  description: string | null;
  updated_at: string;
}

/**
 * Fetches the computed user rankings from the `user_leaderboard` database view.
 * Ordered by rank ascending (1st place first).
 */
export async function getLeaderboardRankings(
  supabase: SupabaseClient<any, "public", any>
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("user_leaderboard")
    .select("*")
    .order("rank", { ascending: true });

  if (error) {
    console.error("Error fetching leaderboard rankings:", error.message);
    throw error;
  }

  return data as unknown as LeaderboardEntry[] || [];
}

/**
 * Fetches all leaderboard weight rules from `leaderboard_config` table.
 */
export async function getLeaderboardConfig(
  supabase: SupabaseClient<any, "public", any>
): Promise<LeaderboardConfig[]> {
  const { data, error } = await supabase
    .from("leaderboard_config")
    .select("*");

  if (error) {
    console.error("Error fetching leaderboard config:", error.message);
    throw error;
  }

  return data as unknown as LeaderboardConfig[] || [];
}

/**
 * Updates weights in the database configuration.
 */
export async function updateLeaderboardConfig(
  supabase: SupabaseClient<any, "public", any>,
  configs: { key: string; weight: number }[]
): Promise<void> {
  const promises = configs.map(config => 
    supabase
      .from("leaderboard_config")
      .update({ weight: config.weight })
      .eq("key", config.key)
  );

  const results = await Promise.all(promises);
  const failed = results.find(r => r.error);
  
  if (failed && failed.error) {
    console.error("Error updating leaderboard configurations:", failed.error.message);
    throw failed.error;
  }
}
