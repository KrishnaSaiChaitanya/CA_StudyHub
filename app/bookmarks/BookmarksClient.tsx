"use client"

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bookmark,
  StickyNote,
  FileText,
  BookOpen,
  ClipboardList,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Loader2,
  HelpCircle,
  ArrowLeft,
  Eye,
  ExternalLink
} from "lucide-react";
import { ProFeatureLock } from "@/components/ProFeatureLock";
import { createClient } from "@/utils/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BookmarkItem, DbNote } from "./types";
import { useStudent } from "@/components/StudentTypeProvider";
import { formatSubjectName } from "@/utils/subjects";
import { useRouter } from "next/navigation";

const typeIcon = {
  pdf: FileText,
  rtp: BookOpen,
  pyq: HelpCircle,
  mtp: ClipboardList,
  question: HelpCircle,
  spom: FileText,
};

const typeLabel = {
  pdf: "Study Material",
  rtp: "RTP",
  pyq: "PYQ",
  mtp: "MTP",
  question: "Question",
  spom: "SPOM",
};

const typeBadgeClass = {
  pdf: "bg-accent/10 text-accent",
  rtp: "bg-emerald-500/10 text-emerald-600",
  pyq: "bg-violet-500/10 text-violet-600",
  mtp: "bg-amber-500/10 text-amber-600",
  question: "bg-rose-500/10 text-rose-600",
  spom: "bg-blue-500/10 text-blue-600",
};

interface BookmarksClientProps {
  userId: string;
}

