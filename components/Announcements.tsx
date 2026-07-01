"use client"

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/components/StudentTypeProvider";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface AnnouncementsViewProps {
  onBack: () => void;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  summary: string;
  url: string;
  tag: string;
  student_level: string;
}

const tagColors: Record<string, string> = {
  "general": "bg-slate-500/10 text-slate-400",
  "Exam Schedule": "bg-blue-500/10 text-blue-400",
  "Syllabus": "bg-purple-500/10 text-purple-400",
  "Registration": "bg-green-500/10 text-green-400",
  "Event": "bg-amber-500/10 text-amber-400",
  "Results": "bg-rose-500/10 text-rose-400",
  "Study Material": "bg-teal-500/10 text-teal-400",
};

const AnnouncementsView = ({ onBack }: AnnouncementsViewProps) => {
  const { studentLevel, loading: studentLoading } = useStudent();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (studentLoading) return;
      
      const supabase = createClient();
      let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });

      if (studentLevel) {
        // Fetch announcements that match user's student level OR have null student level (visible to all)
        query = query.or(`student_level.eq.${studentLevel},student_level.is.null`);
      }

      const { data, error } = await query;
        
      if (!error && data) {
        setAnnouncements(data);
      }
      setLoading(false);
    };

    fetchAnnouncements();
  }, [studentLevel, studentLoading]);

  return (
    <div className="w-full flex flex-col">
      <section className="bg-primary py-16 mx-auto w-full">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex flex-col items-center text-center"
          >
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Tools
            </button>
            <h1 className="text-3xl font-bold text-primary-foreground">
              ICAI <span className="text-gradient-blue">Announcements</span>
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/50">
              Latest notices and updates from the Institute of Chartered Accountants of India
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-10 flex-1">
        {loading || studentLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No announcements found.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item, i) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card-hover hover:border-accent/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${tagColors[item.tag] || "bg-muted text-muted-foreground"}`}>
                      {item.tag.charAt(0).toUpperCase() + item.tag.slice(1)}
                    </span>
                    {item.date && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {item.date}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent transition-colors">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent transition-colors mt-1" />
              </motion.a>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <a href="https://www.icai.org/category/announcements" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              Visit ICAI Official Website <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default AnnouncementsView;
