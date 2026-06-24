"use client"
import { useState, useMemo, useEffect } from "react";
import { useStudent } from "@/components/StudentTypeProvider";
import { motion } from "framer-motion";
import { Search, Bookmark, BookmarkCheck, Download, Eye, Filter, FileText, Loader2, ArrowLeft } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client"; // Adjust based on your setup
import { StudentLevel, SubjectCategory } from "@/types/database.types";
import { useSearchParams } from "next/navigation";


type DbPaper = {
  id: string;
  title: string;
  subject: SubjectCategory;
  level: StudentLevel;
  type: string;
  pages: number;
  exam_year: string
  pdf_url: string;
  is_solution: boolean;
  test_no?: string;
  created_at: string;
};

// Utility to parse exam_year string (e.g. "Sep 2025") into a sortable date
const parseExamYear = (yearStr: string) => {
  if (!yearStr) return new Date(0);
  const parts = yearStr.split(' ');
  if (parts.length !== 2) return new Date(0);
  
  const monthNames: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = monthNames[parts[0]] ?? 0;
  const year = parseInt(parts[1]) || 0;
  return new Date(year, month, 1);
};

interface PaperBrowserProps {
  title: string;
  subtitle: string;
  paperType: "mtp" | "rtp" | "pyq" | "online";
}

// Utility to format snake_case enums into Title Case
const formatSubjectName = (subject: string) => {
  return subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const PaperBrowser = ({ title, subtitle, paperType }: PaperBrowserProps) => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const category = searchParams.get("category"); // 'questions' or 'solutions'
  const { studentLevel, subjects: studentSubjects, loading: studentLoading } = useStudent();

  

  const [papers, setPapers] = useState<DbPaper[]>([]);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingPaperId, setViewingPaperId] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paperToRemove, setPaperToRemove] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        // 1. Fetch papers for this specific type (mtp, rtp, or pyq)
        let papersQuery = supabase
          .from("practice_papers")
          .select("*")
          .eq("type", paperType);

        if (studentLevel) {
          papersQuery = papersQuery.eq("level", studentLevel);
        }

        if (studentSubjects.length > 0) {
          papersQuery = papersQuery.in("subject", studentSubjects);
        }


        if (category) {
          papersQuery = papersQuery.eq("is_solution", category === "solutions");
        }

        const { data: papersData, error: papersError } = await papersQuery;

        if (papersData) {
          // Client-side sorting because "Sep 2025" is not easily sortable in SQL
          const sortedData = [...papersData].sort((a, b) => 
            parseExamYear(b.exam_year).getTime() - parseExamYear(a.exam_year).getTime()
          );
          setPapers(sortedData);
        }
        if (papersError) console.error("Error fetching papers:", papersError);

        // 2. Fetch user's existing bookmarks for practice papers
        if (user) {
          const { data: bookmarksData } = await supabase
            .from("user_bookmarks")
            .select("practice_paper_id")
            .eq("user_id", user.id)
            .not("practice_paper_id", "is", null);

          if (bookmarksData) {
            const bookmarkSet = new Set(bookmarksData.map(b => b.practice_paper_id as string));
            setBookmarked(bookmarkSet);
          }
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, paperType, studentSubjects, studentLevel, category]);

  const toggleBookmark = async (id: string, paperTitle: string) => {
    if (!userId) {
      toast({ title: "Authentication required", description: "Please log in to bookmark papers.", variant: "destructive" });
      return;
    }

    const isCurrentlyBookmarked = bookmarked.has(id);

    if (isCurrentlyBookmarked) {
      setPaperToRemove({ id, title: paperTitle });
      setIsConfirmModalOpen(true);
      return;
    }

    // Adding bookmark
    await executeBookmarkUpdate(id, paperTitle, false);
  };

  const executeBookmarkUpdate = async (id: string, paperTitle: string, isRemove: boolean) => {
    // Optimistic UI Update
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isRemove) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isRemove) {
        // Remove bookmark
        await supabase
          .from("user_bookmarks")
          .delete()
          .match({ user_id: userId, practice_paper_id: id });
          
        toast({ title: "Bookmark removed", description: paperTitle });
      } else {
        // Add bookmark
        await supabase
          .from("user_bookmarks")
          .insert({ user_id: userId, practice_paper_id: id });
          
        toast({ title: "Bookmarked!", description: paperTitle });
      }
    } catch (error) {
      // Revert optimistic update on failure
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isRemove) next.add(id);
        else next.delete(id);
        return next;
      });
      toast({ title: "Error", description: "Failed to update bookmark.", variant: "destructive" });
    }
  };

  const handleConfirmRemove = async () => {
    if (paperToRemove) {
      await executeBookmarkUpdate(paperToRemove.id, paperToRemove.title, true);
      setPaperToRemove(null);
      setIsConfirmModalOpen(false);
    }
  };

  const openPaper = (paper: DbPaper) => {
    if (!paper.pdf_url) {
      toast({ title: "Missing PDF", description: "This paper has no PDF available.", variant: "destructive" });
      return;
    }

    setViewingPaperId(paper.id);
    const newTab = window.open(paper.pdf_url, "_blank", "noopener,noreferrer");
    setViewingPaperId(null);
  };