const BookmarksClient = ({ userId }: BookmarksClientProps) => {
  const supabase = createClient();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("bookmarks");
  
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [rawBookmarks, setRawBookmarks] = useState<BookmarkItem[]>([]);
  
  const [isBookmarksLoaded, setIsBookmarksLoaded] = useState(false);
  const [isNotesLoaded, setIsNotesLoaded] = useState(false);
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  const { subjects, loading: studentLoading } = useStudent();

  // Fetch bookmarks when activeTab is bookmarks and NOT loaded
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!userId || activeTab !== "bookmarks" || isBookmarksLoaded) return;
      
      setIsLoading(true);
      try {
        // Fetch SPOM content first to map SPOM bookmarks
        const { data: spomData } = await supabase.from("spom_content").select("materials").limit(1).single();
        const spomMaterials = spomData?.materials || [];

        const { data: bookmarksData, error } = await supabase
          .from("user_bookmarks")
          .select(`
            id,
            created_at,
            study_planners ( title, category, pdf_url ),
            practice_papers ( title, subject, type, pdf_url, exam_year ),
            questions ( id, question_text, test_id, tests ( name, category, test_no ) ),
            spom_material_id
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (bookmarksData) {
          const formatted: BookmarkItem[] = bookmarksData.map((b: any) => {
            if (b.study_planners) {
              return {
                id: b.id,
                title: b.study_planners.title,
                type: "pdf" as const,
                source: formatSubjectName(b.study_planners.category as any),
                savedAt: b.created_at,
                url: b.study_planners.pdf_url,
                subject: b.study_planners.category
              };
            } else if (b.practice_papers) {
              return {
                id: b.id,
                title: b.practice_papers.title,
                type: b.practice_papers.type as "rtp" | "pyq" | "mtp",
                source: formatSubjectName(b.practice_papers.subject as any),
                savedAt: b.created_at,
                url: b.practice_papers.pdf_url,
                subject: b.practice_papers.subject,
                exam_year: b.practice_papers.exam_year
              };
            } else if (b.questions) {
              const q = b.questions;
              return {
                id: b.id,
                title: q.question_text.substring(0, 60) + (q.question_text.length > 60 ? "..." : ""),
                type: "question" as const,
                source: q.tests ? `${q.tests.name} (${formatSubjectName(q.tests.category as any)})` : "Mock Test",
                savedAt: b.created_at,
                targetId: q.test_id,
                questionId: q.id,
                subject: q.tests?.category,
                test_no: q.tests?.test_no
              };
            } else if (b.spom_material_id) {
              const mat = spomMaterials.find((m: any) => m.id === b.spom_material_id);
              if (mat) {
                return {
                  id: b.id,
                  title: mat.title,
                  type: "spom" as const,
                  source: `SPOM • ${mat.paper} (${mat.type})`,
                  savedAt: b.created_at,
                  url: mat.url,
                  spom_material_id: b.spom_material_id
                };
              }
            }
            return null;
          }).filter(Boolean) as BookmarkItem[];

          setRawBookmarks(formatted);
          setIsBookmarksLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [userId, activeTab, isBookmarksLoaded, supabase]);

  // Fetch notes when activeTab is notes and NOT loaded
  useEffect(() => {
    const fetchNotes = async () => {
      if (!userId || activeTab !== "notes" || isNotesLoaded) return;

      setIsNotesLoading(true);
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setNotes(data);
          setIsNotesLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsNotesLoading(false);
      }
    };

    fetchNotes();
  }, [userId, activeTab, isNotesLoaded, supabase]);
  
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'note' | 'bookmark', title?: string } | null>(null);

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !userId) return;
    setIsSaving(true);

    try {
      if (editingNote) {
        const { data, error } = await supabase
          .from("notes")
          .update({ title: noteTitle, content: noteContent })
          .eq("id", editingNote)
          .select()
          .single();
          
        if (data) setNotes(prev => prev.map(n => n.id === editingNote ? data : n));
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert({ user_id: userId, title: noteTitle, content: noteContent })
          .select()
          .single();
          
        if (data) setNotes(prev => [data, ...prev]);
      }

      setNewNote(false);
      setEditingNote(null);
      setNoteTitle("");
      setNoteContent("");
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNote = (note: DbNote) => {
    setEditingNote(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNewNote(true);
  };

  const handleDeleteNote = (id: string, title: string) => {
    setItemToDelete({ id, type: 'note', title });
    setIsConfirmModalOpen(true);
  };

  const executeDeleteNote = async (id: string) => {
    // Optimistic UI update
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from("notes").delete().eq("id", id);
  };

  const handleCancel = () => {
    setNewNote(false);
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleDeleteBookmark = (id: string, title: string) => {
    setItemToDelete({ id, type: 'bookmark', title });
    setIsConfirmModalOpen(true);
  };

  const executeDeleteBookmark = async (id: string) => {
    // Optimistic UI update
    setRawBookmarks(prev => prev.filter(b => b.id !== id));
    await supabase.from("user_bookmarks").delete().eq("id", id);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'note') {
        await executeDeleteNote(itemToDelete.id);
      } else {
        await executeDeleteBookmark(itemToDelete.id);
      }
      setItemToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleViewBookmark = (bm: BookmarkItem) => {
    if (bm.type === "question" && bm.questionId) {
      router.push(`/bookmarks/question/${bm.questionId}`);
    } else if (bm.url) {
      window.open(bm.url, "_blank");
    }
  };

  // Compute filtered bookmarks based on raw bookmarks, subjects, search and type
  const bookmarks = rawBookmarks.filter(b => {
    if (b.subject) {
      return (subjects as any).includes(b.subject);
    }
    return true;
  }).map(b => ({
    ...b,
    savedAt: new Date(b.savedAt).toISOString().split("T")[0]
  }));

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || b.type === filterType;
    return matchesSearch && matchesType;
  });

  const onBack = () => {
    router.push("/study");
  };

  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl text-center">
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-primary-foreground/50 mx-auto hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Tools
            </button>
            <h1 className="text-3xl font-bold text-primary-foreground">
              Notes & <span className="text-accent">Bookmarks</span>
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/50">
              All your saved resources, exam questions, and personal notes in one place.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container max-w-4xl py-10">
        <ProFeatureLock label="Unlock Bookmarks with Pro Subscription">
          <Tabs defaultValue="bookmarks" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full max-w-xs">
              <TabsTrigger value="bookmarks" className="flex-1 gap-1.5">
                <Bookmark className="h-3.5 w-3.5" /> Bookmarks
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookmarks">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["all", "pdf", "rtp", "pyq", "mtp", "question", "spom"].map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={filterType === type ? "default" : "outline"}
                      onClick={() => setFilterType(type)}
                      className="text-xs capitalize"
                    >
                      {type === "all" ? "All" : typeLabel[type as keyof typeof typeLabel]}
                    </Button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <Bookmark className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No bookmarks found.</p>
                </div>
              ) : (
                <ScrollArea className="h-[480px] pr-1">
                  <div className="space-y-3">
                    {filteredBookmarks.map((bm, i) => {
                      const Icon = typeIcon[bm.type] || FileText;
                      return (
                        <motion.div
                          key={bm.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className="transition-shadow hover:shadow-md">
                            <CardContent className="flex items-start gap-4 p-4">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeBadgeClass[bm.type].split(' ')[0]}`}>
                                <Icon className={`h-5 w-5 ${typeBadgeClass[bm.type].split(' ')[1]}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-semibold text-card-foreground leading-snug">{bm.title}</h3>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadgeClass[bm.type]}`}>
                                    {typeLabel[bm.type]}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                  <div className="flex items-center gap-3">
                                    {bm.source}
                                    {bm.exam_year && <span> · {bm.exam_year}</span>}
                                    {bm.test_no && <span> · Test {bm.test_no}</span>}
                                    <span>·</span>
                                    <span>Saved {bm.savedAt}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7 text-accent" 
                                      onClick={() => handleViewBookmark(bm)}
                                      title="View"
                                    >
                                      {bm.type === "question" ? <Eye className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7 text-destructive" 
                                      onClick={() => handleDeleteBookmark(bm.id, bm.title)}
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="notes">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {!isNotesLoading && `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
                </p>
                {!newNote && (
                  <Button size="sm" onClick={() => setNewNote(true)} className="gap-1.5" disabled={isNotesLoading}>
                    <Plus className="h-3.5 w-3.5" /> New Note
                  </Button>
                )}
              </div>

              {newNote && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="mb-5 border-accent/30">
                    <CardContent className="space-y-3 p-4">
                      <Input
                        placeholder="Note title"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="text-sm font-medium"
                      />
                      <Textarea
                        placeholder="Write your note here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="min-h-[120px] text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving} className="gap-1.5">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveNote} disabled={isSaving || !noteTitle.trim()} className="gap-1.5">
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} 
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {isNotesLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 && !newNote ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <StickyNote className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No notes yet. Create your first note!</p>
                </div>
              ) : (
                <ScrollArea className="h-[440px] pr-1">
                  <div className="space-y-3">
                    {notes.map((note, i) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-card-foreground">{note.title}</h3>
                              <div className="flex shrink-0 gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteNote(note.id, note.title)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground leading-relaxed">
                              {note.content}
                            </p>
                            <p className="mt-3 text-[11px] text-muted-foreground/60">
                              Updated {new Date(note.updated_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </ProFeatureLock>
      </section>
      <Footer />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Remove ${itemToDelete?.type === 'note' ? 'Note' : 'Bookmark'}?`}
        description={`Are you sure you want to remove this ${itemToDelete?.type}? This action cannot be undone.`}
        confirmText="Remove"
      />
    </div>
  );
};

export default BookmarksClient;
