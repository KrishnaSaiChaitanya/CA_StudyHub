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
import { SUBJECT_ABBREVIATIONS, formatSubjectName } from "@/utils/subjects";
import { SubjectCategory } from "@/types/database.types";
import { TableFilters } from "@/components/admin/TableFilters";

export default function EventsDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ column: "title", value: "" });

  // Form State
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Exam");
  const [subject, setSubject] = useState<string>("general");
  const EVENT_CATEGORIES = ["Exam", "Mocks", "Deadlines", "Sessions"] as const;
  type EventCategory = typeof EVENT_CATEGORIES[number];

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('calendar_events').select('*').order('created_at', { ascending: false });

    if (data) setEvents(data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (event: any) => {
    setTitle(event.title);
    setEventDate(event.event_date.toString());
    setEventMonth(event.event_month.toString());
    setEventYear(event.event_year.toString());
    setEventTime(event.event_time);
    setDescription(event.description || "");
    setCategory(event.category || "Exam");
    setSubject(event.subject || "general");
    setEditingId(event.id);
    setShowAdd(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      event_date: parseInt(eventDate) || 1,
      event_month: parseInt(eventMonth) || 1,
      event_year: parseInt(eventYear) || new Date().getFullYear(),
      event_time: eventTime,
      description: description || null,
      category: category,
      subject: subject
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('calendar_events').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('calendar_events').insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingId ? 'updating' : 'adding'} event`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Event ${editingId ? 'updated' : 'added'}!` });
      setTitle(""); setEventDate(""); setEventMonth(""); setEventYear(""); setEventTime(""); setDescription(""); setCategory("Exam"); setSubject("general");
      setEditingId(null);
      setShowAdd(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar Events</h1>
          <p className="text-muted-foreground mt-1">Manage events for the study calendar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => { setEditingId(null); setTitle(""); setEventDate(""); setEventMonth(""); setEventYear(""); setEventTime(""); setDescription(""); setCategory("Exam"); setSubject("general"); setShowAdd(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      <TableFilters 
        columns={[
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "subject", label: "Subject" },
          { key: "event_time", label: "Time" },
          { key: "event_date", label: "Day" },
          { key: "event_month", label: "Month" },
          { key: "event_year", label: "Year" }
        ]} 
        onFilterChange={setFilters}
        placeholder="Search events..."
      />

      <Dialog open={showAdd} onOpenChange={(open) => {
        setShowAdd(open);
        if (!open) {
          setEditingId(null);
          setTitle(""); setEventDate(""); setEventMonth(""); setEventYear(""); setEventTime(""); setDescription(""); setCategory("Exam"); setSubject("general");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Time (Optional)</label>
              <Input value={eventTime} onChange={e => setEventTime(e.target.value)} placeholder="e.g., 3:00 PM" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date (Day)</label>
              <Input type="number" required min="1" max="31" value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="e.g., 5" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Input type="number" required min="1" max="12" value={eventMonth} onChange={e => setEventMonth(e.target.value)} placeholder="e.g., 3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Input type="number" required min="2000" value={eventYear} onChange={e => setEventYear(e.target.value)} placeholder="e.g., 2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(SUBJECT_ABBREVIATIONS).map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {formatSubjectName(sub as SubjectCategory)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the event" />
            </div>

            <div className="col-span-full pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Update Event" : "Save Event")}
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
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.filter(e => {
                if (!filters.value) return true;
                const field = e[filters.column];
                if (filters.column === "subject") {
                   const subjectName = formatSubjectName(e.subject as any);
                   return subjectName.toLowerCase().includes(filters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No events found matching your filter.</TableCell>
                </TableRow>
              )}
              {events.filter(e => {
                if (!filters.value) return true;
                const field = e[filters.column];
                if (filters.column === "subject") {
                   const subjectName = formatSubjectName(e.subject as any);
                   return subjectName.toLowerCase().includes(filters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.event_date}/{e.event_month}/{e.event_year}</TableCell>
                  <TableCell>{e.event_time}</TableCell>
                  <TableCell>{e.category || '-'}</TableCell>
                  <TableCell>{formatSubjectName(e.subject as any ?? "")}</TableCell>
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
