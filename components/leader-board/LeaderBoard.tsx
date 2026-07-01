import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, MessageCircle, Target, Clock, Crown, Medal, Award, TrendingUp, Star, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface LeaderboardUser {
  rank: number;
  name: string;
  initials: string;
  score: number;
  streak: number;
  badge: string;
  trend: "up" | "down" | "same";
  trendValue: number;
}

const categories = [
  { key: "overall", label: "Overall", icon: Trophy },
  { key: "mock", label: "Mock Tests", icon: Target },
  { key: "contributions", label: "Contributions", icon: BookOpen },
  { key: "streaks", label: "Study Streaks", icon: Flame },
  { key: "hours", label: "Study Hours", icon: Clock },
  { key: "forums", label: "Forums", icon: MessageCircle },
];

const generateUsers = (category: string): LeaderboardUser[] => {
  const names = [
    { name: "Aarav Sharma", initials: "AS" },
    { name: "Priya Patel", initials: "PP" },
    { name: "Rohan Gupta", initials: "RG" },
    { name: "Sneha Reddy", initials: "SR" },
    { name: "Vikram Singh", initials: "VS" },
    { name: "Ananya Iyer", initials: "AI" },
    { name: "Karthik Nair", initials: "KN" },
    { name: "Divya Joshi", initials: "DJ" },
    { name: "Arjun Mehta", initials: "AM" },
    { name: "Meera Krishnan", initials: "MK" },
    { name: "Rahul Verma", initials: "RV" },
    { name: "Pooja Agarwal", initials: "PA" },
    { name: "Siddharth Das", initials: "SD" },
    { name: "Kavya Menon", initials: "KM" },
    { name: "Aditya Rao", initials: "AR" },
  ];

  const badges = ["Diamond", "Platinum", "Gold", "Gold", "Silver", "Silver", "Silver", "Bronze", "Bronze", "Bronze", "Bronze", "Rising", "Rising", "Rising", "Rising"];
  const baseScores: Record<string, number[]> = {
    overall: [9850, 9420, 9100, 8740, 8390, 8050, 7720, 7400, 7100, 6800, 6520, 6200, 5900, 5650, 5400],
    mock: [98, 96, 94, 91, 89, 87, 85, 83, 81, 79, 77, 75, 73, 71, 69],
    contributions: [245, 218, 192, 170, 148, 130, 115, 98, 84, 72, 60, 50, 42, 35, 28],
    streaks: [120, 98, 85, 72, 65, 58, 52, 45, 38, 32, 28, 24, 20, 17, 14],
    hours: [840, 780, 720, 660, 610, 560, 510, 470, 430, 390, 355, 320, 290, 260, 235],
    forums: [520, 470, 425, 380, 340, 305, 270, 240, 215, 190, 168, 148, 130, 115, 100],
  };

  return names.map((n, i) => ({
    rank: i + 1,
    name: n.name,
    initials: n.initials,
    score: baseScores[category]?.[i] ?? 100 - i * 5,
    streak: Math.max(120 - i * 8, 5),
    badge: badges[i],
    trend: i < 3 ? "up" : i < 8 ? "same" : "down",
    trendValue: i < 3 ? Math.floor(Math.random() * 3) + 1 : i >= 8 ? Math.floor(Math.random() * 2) + 1 : 0,
  }));
};

const scoreLabel: Record<string, string> = {
  overall: "XP",
  mock: "Avg %",
  contributions: "Resources",
  streaks: "Days",
  hours: "Hours",
  forums: "Posts",
};

