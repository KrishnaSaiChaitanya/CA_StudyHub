import type { SupabaseClient } from "@supabase/supabase-js";

const getIsoDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => getIsoDateString(new Date());

const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getIsoDateString(yesterday);
};

export const syncUserActivity = async (supabase: SupabaseClient<any, "public", any>) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("current_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load user profile for activity sync:", profileError.message);
      return null;
    }

    const currentStreak = profileData?.current_streak || 0;
    const lastActiveDate = profileData?.last_active_date || null;

    if (lastActiveDate === today) {
      return {
        current_streak: currentStreak,
        last_active_date: today,
      };
    }

    const nextStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          current_streak: nextStreak,
          last_active_date: today,
        },
        { onConflict: "id" }
      );

    if (updateError) {
      console.error("Failed to sync user activity:", updateError.message);
      return null;
    }

    return {
      current_streak: nextStreak,
      last_active_date: today,
    };
  } catch (error) {
    console.error("Error inside syncUserActivity (likely offline):", error);
    return null;
  }
};
