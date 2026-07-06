"use client";

import { motion } from "framer-motion";
import { Flame, Target, MessageSquare } from "lucide-react";

export default function MotivationBanner() {
  return (
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
  );
}
