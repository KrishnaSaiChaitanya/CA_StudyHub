"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Pencil, CheckCircle2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";
import {
  seedDefaultPlannerData,
  upsertPlannerSubject,
  deletePlannerSubject,
  upsertPlannerChapter,
  deletePlannerChapter,
  upsertPlannerSubtopic,
  deletePlannerSubtopic,
} from "./actions";

export default function AdminPracticePlanner() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Master Data States
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);

  // Selected Item States (for Drilldown)
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Modal Dialog States
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [subtopicModalOpen, setSubtopicModalOpen] = useState(false);

  // Form Edit States
  const [editSubject, setEditSubject] = useState<any>(null);
  const [editChapter, setEditChapter] = useState<any>(null);
  const [editSubtopic, setEditSubtopic] = useState<any>(null);

  // Form Fields
  const [subSlug, setSubSlug] = useState<string>("");
  const [subName, setSubName] = useState("");
  const [subShort, setSubShort] = useState("");
  const [subLevel, setSubLevel] = useState<StudentLevel>("intermediate");
  const [subWeight, setSubWeight] = useState("1.0");

  const [chTopic, setChTopic] = useState("");
  const [chHours, setChHours] = useState("5.0");
  const [chOrder, setChOrder] = useState("1");

  const [stName, setStName] = useState("");
  const [stOrder, setStOrder] = useState("1");

  // Fetch Master Data
  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("planner_subjects")
      .select("*")
      .order("level", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data) {
      setSubjects(data);
    }
    setLoading(false);
  };

  const fetchChapters = async (slug: string) => {
    const { data, error } = await supabase
      .from("planner_chapters")
      .select("*")
      .eq("subject_slug", slug)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setChapters(data);
    }
  };

  const fetchSubtopics = async (chapterId: string) => {
    const { data, error } = await supabase
      .from("planner_subtopics")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setSubtopics(data);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Subject Selection
  const handleSelectSubject = (slug: string) => {
    setSelectedSubjectSlug(slug);
    setSelectedChapterId(null);
    setChapters([]);
    setSubtopics([]);
    fetchChapters(slug);
  };

  // Chapter Selection
  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSubtopics([]);
    fetchSubtopics(chapterId);
  };

  // Seeding Action
  const handleSeed = async () => {
    if (!confirm("This will seed all default subjects, base weights, and core chapters. Do you want to proceed?")) return;
    setSeeding(true);
    const res = await seedDefaultPlannerData();
    setSeeding(false);
    if (res.success) {
      toast.success(res.message);
      await fetchSubjects();
      setSelectedSubjectSlug(null);
      setSelectedChapterId(null);
    } else {
      toast.error(res.error || "Failed to seed default data");
    }
  };

  // Subject Forms
  const openAddSubject = () => {
    setEditSubject(null);
    setSubSlug("");
    setSubName("");
    setSubShort("");
    setSubLevel("intermediate");
    setSubWeight("1.0");
    setSubjectModalOpen(true);
  };

  const openEditSubject = (sub: any) => {
    setEditSubject(sub);
    setSubSlug(sub.slug);
    setSubName(sub.name);
    setSubShort(sub.short_name);
    setSubLevel(sub.level);
    setSubWeight(sub.base_weight.toString());
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await upsertPlannerSubject({
      id: editSubject?.id,
      slug: subSlug as SubjectCategory,
      name: subName,
      short_name: subShort,
      level: subLevel,
      base_weight: parseFloat(subWeight) || 1.0,
    });
    setSaving(false);
    if (res.success) {
      toast.success(`Subject ${editSubject ? "updated" : "created"} successfully!`);
      setSubjectModalOpen(false);
      await fetchSubjects();
    } else {
      toast.error(res.error || "Failed to save subject");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject? All its chapters & subtopics will be removed.")) return;
    const res = await deletePlannerSubject(id);
    if (res.success) {
      toast.success("Subject deleted!");
      setSelectedSubjectSlug(null);
      setSelectedChapterId(null);
      await fetchSubjects();
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  // Chapter Forms
  const openAddChapter = () => {
    if (!selectedSubjectSlug) return;
    setEditChapter(null);
    setChTopic("");
    setChHours("5.0");
    setChOrder((chapters.length + 1).toString());
    setChapterModalOpen(true);
  };

  const openEditChapter = (ch: any) => {
    setEditChapter(ch);
    setChTopic(ch.topic);
    setChHours(ch.hours.toString());
    setChOrder(ch.sort_order.toString());
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectSlug) return;
    setSaving(true);
    const res = await upsertPlannerChapter({
      id: editChapter?.id,
      subject_slug: selectedSubjectSlug as SubjectCategory,
      topic: chTopic,
      hours: parseFloat(chHours) || 0.0,
      sort_order: parseInt(chOrder) || 1,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Chapter saved!");
      setChapterModalOpen(false);
      await fetchChapters(selectedSubjectSlug);
    } else {
      toast.error(res.error || "Failed to save chapter");
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Delete chapter and its subtopics?")) return;
    const res = await deletePlannerChapter(id);
    if (res.success) {
      toast.success("Chapter deleted!");
      setSelectedChapterId(null);
      if (selectedSubjectSlug) fetchChapters(selectedSubjectSlug);
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  // Subtopic Forms
  const openAddSubtopic = () => {
    if (!selectedChapterId) return;
    setEditSubtopic(null);
    setStName("");
    setStOrder((subtopics.length + 1).toString());
    setSubtopicModalOpen(true);
  };

  const openEditSubtopic = (st: any) => {
    setEditSubtopic(st);
    setStName(st.name);
    setStOrder(st.sort_order.toString());
    setSubtopicModalOpen(true);
  };

  const handleSaveSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) return;
    setSaving(true);
    const res = await upsertPlannerSubtopic({
      id: editSubtopic?.id,
      chapter_id: selectedChapterId,
      name: stName,
      sort_order: parseInt(stOrder) || 1,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Subtopic saved!");
      setSubtopicModalOpen(false);
      await fetchSubtopics(selectedChapterId);
    } else {
      toast.error(res.error || "Failed to save subtopic");
    }
  };

  const handleDeleteSubtopic = async (id: string) => {
    if (!confirm("Delete subtopic?")) return;
    const res = await deletePlannerSubtopic(id);
    if (res.success) {
      toast.success("Subtopic deleted!");
      if (selectedChapterId) fetchSubtopics(selectedChapterId);
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Loading Study Planning Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Study Planning Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure subjects, base weights, chapters, and sub-topics for student trackers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchSubjects} title="Reload Data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seeding}
            className="border-primary/30 text-primary hover:bg-primary/5 font-semibold"
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ListPlus className="h-4 w-4 mr-2" />}
            Seed Default Data
          </Button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* 1. Subjects Panel */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">1. Subjects</CardTitle>
              <CardDescription className="text-xs">Select a subject to drill down</CardDescription>
            </div>
            <Button size="sm" onClick={openAddSubject} className="h-7 px-2">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">No subjects configured.</div>
            ) : (
              subjects.map((sub) => {
                const isActive = selectedSubjectSlug === sub.slug;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub.slug)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border text-xs ${
                      isActive
                        ? "bg-accent/15 border-accent text-foreground font-bold shadow-sm"
                        : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate text-foreground">{sub.name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="uppercase text-[9px] font-bold text-muted-foreground">{sub.level}</span>
                        <span className="text-[9px] text-accent font-bold">Weight: {sub.base_weight}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditSubject(sub);
                        }}
                        className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub.id);
                        }}
                        className="p-1.5 hover:bg-red-500/10 rounded-full text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 2. Chapters Panel */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">2. Chapters</CardTitle>
              <CardDescription className="text-xs">Select a chapter to manage subtopics</CardDescription>
            </div>
            <Button
              size="sm"
              disabled={!selectedSubjectSlug}
              onClick={openAddChapter}
              className="h-7 px-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {!selectedSubjectSlug ? (
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                Select a subject from the left panel.
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                No chapters defined. Click Add to create one.
              </div>
            ) : (
              chapters.map((ch) => {
                const isActive = selectedChapterId === ch.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => handleSelectChapter(ch.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border text-xs ${
                      isActive
                        ? "bg-accent/15 border-accent text-foreground font-bold shadow-sm"
                        : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-foreground truncate">
                        <span className="text-muted-foreground font-mono mr-1.5 text-[10px]">{ch.sort_order}.</span>
                        {ch.topic}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-semibold mt-1">
                        Est. Hours: {ch.hours} hours
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditChapter(ch);
                        }}
                        className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(ch.id);
                        }}
                        className="p-1.5 hover:bg-red-500/10 rounded-full text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 3. Subtopics Panel */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">3. Subtopics</CardTitle>
              <CardDescription className="text-xs">Manage chapter subtopics</CardDescription>
            </div>
            <Button
              size="sm"
              disabled={!selectedChapterId}
              onClick={openAddSubtopic}
              className="h-7 px-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {!selectedChapterId ? (
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                Select a chapter from the middle panel.
              </div>
            ) : subtopics.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                No subtopics created. Click Add to create one.
              </div>
            ) : (
              subtopics.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/10 text-xs transition-colors"
                >
                  <div className="truncate pr-2 font-medium text-foreground">
                    <span className="text-muted-foreground font-mono mr-1.5 text-[10px]">{st.sort_order}.</span>
                    {st.name}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditSubtopic(st)}
                      className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubtopic(st.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-full text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- Dialog Modals --- */}

      {/* Subject Upsert Modal */}
      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">
              {editSubject ? "Edit Subject" : "Create New Subject"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Unique Slug</label>
              <Input
                required
                disabled={!!editSubject}
                value={subSlug}
                onChange={(e) => setSubSlug(e.target.value)}
                placeholder="principles_and_practice_of_accounting"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subject Name</label>
              <Input
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Principles and Practice of Accounting"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Abbreviation / Short Name</label>
              <Input
                required
                value={subShort}
                onChange={(e) => setSubShort(e.target.value)}
                placeholder="Accounting"
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Student Level</label>
                <Select value={subLevel} onValueChange={(val) => setSubLevel(val as StudentLevel)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Level" /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Base Weight (Default Days)</label>
                <Input
                  required
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={subWeight}
                  onChange={(e) => setSubWeight(e.target.value)}
                  placeholder="6.0"
                  className="text-xs"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full font-bold mt-4">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editSubject ? "Update Subject" : "Create Subject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chapter Upsert Modal */}
      <Dialog open={chapterModalOpen} onOpenChange={setChapterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">
              {editChapter ? "Edit Chapter" : "Add Chapter"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveChapter} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Topic Name</label>
              <Input
                required
                value={chTopic}
                onChange={(e) => setChTopic(e.target.value)}
                placeholder="Theoretical Framework"
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Estimated Hours</label>
                <Input
                  required
                  type="number"
                  step="0.5"
                  min="0.0"
                  value={chHours}
                  onChange={(e) => setChHours(e.target.value)}
                  placeholder="5.0"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sort Order</label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={chOrder}
                  onChange={(e) => setChOrder(e.target.value)}
                  placeholder="1"
                  className="text-xs"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full font-bold mt-4">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editChapter ? "Update Chapter" : "Add Chapter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subtopic Upsert Modal */}
      <Dialog open={subtopicModalOpen} onOpenChange={setSubtopicModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">
              {editSubtopic ? "Edit Subtopic" : "Add Subtopic"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubtopic} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subtopic Title</label>
              <Input
                required
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                placeholder="Meaning & Scope of Accounting"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Sort Order</label>
              <Input
                required
                type="number"
                min="1"
                value={stOrder}
                onChange={(e) => setStOrder(e.target.value)}
                placeholder="1"
                className="text-xs"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full font-bold mt-4">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editSubtopic ? "Update Subtopic" : "Add Subtopic"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
