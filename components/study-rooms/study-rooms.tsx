"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Globe,
  Video,
  BookOpen,
  Search,
  Sparkles,
  Square,
  CircleDot,
  ExternalLink,
  Users,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { formatSubjectName, SUBJECT_ABBREVIATIONS } from "@/utils/subjects";
import { SubjectCategory } from "@/utils/supabase/types";
import { useStudent } from "@/components/providers/StudentTypeProvider";

interface CustomRoom {
  id: string;
  title: string;
  subject: string | null;
  meet_link: string | null;
  description: string | null;
  is_creator_room: boolean;
  session_status: "idle" | "live" | "ended";
  created_at: string;
}

interface StaticSubjectRoom {
  id: string;
  title: string;
  subject: string;
  meet_link: string;
  is_custom: false;
}

interface StudyRoomsProps {
  onBack?: () => void;
}

export default function StudyRooms({ onBack }: StudyRoomsProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const { studentLevel, subjects, loading: studentLoading } = useStudent();

  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [showCreatorBanner, setShowCreatorBanner] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed-creator-banner");
    if (dismissed === "true") {
      setShowCreatorBanner(false);
    }
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem("dismissed-creator-banner", "true");
    setShowCreatorBanner(false);
  };

  const fetchRooms = async () => {
    // 1. Fetch static subject meet links
    const { data: meetLinksData } = await supabase
      .from("subject_meet_links")
      .select("subject_id, meet_url");

    if (meetLinksData) {
      const links: Record<string, string> = {};
      meetLinksData.forEach((item) => {
        links[item.subject_id] = item.meet_url;
      });
      setMeetLinks(links);
    }

    // 2. Fetch custom public & creator study rooms
    const { data: customRoomsData, error } = await supabase
      .from("study_rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Failed to load study rooms",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCustomRooms((customRoomsData as CustomRoom[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();

    // Subscribe to realtime database changes for custom rooms
    const roomsChannel = supabase
      .channel("study_rooms_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_rooms" },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, []);

  // Compute static subject rooms based on user level subjects
  const staticSubjectRooms = useMemo(() => {
    if (studentLoading) return [];
    return subjects.map((subject) => ({
      id: subject,
      title:
        subject === "principles_and_practice_of_accounting" ||
          subject === "advanced_accounting"
          ? "PV Test Series"
          : formatSubjectName(subject),
      subject: SUBJECT_ABBREVIATIONS[subject] || formatSubjectName(subject),
      meet_link: meetLinks[subject] || "https://meet.google.com/new",
      is_custom: false as const,
    }));
  }, [subjects, meetLinks, studentLoading]);

  // Combine and filter public rooms
  const filteredPublicRooms = useMemo(() => {
    // Static subject rooms
    const publicStatic = staticSubjectRooms.map((r) => ({
      ...r,
      description: null,
      is_creator_room: false,
      session_status: "live" as const,
    }));

    // Custom public rooms (is_creator_room = false)
    const publicCustom = customRooms
      .filter((r) => !r.is_creator_room)
      .map((r) => ({
        id: r.id,
        title: r.title,
        subject: r.subject
          ? (SUBJECT_ABBREVIATIONS[r.subject as SubjectCategory] || r.subject)
          : "General",
        meet_link: r.meet_link,
        description: r.description,
        is_custom: true as const,
        is_creator_room: false,
        session_status: "live" as const, // Custom public rooms are assumed live once created
      }));

    const allPublic = [...publicStatic, ...publicCustom];

    if (!search.trim()) return allPublic;

    const query = search.toLowerCase();
    return allPublic.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        (r.description || "").toLowerCase().includes(query)
    );
  }, [staticSubjectRooms, customRooms, search]);

  // Filter creator rooms
  const filteredCreatorRooms = useMemo(() => {
    const creator = customRooms.filter((r) => r.is_creator_room);

    if (!search.trim()) return creator;

    const query = search.toLowerCase();
    return creator.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        (r.subject && (SUBJECT_ABBREVIATIONS[r.subject as SubjectCategory] || r.subject).toLowerCase().includes(query)) ||
        (r.description || "").toLowerCase().includes(query)
    );
  }, [customRooms, search]);

  const handleJoinCustomRoom = (roomId: string) => {
    window.open(`/rooms/${roomId}`, "_blank");
  };

  const handleJoinStaticRoom = (meetUrl: string) => {
    window.open(meetUrl, "_blank", "noopener,noreferrer");
    toast({
      title: "Joining Study Room",
      description: "Opening Google Meet in a new tab...",
    });
  };

  const StatusPill = ({ status }: { status: "idle" | "live" | "ended" }) => {
    if (status === "live") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent border border-accent/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          LIVE NOW
        </span>
      );
    }
    if (status === "ended") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold text-destructive border border-destructive/20">
          <Square className="h-2.5 w-2.5" /> ENDED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
        <CircleDot className="h-2.5 w-2.5 animate-pulse" /> STARTING SOON
      </span>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 text-foreground">
      {/* Back & Private Room Control Bar */}

      {/* <div className="mb-8"> <h2 className="text-3xl font-extrabold tracking-tight text-foreground"> Group Study Sessions </h2> <p className="mt-2 text-sm text-muted-foreground max-w-2xl"> Drop into a live study session, or spin up your own secure private space. Rooms connect you directly with peers via Google Meet. </p> </div> */}
      <div className="flex w-full flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search rooms by title, description or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 py-6 bg-card border-border shadow-sm rounded-xl focus-visible:ring-accent text-foreground"
          />
        </div>

        <Button
          onClick={() => setIsPrivateModalOpen(true)}
          className="w-full sm:w-auto shrink-0 bg-accent hover:bg-accent/90 text-white rounded-full px-6 py-5 font-semibold shadow-[0_8px_20px_rgba(var(--accent),0.2)] hover:shadow-[0_12px_25px_rgba(var(--accent),0.35)] transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Private Room
        </Button>
      </div>





      {/* Tabs Layout */}
      <Tabs defaultValue="public" className="w-full">
        <TabsList className="mb-6 p-1.5 bg-muted/40 border border-border/80 rounded-xl h-12">
          <TabsTrigger
            value="public"
            className="gap-2 px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Globe className="h-4 w-4 text-accent" />
            Public Sessions ({filteredPublicRooms.length})
          </TabsTrigger>
          <TabsTrigger
            value="creator"
            className="gap-2 px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Creator Rooms ({filteredCreatorRooms.length})
          </TabsTrigger>
        </TabsList>

        {/* Public Tab Content */}
        <TabsContent value="public" className="focus-visible:outline-none">
          {loading || studentLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading public study sessions...</p>
            </div>
          ) : filteredPublicRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No public rooms found</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                No active rooms match your search query. Try typing another subject name.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredPublicRooms.map((r, index) => {
                  const isCustom = "is_custom" in r && r.is_custom;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-card-hover shadow-card text-card-foreground"
                    >
                      {/* Top subtle glow */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                          </span>
                          <span className="text-[11px] font-bold text-accent tracking-wider uppercase">
                            Active Session
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-card-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                          {r.title}
                        </h3>

                        {r.description && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                            {r.description}
                          </p>
                        )}

                        {r.subject && (
                          <div className="mt-4">
                            <Badge variant="secondary" className="gap-1.5 text-[10px] font-semibold bg-secondary border border-border/50 text-secondary-foreground">
                              <BookOpen className="h-3 w-3 text-accent" />
                              {r.subject}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() =>
                          isCustom ? handleJoinCustomRoom(r.id) : handleJoinStaticRoom(r.meet_link)
                        }
                        className="mt-6 w-full bg-secondary hover:bg-accent text-secondary-foreground hover:text-white border border-border/50 hover:border-transparent transition-all duration-300 rounded-xl py-5 text-sm font-semibold"
                      >
                        <Video className="mr-2 h-4 w-4 shrink-0" />
                        Join Session
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Creator Tab Content */}
        <TabsContent value="creator" className="focus-visible:outline-none">
          {/* Informational Banner */}
          <AnimatePresence>
            {showCreatorBanner && (
              <motion.div
                initial={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: "hidden" }}
                transition={{ duration: 0.2 }}
                className="mb-6 flex items-start gap-4 rounded-2xl border border-accent/25 bg-accent/5 p-5 relative overflow-hidden"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-grow pr-8">
                  <p className="text-sm font-bold text-foreground">Creator-led Mentorship Rooms</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Exclusive sessions led by educators and mentors onboarded by CA StudyHub. Join links unlock only when the creator goes live, ensuring active, high-value learning environments.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissBanner}
                  className="absolute right-3 top-3 h-8 w-8 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading creator sessions...</p>
            </div>
          ) : filteredCreatorRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No creator sessions</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                No creator study rooms are currently scheduled. Check back later for upcoming sessions!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredCreatorRooms.map((r, index) => {
                  const isLive = r.session_status === "live";
                  const isEnded = r.session_status === "ended";
                  const mappedSubject = r.subject
                    ? (SUBJECT_ABBREVIATIONS[r.subject as SubjectCategory] || r.subject)
                    : null;

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className={cn(
                        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 shadow-card text-card-foreground",
                        isLive
                          ? "border-accent/40 shadow-[0_4px_20px_-4px_rgba(197,100,50,0.15)] hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(197,100,50,0.25)]"
                          : "border-border hover:-translate-y-1 hover:border-accent/40"
                      )}
                    >
                      {/* Top glow for live sessions */}
                      <div
                        className={cn(
                          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-opacity duration-300",
                          isLive
                            ? "from-accent via-accent/50 to-transparent opacity-100"
                            : "from-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                        )}
                      />

                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <StatusPill status={r.session_status} />
                        </div>

                        <h3 className="text-lg font-bold text-card-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                          {r.title}
                        </h3>

                        {r.description && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                            {r.description}
                          </p>
                        )}

                        {mappedSubject && (
                          <div className="mt-4">
                            <Badge variant="secondary" className="gap-1.5 text-[10px] font-semibold bg-secondary border border-border/50 text-secondary-foreground">
                              <BookOpen className="h-3 w-3 text-accent" />
                              {mappedSubject}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleJoinCustomRoom(r.id)}
                        disabled={!isLive}
                        className={cn(
                          "mt-6 w-full py-5 text-sm font-semibold rounded-xl transition-all duration-300",
                          isLive
                            ? "bg-accent hover:bg-accent/90 text-white shadow-sm"
                            : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                        )}
                      >
                        <Video className="mr-2 h-4 w-4 shrink-0" />
                        {isLive ? "Join Session" : isEnded ? "Session Ended" : "Waiting for Creator"}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Private Room Modal (Light/Dark Mode compatible) */}
      <AnimatePresence>
        {isPrivateModalOpen && (
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
              className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative text-card-foreground"
            >
              {/* Top Accent Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Private Study Room
                </h3>
                <button
                  onClick={() => setIsPrivateModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="bg-secondary/40 border border-border rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
                  <p className="mb-3">
                    You are about to generate a secure Google Meet space for your study group.
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Instructions:</span> Once Google Meet opens in a new tab, copy its meeting URL from the browser's address bar and send it directly to your study partners.
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-xl font-bold shadow-[0_8px_20px_rgba(var(--accent),0.25)] hover:shadow-[0_12px_25px_rgba(var(--accent),0.35)] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsPrivateModalOpen(false)}
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
}
