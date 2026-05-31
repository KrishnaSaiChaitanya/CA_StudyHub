"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  getLeaderboardConfig, 
  updateLeaderboardConfig, 
  LeaderboardConfig 
} from "@/utils/supabase/leaderboard";
import { 
  Trophy, Flame, Target, MessageSquare, Save, 
  Loader2, Sparkles, Calculator, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LeaderboardSettings() {
  const supabase = createClient();
  const [configs, setConfigs] = useState<LeaderboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Simulation state
  const [simStreak, setSimStreak] = useState(5);
  const [simAttempts, setSimAttempts] = useState(3);
  const [simCorrect, setSimCorrect] = useState(25);
  const [simPosts, setSimPosts] = useState(2);
  const [simReplies, setSimReplies] = useState(8);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboardConfig(supabase);
      setConfigs(data);
    } catch (error) {
      toast.error("Failed to load leaderboard weights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleWeightChange = (key: string, value: string) => {
    const numericVal = parseFloat(value) || 0;
    setConfigs(prev => 
      prev.map(c => c.key === key ? { ...c, weight: numericVal } : c)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = configs.map(c => ({ key: c.key, weight: c.weight }));
      await updateLeaderboardConfig(supabase, updates);
      toast.success("Leaderboard weights updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Icon mapping helper
  const getIcon = (key: string) => {
    switch (key) {
      case "streak_weight": return <Flame className="h-5 w-5 text-orange-500" />;
      case "test_attempt_weight": return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "test_score_weight": return <Target className="h-5 w-5 text-emerald-500" />;
      case "forum_post_weight": return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "forum_reply_weight": return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      default: return <Sparkles className="h-5 w-5 text-accent" />;
    }
  };

  // Find weight helper
  const getWeight = (key: string) => {
    return configs.find(c => c.key === key)?.weight || 0;
  };

  // Calculate simulated score
  const simulatedXP = Math.round(
    (simStreak * getWeight("streak_weight")) +
    (simAttempts * getWeight("test_attempt_weight")) +
    (simCorrect * getWeight("test_score_weight")) +
    (simPosts * getWeight("forum_post_weight")) +
    (simReplies * getWeight("forum_reply_weight"))
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Leaderboard Rules & Weights
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure how XP points are calculated for students. Changes reflect instantly on the leaderboard rankings.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchConfigs} className="w-fit self-start gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3 font-medium">Loading rules & configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Rules Editor Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" /> Configure Scoring Weights
                </CardTitle>
                <CardDescription>
                  Modify the weight multipliers for each type of student activity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {configs.map((config) => (
                  <div 
                    key={config.key}
                    className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors flex flex-col md:flex-row md:items-center gap-4 justify-between"
                  >
                    <div className="flex items-start gap-3.5 max-w-md">
                      <div className="p-2.5 rounded-lg bg-background border shadow-sm shrink-0 mt-0.5">
                        {getIcon(config.key)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{config.label}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        max="1000"
                        step="any"
                        required
                        value={config.weight}
                        onChange={(e) => handleWeightChange(config.key, e.target.value)}
                        className="w-24 text-center font-bold"
                      />
                      <span className="text-xs text-muted-foreground font-semibold">XP</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Button type="submit" disabled={saving} className="w-full md:w-auto gap-2 bg-primary text-primary-foreground">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configurations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* XP Simulation Tool */}
          <div className="space-y-6">
            <Card className="border border-border/50 bg-gradient-to-b from-card to-secondary/30 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-accent" /> Score Simulator
                </CardTitle>
                <CardDescription>
                  Simulate how much XP a student would earn with these weights.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Streak slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Study Streak</span>
                    <span className="text-accent">{simStreak} Days</span>
                  </div>
                  <input 
                    type="range" min="0" max="60" value={simStreak} 
                    onChange={e => setSimStreak(parseInt(e.target.value))}
                    className="w-full h-1.5 p-0 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Mock tests completed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Mock Exams Completed</span>
                    <span className="text-accent">{simAttempts} Exams</span>
                  </div>
                  <input 
                    type="range" min="0" max="20" value={simAttempts} 
                    onChange={e => setSimAttempts(parseInt(e.target.value))}
                    className="w-full h-1.5 p-0 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Correct answers */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Mock Test Correct Answers</span>
                    <span className="text-accent">{simCorrect} MCQs</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={simCorrect} 
                    onChange={e => setSimCorrect(parseInt(e.target.value))}
                    className="w-full h-1.5 p-0 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Forum posts */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Forum Posts Created</span>
                    <span className="text-accent">{simPosts} Posts</span>
                  </div>
                  <input 
                    type="range" min="0" max="15" value={simPosts} 
                    onChange={e => setSimPosts(parseInt(e.target.value))}
                    className="w-full h-1.5 p-0 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Forum replies */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Forum Replies Posted</span>
                    <span className="text-accent">{simReplies} Replies</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" value={simReplies} 
                    onChange={e => setSimReplies(parseInt(e.target.value))}
                    className="w-full h-1.5 p-0 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Result XP Box */}
                <div className="mt-6 p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Trophy className="w-24 h-24" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase opacity-85">Simulated Total Score</span>
                  <span className="text-4xl font-black mt-2 tracking-tight">{simulatedXP.toLocaleString()}</span>
                  <span className="text-[10px] opacity-75 mt-1 font-medium">XP Points</span>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
