"use client";
import { motion } from "framer-motion";
import { Users, MessageCircle, Compass, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import Link from "next/link";

const sections = [
  { icon: Users, title: "Group Study Sessions", description: "Join live study rooms with fellow aspirants. Collaborate on tough topics and stay motivated.", cta: "Find a Group", href: "/community/rooms", disabled: false },
  { 
    icon: Compass, 
    title: "Community Library", 
    description: "Contribute to the collective knowledge. Upload study planners, notes, or tips for others.", 
    actions: [
      { label: "Upload Material", href: "/community/upload" },
      { label: "View Library", href: "/study/planner" }
    ],
    disabled: false 
  },
  { icon: MessageCircle, title: "Discussion Forum", description: "Post questions, share insights, and get answers from peers and mentors.", cta: "Go to Forum", href: "/community/forum", disabled: false },
   { icon: TrendingUp, title: "Leaderboard", description: "Compete on mock tests, study streaks, and community contributions.", cta: "View Leaderboard", href: "/community/leaderboard", disabled: false },
  { icon: Compass, title: "Career Guidance", description: "Get mentorship from qualified CAs. Explore articleship and career paths.", cta: "Coming Soon", disabled: true },
 
];

import { ProFeatureLock } from "@/components/ProFeatureLock";
import Footer from "@/components/Footer";


const Community = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-background">
    <section className="bg-primary py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl text-center">
          <h1 className="text-4xl font-bold text-primary-foreground">Join the <span className="text-gradient-blue">Community</span></h1>
          <p className="mt-4 text-sm text-primary-foreground/50">Connect, collaborate, and grow with thousands of CA aspirants.</p>
        </motion.div>
      </div>
    </section>
    <main>
      <section className="container py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {sections.map((s, i) => {
            const isPro = s.title === "Group Study Sessions";
            const CardContent = (
              <div className="p-6 flex flex-col h-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <s.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-card-foreground">{s.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground flex-1">{s.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.actions ? (
                     s.actions.map(action => (
                      <Button key={action.label} size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                     ))
                  ) : s.disabled ? (
                    <Button size="sm" className="w-full bg-accent text-accent-foreground opacity-50 cursor-not-allowed" disabled>
                      {s.cta}
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                      <Link href={s.href!}>{s.cta}</Link>
                    </Button>
                  )}
                </div>
              </div>
            );

            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card shadow-card"
              >
                {isPro ? (
                  <ProFeatureLock label="Unlock Group study sessions with Pro subscription">
                    {CardContent}
                  </ProFeatureLock>
                ) : (
                  CardContent
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Community;
