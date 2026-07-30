"use client"
import { motion } from "framer-motion";
import {
  BookOpen, FileText, Timer, CalendarDays, Users, GraduationCap,
  ClipboardCheck, BarChart3, Compass, MessageCircle, Target, Lightbulb
} from "lucide-react";

const features = [
  { icon: FileText, title: "MTP, RTP & PYQ", description: "Access mock test papers, revision test papers, and previous year questions." },
  { icon: ClipboardCheck, title: "Mock Exams", description: "Full-length mock exams simulating real CA exam conditions." },
  { icon: GraduationCap, title: "Faculty Database", description: "Browse and connect with top CA faculty across India." },
  { icon: Users, title: "Group Study", description: "Join or create group study sessions with peers." },
  { icon: Timer, title: "Study Timer", description: "Track your study hours with Pomodoro timer and analytics." },
  { icon: Target, title: "Task Management", description: "Organize preparation with smart to-do lists and planners." },
  { icon: BarChart3, title: "Progress Tracking", description: "Visualize your journey with performance analytics." },
  { icon: CalendarDays, title: "Calendar", description: "ICAI exam dates, registration alerts, and reminders." },
  { icon: MessageCircle, title: "Community Forum", description: "Discuss doubts and share strategies with peers." },
  { icon: Compass, title: "Career Guidance", description: "Mentorship and career advice from qualified CAs." },
  { icon: BookOpen, title: "Study Planner", description: "Personalized study plans based on your exam schedule." },
  { icon: Lightbulb, title: "Faculty Interaction", description: "Live sessions and personalized guidance from faculty." },
];

const FeaturesSection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Features</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
            Everything You Need to <span className="text-gradient-blue">Crack CA</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            From resources to community — every tool a CA student needs, under one roof.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:border-accent/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
