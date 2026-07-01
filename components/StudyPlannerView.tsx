import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Bookmark, BookOpen, Download, Eye, Star, ArrowLeft, FileText, Calendar, User, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useStudent } from "./StudentTypeProvider";
import { formatSubjectName } from "@/utils/subjects";
import { useSearchParams } from "next/navigation";
import { ConfirmModal } from "./ConfirmModal";
import Link from "next/link";

interface PlannerType {
  id: string;
  title: string;
  category: string;
  planner_date: string;
  pages: number;
  downloads: number;
  rating: number;
  pdf_url: string;
  faculty_name: string;
  is_community: boolean;
}

interface Props {
  onBack: () => void;
}

const StudyPlannerView = ({ onBack }: Props) => {
  const { subjects, loading: studentLoading } = useStudent();
  const supabase = createClient();
  
  const searchParams = useSearchParams();
  const filterFromUrl = searchParams.get('filter');

  const [planners, setPlanners] = useState<PlannerType[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [sourceFilter, setSourceFilter] = useState(
    filterFromUrl === 'community' ? 'Community Library' : 
    filterFromUrl === 'faculty' ? 'Faculty Uploads' : 'All'
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [plannerToUnbookmark, setPlannerToUnbookmark] = useState<string | null>(null);

  useEffect(() => {
    if (!studentLoading) {
      fetchData();
    }
  }, [studentLoading, subjects]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUserId(user.id);
      // Fetch user's bookmarks
      const { data: bookmarksData } = await supabase
        .from('user_bookmarks')
        .select('planner_id')
        .eq('user_id', user.id);
      
      if (bookmarksData) {
        setBookmarks(bookmarksData.map(b => b.planner_id));
      }
    }

    // Fetch planners matching the allowed subjects
    const { data: plannersData, error } = await supabase
      .from('study_planners')
      .select(`
        id, title, category, planner_date, pages, downloads, rating, pdf_url,
        faculty_id, is_community,
        faculty:faculty_id ( name )
      `)
      .in('category', subjects);
console.log(plannersData, "data");


    if (plannersData) {
      const formattedPlanners: PlannerType[] = plannersData.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        planner_date: p.planner_date,
        pages: p.pages || 0,
        downloads: p.downloads || 0,
        rating: p.rating || 0,
        pdf_url: p.pdf_url,
        faculty_name: p.faculty?.name || '',
        is_community: p.is_community || false,
      }));
      setPlanners(formattedPlanners);
    }

    setLoading(false);
  };

  const toggleBookmark = async (id: string) => {
    if (!userId) return;
    
    const isBookmarked = bookmarks.includes(id);
    if (isBookmarked) {
      setPlannerToUnbookmark(id);
      setIsConfirmModalOpen(true);
    } else {
      setBookmarks(prev => [...prev, id]);
      await supabase
        .from('user_bookmarks')
        .insert({ user_id: userId, planner_id: id });
    }
  };

  const confirmUnbookmark = async () => {
    if (!userId || !plannerToUnbookmark) return;

    setBookmarks(prev => prev.filter(b => b !== plannerToUnbookmark));
    await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('planner_id', plannerToUnbookmark);
    
    setPlannerToUnbookmark(null);
  };

 const handleDownload = async (planner: PlannerType) => {
  // 1. Convert standard Drive link to a direct download link
  // Standard: https://drive.google.com/file/d/FILE_ID/view
  // Download: https://drive.google.com/uc?export=download&id=FILE_ID
  const fileId = planner.pdf_url.match(/[-\w]{25,}/); 
  const downloadUrl = fileId 
    ? `https://drive.google.com/uc?export=download&id=${fileId[0]}`
    : planner.pdf_url;

  try {
    setDownloadingIds(prev => [...prev, planner.id]);
    // 2. Open the download link in a hidden iframe or new tab
    // This triggers the browser's native download behavior
    window.location.href = downloadUrl;

    // 3. Increment download count in Supabase
    // Note: Use .rpc() or increment logic if multiple users might download at once
    const { error } = await supabase
      .from('study_planners')
      .update({ downloads: planner.downloads + 1 })
      .eq('id', planner.id);

    if (!error) {
      setPlanners(prev => prev.map(p => 
        p.id === planner.id ? { ...p, downloads: p.downloads + 1 } : p
      ));
    }
  } catch (error) {
    console.error("Tracking failed:", error);
  } finally {
    // Add a small delay so it doesn't flicker too fast if it's instant
    setTimeout(() => {
      setDownloadingIds(prev => prev.filter(id => id !== planner.id));
    }, 1000);
  }
};
  const filtered = planners.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.faculty_name.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === "All" || p.category === selectedSubject;
    const matchesBookmark = !showBookmarksOnly || bookmarks.includes(p.id);
    
    const matchesSource = 
      sourceFilter === "All" ? true :
      sourceFilter === "Community Library" ? p.is_community :
      !p.is_community; // Faculty Uploads

    return matchesSearch && matchesSubject && matchesBookmark && matchesSource;
  });

  const subjectOptions = ["All", ...subjects];
  const sourceOptions = ["All", "Community Library", "Faculty Uploads"];

  return (
    <div>
      {/* Header */}
      <section className="bg-primary py-16 mx-auto">
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
        Study <span className="text-gradient-blue">Resources</span>
      </h1>
      <p className="mt-2 text-sm text-primary-foreground/50">
        Browse and download study planners shared by top faculty.
      </p>
    </motion.div>
  </div>
</section>

      {/* Search + Actions */}
      <section className="container py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search planners by title or faculty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button
              variant={showBookmarksOnly ? "default" : "outline"}
              size="default"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className="gap-2"
            >
              <Bookmark className={`h-4 w-4 ${showBookmarksOnly ? "fill-current" : ""}`} />
              Bookmarks
            </Button>
          </div>
        </motion.div>

        {/* Filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap gap-2 overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="w-full text-[10px] uppercase font-bold text-muted-foreground/70 mb-1">Subjects</span>
                  {subjectOptions.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        selectedSubject === sub
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {sub === "All" ? sub : formatSubjectName(sub as any)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="w-full text-[10px] uppercase font-bold text-muted-foreground/70 mb-1">Source</span>
                  {sourceOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSourceFilter(opt)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        sourceFilter === opt
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading || studentLoading ? (
          <div className="mt-12 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="mt-4 text-xs text-muted-foreground">{filtered.length} planner{filtered.length !== 1 ? "s" : ""} found</p>

            {/* Planner cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((planner, i) => (
              
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:border-accent/30 flex flex-col"
                >
                  {/* PDF icon + badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10">
                      <FileText className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                        {formatSubjectName(planner.category as any)}
                      </span>
                      {planner.is_community && (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-500">
                          Community
                        </span>
                      )}
                      {!planner.is_community && !planner.faculty_name && (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-500">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-sm font-semibold text-card-foreground leading-snug line-clamp-2">{planner.title}</h3>

                  {/* Meta */}
                  <div className="mt-3 space-y-1.5 flex-1">
                    {!planner.is_community && planner.faculty_name  && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> {planner.faculty_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {new Date(planner.planner_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                     {planner.pages && <><span className="text-xs">{planner.pages} pages</span>
                      <span>•</span></>}
                      <span>{planner.downloads} downloads</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 pt-4  border-border mt-auto">
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1.5 text-xs" 
                      onClick={() => handleDownload(planner)}
                      disabled={downloadingIds.includes(planner.id)}
                    >
                      {downloadingIds.includes(planner.id) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </Button>
                    <button
                      onClick={() => window.open(planner.pdf_url, '_blank')}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-secondary shrink-0"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => toggleBookmark(planner.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-secondary shrink-0"
                      title={bookmarks.includes(planner.id) ? "Remove Bookmark" : "Add Bookmark"}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${bookmarks.includes(planner.id) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                </motion.div>
                
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="my-12 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">No planners found matching your search and filter criteria.</p>
              </div>
            )}
          </>
        )}
      </section>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmUnbookmark}
        title="Remove Bookmark?"
        description="Are you sure you want to remove this planner from your bookmarks?"
        confirmText="Remove"
      />
    </div>
  );
};

export default StudyPlannerView;
