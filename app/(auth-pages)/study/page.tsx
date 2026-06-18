"use client"

import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Timer, CalendarDays, Target, BarChart3, ClipboardList, Bot, Bell, Award, Layers } from "lucide-react";
import Link from "next/link";
import { useStudent } from "@/components/StudentTypeProvider";

const tools = [
  { icon: BookOpen, title: "Study Resources", description: "Study planners, key questions, and mnemonics from faculty & community", path: "/study/planner" },
  { icon: BarChart3, title: "Progress dashboard", description: "Track study time, maintain streaks, manage tasks, and view detailed analytics.", path: "/study/progress" },
  { icon: CalendarDays, title: "Calendar", description: "ICAI exam dates, registration deadlines, and reminders.", path: "/study/events" },
  { icon: ClipboardList, title: "Notes & Bookmarks", description: "Save notes, bookmark resources, and organize materials.", path: "/bookmarks" },
  { icon: Layers, title: "Flashcards", description: "Master concepts faster with digital flashcards organized by folders.", path: "/study/flash-cards" },

  { icon: Bell, title: "Announcements", description: "Stay updated with the latest ICAI announcements and official notices.", path: "/study/announcements", comingSoon: false  },
  // { icon: Bot, title: "AI Chatbot", description: "Instant AI-powered doubt solving and personalized study assistance.", comingSoon: true },
];

const Study = () => {
  const { studentLevel } = useStudent();

  const studyTools = [...tools];
if (studentLevel === "final") {
  studyTools.splice(Math.max(studyTools.length, 0), 0, {
    icon: Award,
    title: "SPOM (Self-Paced)",
    description: "Access Set A–D papers, study materials, and peer observations.",
    path: "/study/spom",
    comingSoon: true 
  });
}

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col w-full">
      <div className="flex-1 w-full">
        <section className="bg-primary py-20 w-full">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl text-center">
              <h1 className="text-4xl font-bold text-primary-foreground">Study <span className="text-gradient-blue">Smarter</span></h1>
              <p className="mt-4 text-sm text-primary-foreground/50">Plan, focus, and track your CA preparation with powerful tools.</p>
            </motion.div>
          </div>
        </section>
        <section className="container py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studyTools.map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`group rounded-xl border border-border bg-card p-5 shadow-card transition-all ${tool.comingSoon ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-card-hover hover:border-accent/30'}`}
              >
                {tool.comingSoon ? (
                  <div className="block w-full h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                        <tool.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">Coming Soon</span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-muted-foreground">{tool.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground/70">{tool.description}</p>
                  </div>
                ) : (
                  <Link href={tool.path ?? ""} className="block w-full h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <tool.icon className="h-5 w-5 text-accent" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-card-foreground">{tool.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground">{tool.description}</p>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Study;