const downloadPaper = async (paper: DbPaper) => {
  if (!paper.pdf_url) {
    toast({ title: "Missing PDF", description: "This paper has no PDF available.", variant: "destructive" });
    return;
  }

  setDownloadingIds(prev => [...prev, paper.id]);

  try {
    const url = paper.pdf_url;
    // Regex to detect Google Drive patterns
    const isGoogleDrive = /drive\.google\.com/.test(url);

    if (isGoogleDrive) {
      /**
       * CASE 1: Google Drive
       * Fetching Drive links via JS usually fails due to CORS.
       * We convert the link to a direct download and let the browser handle it.
       */
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)|id=([a-zA-Z0-9-_]+)/);
      const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : null;

      if (fileId) {
        const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        window.location.href = downloadLink;
      } else {
        // Fallback: Just open the link if we can't parse the ID
        window.open(url, '_blank');
      }
    } else {
      /**
       * CASE 2: Standard Direct Link
       * We use your original Blob method for a seamless background download.
       */
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      
      const anchor = document.createElement("a");
      anchor.href = href;
      const sanitizedTitle = paper.title.replace(/[^a-z0-9_\-\.]/gi, "_");
      anchor.download = `${sanitizedTitle}.pdf`;
      
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    }

    // Optional: Success toast
    // toast({ title: "Download started", description: paper.title });

  } catch (error) {
    console.error("Download error:", error);
    // If fetch fails (CORS), try opening in a new tab as a ultimate fallback
    window.open(paper.pdf_url, '_blank');
    toast({ 
      title: "Download redirected", 
      description: "Opening file in a new tab...", 
    });
  } finally {
    setTimeout(() => {
      setDownloadingIds(prev => prev.filter(id => id !== paper.id));
    }, 1000);
  }
};

  // Dynamic filter lists based on fetched data
  const subjects = useMemo(() => Array.from(new Set(papers.map((p) => p.subject))), [papers]);
  const levels = useMemo(() => Array.from(new Set(papers.map((p) => p.exam_year))), [papers]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      const formattedSubject = formatSubjectName(p.subject);
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        formattedSubject.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === "all" || p.subject === subjectFilter;
      const matchesLevel = levelFilter === "all" || p.exam_year === levelFilter;
      return matchesSearch && matchesSubject && matchesLevel;
    });
  }, [papers, search, subjectFilter, levelFilter]);

  const displayTitle = category ? `${title} (${category.charAt(0).toUpperCase() + category.slice(1)})` : title;



  return (
    <div className="container py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3">
         
          {/* <h1 className="text-2xl font-bold text-foreground">{title}</h1> */}
          <h1 className="text-xl font-bold text-foreground">{displayTitle}</h1>
          {!isLoading && papers.length > 0 && (
            <Badge className="bg-accent/15 text-accent border-accent/30 text-xs">
              {papers.length} Papers
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={isLoading}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{formatSubjectName(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter} disabled={isLoading}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exam Years</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Results count */}
      {!isLoading && (
        <p className="mb-4 text-xs text-muted-foreground">
          {filtered.length} paper{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Paper list */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px] pr-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Loading papers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No papers match your search.</p>
            </div>
          ) : (
            filtered.map((paper, i) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary hidden sm:flex">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-card-foreground truncate">{paper.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{formatSubjectName(paper.subject)}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{paper.exam_year}</Badge>
                    {paper.test_no && <Badge variant="outline" className="text-[10px] bg-accent/5 text-accent border-accent/20">Test {paper.test_no}</Badge>}
                    <span className="text-[10px] text-muted-foreground">{paper.level} • {paper.pages} pages</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 mt-3 sm:mt-0 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleBookmark(paper.id, paper.title)}
                    title={bookmarked.has(paper.id) ? "Remove bookmark" : "Bookmark"}
                  >
                    {bookmarked.has(paper.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-accent" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openPaper(paper)}
                    disabled={isLoading || viewingPaperId === paper.id || downloadingIds.includes(paper.id)}
                    title="View"
                  >
                    {viewingPaperId === paper.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {/* <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1.5 text-xs px-3 min-w-[100px]"
                    onClick={() => downloadPaper(paper)}
                    disabled={isLoading || viewingPaperId === paper.id || downloadingIds.includes(paper.id)}
                  >
                    {downloadingIds.includes(paper.id) ? (
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
                  </Button> */}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Bookmark?"
        description={`Are you sure you want to remove the bookmark for "${paperToRemove?.title}"?`}
        confirmText="Remove"
      />
    </div>
  );
};

export default PaperBrowser;