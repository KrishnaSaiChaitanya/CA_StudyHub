import { motion, Variants } from "framer-motion";
import { Trophy, X, Flame, Target, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming standard shadcn/ui or similar button

// Move these variants outside the component if possible, or keep them inside
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

export default function LeaderboardRulesModal({ setRulesOpen, getWeightValue } : {setRulesOpen: (value: boolean) => void, getWeightValue: (key: string) => number}) {
  const xpRules = [
    {
      icon: Flame,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      title: "Study Streak",
      subtitle: "Per consecutive day",
      weight: "streak_weight",
    },
    {
      icon: Trophy,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/10",
      title: "Mock Test",
      subtitle: "Per completed attempt",
      weight: "test_attempt_weight",
    },
    {
      icon: Target,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      title: "Correct MCQs",
      subtitle: "Per accurate answer",
      weight: "test_score_weight",
    },
    {
      icon: Sparkles, // Swapped to make it distinct from replies
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      title: "Forum Thread",
      subtitle: "Per new discussion created",
      weight: "forum_post_weight",
    },
    {
      icon: MessageSquare,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-500/10",
      title: "Forum Contribution",
      subtitle: "Per comment or reply",
      weight: "forum_reply_weight",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
      className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
    >
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-accent/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-[80px]" />
      
      {/* Top Header Pattern */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-secondary/40 to-transparent opacity-50" />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 shadow-inner">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-foreground">
                Leaderboard & XP
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Earn points. Climb the ranks.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRulesOpen(false)}
            className="group rounded-full p-2 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* XP Rules List */}
        <div className="mt-2">
          <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-4">
            How to earn XP
          </h4>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {xpRules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-secondary/20 hover:bg-secondary/50 hover:border-border/80 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <div className="relative flex items-center gap-3.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${rule.iconBg}`}>
                      <Icon className={`h-5 w-5 ${rule.iconColor}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {rule.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {rule.subtitle}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-center px-3 py-1.5 rounded-lg bg-background border border-border/50 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-sm font-black text-foreground">
                      +{getWeightValue(rule.weight)} <span className="text-muted-foreground text-xs font-bold">XP</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer Action */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={() => setRulesOpen(false)} 
            className="w-full sm:w-auto px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Got it, let's study!
          </Button>
        </div>
      </div>
    </motion.div>
  );
}