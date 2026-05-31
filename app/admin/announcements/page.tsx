"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableFilters } from "@/components/admin/TableFilters";

export default function AnnouncementsDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ column: "title", value: "" });

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState("general");
  const [studentLevel, setStudentLevel] = useState<string>("all");

  const STUDENT_LEVELS = ["all", "foundation", "intermediate", "final"] as const;
  const TAGS = ["general", "Exam Schedule", "Syllabus", "Registration", "Event", "Results", "Study Material"];

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });

    if (data) setAnnouncements(data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (announcement: any) => {
    setTitle(announcement.title);
    setDate(announcement.date || "");
    setSummary(announcement.summary);
    setUrl(announcement.url);
    setTag(announcement.tag);
    setStudentLevel(announcement.student_level || "all");
    setEditingId(announcement.id);
    setShowAdd(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      date: date || null,
      summary,
      url,
      tag,
      student_level: studentLevel === "all" ? null : studentLevel
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('announcements').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('announcements').insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingId ? 'updating' : 'adding'} announcement`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Announcement ${editingId ? 'updated' : 'added'}!` });
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) fetchData();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDate("");
    setSummary("");
    setUrl("");
    setTag("general");
    setStudentLevel("all");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Manage announcements for students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Announcement
          </Button>
        </div>
      </div>

      <TableFilters 
        columns={[
          { key: "title", label: "Title" },
          { key: "tag", label: "Tag" },
          { key: "student_level", label: "Level" }
        ]} 
        onFilterChange={setFilters}
        placeholder="Search announcements..."
      />

      <Dialog open={showAdd} onOpenChange={(open) => {
        setShowAdd(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Add New Announcement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Title</label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement Title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date (String, Optional)</label>
              <Input value={date} onChange={e => setDate(e.target.value)} placeholder="e.g., March 15, 2025" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.icai.org" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag</label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger><SelectValue placeholder="Select Tag" /></SelectTrigger>
                <SelectContent>
                  {TAGS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Student Level</label>
              <Select value={studentLevel} onValueChange={setStudentLevel}>
                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                <SelectContent>
                  {STUDENT_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === "all" ? "All Users" : level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Summary</label>
              <Input required value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief summary of the announcement" />
            </div>

            <div className="col-span-full pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Update Announcement" : "Save Announcement")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.filter(e => {
                if (!filters.value) return true;
                const field = e[filters.column];
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No announcements found matching your filter.</TableCell>
                </TableRow>
              )}
              {announcements.filter(e => {
                if (!filters.value) return true;
                const field = e[filters.column];
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      {e.tag}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{e.student_level || "All Users"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(e)} className="text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