const badgeColor: Record<string, string> = {
  Diamond: "bg-accent/20 text-accent border-accent/30",
  Platinum: "bg-purple-100 text-purple-700 border-purple-200",
  Gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Silver: "bg-gray-100 text-gray-600 border-gray-200",
  Bronze: "bg-orange-100 text-orange-700 border-orange-200",
  Rising: "bg-green-100 text-green-700 border-green-200",
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
};

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("overall");
  const users = generateUsers(activeTab);
  const top3 = users.slice(0, 3);

  const yourRank = { rank: 42, score: 3200, streak: 12, percentile: 78 };

  return (
    <div className="min-h-screen bg-background">
   
      <section className="bg-primary py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-primary-foreground">
              <span className="text-gradient-blue">Leaderboard</span>
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/50">Compete, climb, and celebrate. Every hour of study counts.</p>
          </motion.div>
        </div>
      </section>

      {/* Your Stats Banner */}
      <section className="container -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-accent/20 bg-card p-5 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Rank</p>
                <p className="text-xl font-bold text-card-foreground">#{yourRank.rank}</p>
              </div>
            </div>
            <div className="flex gap-8">
              {[
                { label: "Total XP", value: yourRank.score.toLocaleString() },
                { label: "Study Streak", value: `${yourRank.streak} days` },
                { label: "Top Percentile", value: `${yourRank.percentile}%` },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-base font-semibold text-card-foreground">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-accent">Keep going! 8 spots to next tier</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Tabs & Table */}
      <section className="container py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 flex h-auto flex-wrap gap-1 bg-secondary p-1.5">
            {categories.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className="flex items-center gap-1.5 text-xs">
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.key} value={cat.key}>
              {/* Top 3 Podium */}
              <div className="mb-10 grid grid-cols-3 gap-4">
                {[top3[1], top3[0], top3[2]].map((user, idx) => {
                  const podiumOrder = [2, 1, 3];
                  const sizes = ["h-20 w-20", "h-24 w-24", "h-20 w-20"];
                  const ringColors = ["ring-gray-300", "ring-yellow-400", "ring-orange-400"];
                  const bgGradients = [
                    "from-gray-50 to-gray-100 border-gray-200",
                    "from-yellow-50 to-amber-50 border-yellow-200",
                    "from-orange-50 to-amber-50 border-orange-200",
                  ];
                  return (
                    <motion.div
                      key={user.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex flex-col items-center rounded-2xl border bg-gradient-to-b p-6 ${bgGradients[idx]} ${idx === 1 ? "-mt-4 shadow-lg" : "mt-4 shadow-card"}`}
                    >
                      <div className="relative">
                        <Avatar className={`${sizes[idx]} ring-4 ${ringColors[idx]}`}>
                          <AvatarFallback className="bg-accent/10 text-lg font-bold text-accent">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card px-2 py-0.5 text-xs font-bold shadow">
                          #{podiumOrder[idx]}
                        </div>
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-card-foreground">{user.name}</h3>
                      <Badge variant="outline" className={`mt-1.5 text-[10px] ${badgeColor[user.badge]}`}>
                        {user.badge}
                      </Badge>
                      <p className="mt-3 text-2xl font-bold text-accent">{user.score.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{scoreLabel[activeTab]}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>↑ {user.trendValue} spots</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Remaining Rankings */}
              <div className="space-y-2">
                {users.slice(3).map((user, i) => (
                  <motion.div
                    key={user.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.03 }}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center">
                      {rankIcon(user.rank)}
                    </div>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${badgeColor[user.badge]}`}>
                          {user.badge}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Flame className="h-3 w-3 text-orange-400" /> {user.streak}d streak
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-card-foreground">{user.score.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{scoreLabel[activeTab]}</p>
                    </div>
                    <div className="w-12 text-right">
                      {user.trend === "up" && (
                        <span className="text-[10px] font-medium text-green-600">↑ {user.trendValue}</span>
                      )}
                      {user.trend === "down" && (
                        <span className="text-[10px] font-medium text-red-500">↓ {user.trendValue}</span>
                      )}
                      {user.trend === "same" && (
                        <span className="text-[10px] font-medium text-muted-foreground">—</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Motivation Banner */}
      <section className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-primary p-8 text-center"
        >
          <Flame className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-3 text-xl font-bold text-primary-foreground">How to Climb the Ranks</h2>
          <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: Target, title: "Ace Mock Tests", desc: "Score high on practice exams to earn XP" },
              { icon: BookOpen, title: "Share Resources", desc: "Upload notes & earn contribution points" },
              { icon: Flame, title: "Stay Consistent", desc: "Build study streaks for bonus multipliers" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-primary-foreground/5 p-4">
                <item.icon className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-2 text-sm font-semibold text-primary-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-primary-foreground/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      
    </div>
  );
};

export default Leaderboard;
