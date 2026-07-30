"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LeaderboardHero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 dark:bg-gradient-to-br from-accent/10 via-card to-card  py-16 text-primary-foreground">
      <div className="container relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/25 border border-accent/35 shadow-inner"
        >
          <Trophy className="h-8 w-8 text-accent animate-pulse" />
        </motion.div>
        <Link
          href="/community"
          className="md:left-8 flex items-center gap-1.5 text-xs text-white/50 my-2 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Community
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-white"
        >
          Study <span className="text-gradient-blue">Leaderboard</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 max-w-md text-sm text-white "
        >
          Compete, stay consistent, and excel.Review where you stand amongst peers in CA preparation
        </motion.p>
      </div>
    </section>
  );
}
// . Review where you stand amongst peers in CA preparation