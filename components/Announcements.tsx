import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnnouncementsViewProps {
  onBack: () => void;
}

const announcements = [
  {
    title: "CA Final & Inter May 2025 Exam Schedule Released",
    date: "March 15, 2025",
    summary: "ICAI has released the detailed exam schedule for CA Final and Intermediate May 2025 examinations.",
    url: "https://www.icai.org",
    tag: "Exam Schedule",
  },
  {
    title: "Revised Syllabus for CA Foundation — Effective July 2025",
    date: "March 10, 2025",
    summary: "The Board of Studies has announced a revised syllabus for CA Foundation course effective from July 2025 attempt.",
    url: "https://www.icai.org",
    tag: "Syllabus",
  },
  {
    title: "Online Registration for Articleship — Window Open",
    date: "March 5, 2025",
    summary: "Students can now register for Articleship training through the ICAI SSP portal. Last date: April 30, 2025.",
    url: "https://www.icai.org",
    tag: "Registration",
  },
  {
    title: "ICAI Webinar on Ethics & Professional Conduct",
    date: "February 28, 2025",
    summary: "A free webinar on professional ethics for CA students will be held on March 20, 2025 at 5 PM IST.",
    url: "https://www.icai.org",
    tag: "Event",
  },
  {
    title: "CA Inter Group-wise Pass Percentage — Nov 2024",
    date: "February 20, 2025",
    summary: "ICAI has published the group-wise pass percentages for CA Intermediate November 2024 examinations.",
    url: "https://www.icai.org",
    tag: "Results",
  },
  {
    title: "New Practice Manual for Advanced Auditing Released",
    date: "February 15, 2025",
    summary: "The Board of Studies has released an updated practice manual for Advanced Auditing & Professional Ethics.",
    url: "https://bos.icai.org",
    tag: "Study Material",
  },
];

const tagColors: Record<string, string> = {
  "Exam Schedule": "bg-blue-500/10 text-blue-400",
  "Syllabus": "bg-purple-500/10 text-purple-400",
  "Registration": "bg-green-500/10 text-green-400",
  "Event": "bg-amber-500/10 text-amber-400",
  "Results": "bg-rose-500/10 text-rose-400",
  "Study Material": "bg-teal-500/10 text-teal-400",
};

const AnnouncementsView = ({ onBack }: AnnouncementsViewProps) => {
  return (
    <section className="container py-10">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Study Tools
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">ICAI Announcements</h2>
        </div>
        <p className="text-sm text-muted-foreground">Latest notices and updates from the Institute of Chartered Accountants of India</p>
      </motion.div>

      <div className="space-y-3">
        {announcements.map((item, i) => (
          <motion.a
            key={i}
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
                  {item.tag}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {item.date}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent transition-colors">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent transition-colors mt-1" />
          </motion.a>
        ))}
      </div>

      <div className="mt-6 text-center">
        <a href="https://www.icai.org" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            Visit ICAI Official Website <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </section>
  );
};

export default AnnouncementsView;
