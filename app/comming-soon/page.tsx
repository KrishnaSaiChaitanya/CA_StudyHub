"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Bell, ArrowRight, Sparkles, Clock, BarChart, Users, Gift, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlistAction } from "@/app/actions";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }

    setIsPending(true);
    try {
      const result = await joinWaitlistAction(email);
      if (result.success) {
        setSubmitted(true);
        toast({ title: "You're on the list! 🎉", description: "We'll notify you when we launch." });
      } else {
        toast({ title: "Something went wrong", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-primary overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/5"
            style={{
              width: 200 + i * 80,
              height: 200 + i * 80,
              left: `${10 + i * 15}%`,
              top: `${5 + i * 12}%`,
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative z-10 container max-w-3xl mx-auto px-4 py-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8"
        >
          <Clock className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">Launching Soon</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight"
        >
          Something{" "}
          <span className="bg-gradient-to-r from-[hsl(197,100%,50%)] to-[hsl(217,100%,60%)] bg-clip-text text-transparent">
            Amazing
          </span>{" "}
          is Coming
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-lg text-primary-foreground/60 max-w-xl mx-auto"
        >
          We're building the ultimate platform to help CA aspirants crack their exams. Stay tuned for further updates!
        </motion.p>

        {/* Perks */}
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Gift, title: "Free Pro Access", desc: "Get full Pro access completely free till the end of November" },
            { icon: BarChart3, title: "Progress Dashboard", desc: "Track your study hours, mock scores, and daily streaks in one place" },
            { icon: Users, title: "Community", desc: "Learn together with peers through forums, group study, and discussions" },
          ].map((perk, i) => (
            <div
              key={i}
              className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 text-center"
            >
              <perk.icon className="h-6 w-6 text-accent mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-primary-foreground">{perk.title}</h3>
              <p className="text-xs text-primary-foreground/50 mt-1">{perk.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Email form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10"
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-accent disabled:opacity-50"
              />
              <Button type="submit" disabled={isPending} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg min-w-[140px]">
                {isPending ? "Joining..." : "Join the Waitlist"}
                {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-6 py-4"
            >
              <Rocket className="h-6 w-6 text-accent" />
              <div className="text-left">
                <p className="text-sm font-semibold text-primary-foreground">You're on the list!</p>
                <p className="text-xs text-primary-foreground/60">We'll notify you when we launch!!</p>
              </div>
            </motion.div>
          )}
          {/* <p className="text-xs text-primary-foreground/40 mt-3">
            Join the waitlist to get <span className="text-accent font-medium">Pro access free for 1 month</span> when we launch.
          </p> */}
           <p className="text-xs text-primary-foreground/40 mt-3">
            Join the waitlist to get <span className="text-accent font-medium">free Pro access till the end of November</span> when we launch.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
