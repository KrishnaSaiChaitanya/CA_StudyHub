"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Video, ArrowLeft, Loader2, Users, X, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { createClient } from "@/utils/supabase/client";
import { formatSubjectName } from "@/utils/subjects";
import { SubjectCategory } from "@/utils/supabase/types";
import PageHeader from "@/components/shared/PageHeader";

interface SubjectWithLink {
  title: string;
  meetUrl: string;
  category: SubjectCategory;
}

const CommunityRooms = () => {
  const { studentLevel, subjects, loading: studentLoading } = useStudent();
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchMeetLinks = async () => {
      setLoadingLinks(true);
      const { data, error } = await supabase
        .from("subject_meet_links")
        .select("subject_id, meet_url");

      if (!error && data) {
        const links: Record<string, string> = {};
        data.forEach((item) => {
          links[item.subject_id] = item.meet_url;
        });
        setMeetLinks(links);
      }
      setLoadingLinks(false);
    };

    fetchMeetLinks();
  }, [supabase]);

  if (studentLoading || loadingLinks) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displaySubjects: SubjectWithLink[] = subjects.map((subject) => ({
    title:
      subject === "principles_and_practice_of_accounting" ||
      subject === "advanced_accounting"
        ? "PV Test Series"
        : formatSubjectName(subject),
    category: subject,
    meetUrl: meetLinks[subject] || "https://meet.google.com/new",
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col selection:bg-accent/30">

      {/* --- BANNER AREA (Dark/Primary Background) --- */}
      <PageHeader
        title="Study"
        gradientTitle="Rooms"
        showBack={true}
        backText="Back to Community"
        description="Join subject-specific Google Meet rooms to study with peers."
      />
      {/* ------------------------------------------ */}

      {/* --- MAIN CONTENT AREA (White Background) --- */}
      <div className="flex-1 bg-white pt-8 pb-16">

        {/* Control Bar for Private Room */}
        <div className="container flex justify-center md:justify-end pb-8">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-6 py-6 font-medium shadow-[0_8px_20px_rgba(var(--accent),0.25)] hover:shadow-[0_12px_25px_rgba(var(--accent),0.35)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Private Room
          </Button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-3 container">
          {displaySubjects.map((subject, index) => (
            <motion.div
              key={subject.category}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white p-3 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
            >
              {/* Subtle top gradient glow on hover (adapted for light mode) */}
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

              <div className="relative z-10">
                <div className="mb-2 md:mb-5 inline-flex h-9 w-9 md:h-14 md:w-14 items-center justify-center rounded-lg md:rounded-xl bg-accent/10 border border-accent/20 text-accent transition-transform duration-300 group-hover:scale-110">
                  <Video className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <h3 className="line-clamp-2 text-xs md:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                  {subject.title}
                </h3>
                <p className="mt-1.5 md:mt-3 text-[10px] md:text-sm text-gray-500 leading-normal md:leading-relaxed line-clamp-2">
                  Live discussion and study group for {studentLevel?.charAt(0).toUpperCase()}{studentLevel?.slice(1)} {subject.title}.
                </p>
              </div>

              <Button asChild className="relative z-10 mt-4 md:mt-8 w-full bg-gray-50 hover:bg-accent text-gray-700 hover:text-white border border-gray-200 hover:border-transparent transition-all duration-300 shadow-sm h-7 md:h-10 text-xs md:text-sm">
                <a href={subject.meetUrl} target="_blank" rel="noopener noreferrer">
                  Join Room
                </a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Private Room Modal (Light Mode) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-gray-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
            >
              {/* Top Accent Line */}
              <div className="h-1 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Private Study Room
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed">
                  <p className="mb-3">
                    You are about to create a brand new, secure Google Meet room.
                  </p>
                  <p>
                    <span className="text-gray-900 font-medium">Instructions:</span> Once the room opens in a new tab, copy the URL from your browser's address bar and share it with the peers you want to invite.
                  </p>
                </div>

                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-xl font-semibold shadow-[0_8px_20px_rgba(var(--accent),0.25)] transition-all flex items-center justify-center gap-2 text-base">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <ExternalLink className="w-5 h-5" />
                    Generate Meet Link
                  </a>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CommunityRooms;