"use client"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Clock, ExternalLink, Check, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useStudent } from "@/components/StudentTypeProvider";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


type DbCalendarEvent = {
  id: string;
  title: string;
  category: "Exam" | "Mocks" | "Deadlines" | "Sessions" | "Todo" | "Announcement";
  type?: string;
  description: string;
  created_at: string;
  event_month: number;
  event_year: number;
  event_date: number;
  event_time: string;
  url?: string;
  done?: boolean;
};



const EVENT_CATEGORIES = ["Exam", "Mocks", "Deadlines", "Sessions", "Todo", "Announcement"] as const;
type EventCategory = typeof EVENT_CATEGORIES[number];

const CATEGORY_COLORS: Record<EventCategory, string> = {
  "Exam": "bg-rose-500/15 text-rose-600 border-rose-500/30 ring-rose-500 shadow-rose-100",
  "Mocks": "bg-blue-500/15 text-blue-600 border-blue-500/30 ring-blue-500 shadow-blue-100",
  "Deadlines": "bg-orange-500/15 text-orange-600 border-orange-500/30 ring-orange-500 shadow-orange-100",
  "Sessions": "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 ring-emerald-500 shadow-emerald-100",
  "Todo": "bg-purple-500/15 text-purple-600 border-purple-500/30 ring-purple-500 shadow-purple-100",
  "Announcement": "bg-amber-500/15 text-amber-600 border-amber-500/30 ring-amber-500 shadow-amber-100",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatSubjectName = (subject: string) => {
  return subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const ExamCalendarView = () => {
  const supabase = createClient();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<EventCategory | null>(null);
  
  const { studentLevel, subjects, loading: studentLoading } = useStudent();
  const [events, setEvents] = useState<DbCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Todo management state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<DbCalendarEvent | null>(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");

  // Use a ref to handle closing the popup when clicking outside
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (studentLoading) return;
      
      try {
        setIsLoading(true);
        // User's subjects + general events
        const allowedSubjects = ['general', ...subjects];
        
        // 1. Fetch Calendar Events
        const { data: calendarEvents } = await supabase
          .from("calendar_events")
          .select("*")
          .in('subject', allowedSubjects);

        // 2. Fetch User's Todos
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
        let userTodos: any[] = [];
        if (user) {
          const { data: fetchedTodos } = await supabase
            .from("todos")
            .select("*")
            .eq("user_id", user.id);
          if (fetchedTodos) {
            userTodos = fetchedTodos;
          }
        }

        // 3. Fetch Level-matched Announcements (student_level matches current level or is empty/null)
        let levelAnnouncements: any[] = [];
        let announcementsQuery = supabase.from("announcements").select("*");
        if (studentLevel) {
          announcementsQuery = announcementsQuery.or(`student_level.eq.${studentLevel},student_level.is.null`);
        } else {
          announcementsQuery = announcementsQuery.is("student_level", null);
        }
        const { data: fetchedAnnouncements } = await announcementsQuery;
        if (fetchedAnnouncements) {
          levelAnnouncements = fetchedAnnouncements;
        }


        // Combine and format all items as DbCalendarEvent
        const formattedEvents: DbCalendarEvent[] = [];

        if (calendarEvents) {
          calendarEvents.forEach((e) => {
            formattedEvents.push({
              id: e.id,
              title: e.title,
              category: (e.category || "Deadlines") as any,
              type: "event",
              description: e.description || "",
              created_at: e.created_at,
              event_month: e.event_month,
              event_year: e.event_year,
              event_date: e.event_date,
              event_time: e.event_time || "",
            });
          });
        }

        userTodos.forEach((todo) => {
          if (todo.todo_date) {
            const dateObj = new Date(todo.todo_date);
            if (!isNaN(dateObj.getTime())) {
              formattedEvents.push({
                id: todo.id,
                title: `To-Do: ${todo.text}`,
                category: "Todo",
                type: "todo",
                description: `Subject: ${formatSubjectName(todo.subject)}`,
                created_at: todo.created_at,
                event_month: dateObj.getMonth() + 1,
                event_year: dateObj.getFullYear(),
                event_date: dateObj.getDate(),
                event_time: todo.done ? "Completed" : "Pending",
                done: todo.done,
              });
            }
          }
        });

        const dateRegex = /^[A-Za-z]{3,9}\s\d{1,2},\s\d{4}$/;
        levelAnnouncements.forEach((ann) => {
          if (ann.date && dateRegex.test(ann.date.trim())) {
            const dateObj = new Date(ann.date.trim());
            if (!isNaN(dateObj.getTime())) {
              formattedEvents.push({
                id: ann.id,
                title: `ICAI Announcement: ${ann.title}`,
                category: "Announcement",
                type: "announcement",
                description: ann.summary || "",
                created_at: ann.created_at,
                event_month: dateObj.getMonth() + 1,
                event_year: dateObj.getFullYear(),
                event_date: dateObj.getDate(),
                event_time: "All Day",
                url: ann.url,
              });
            }
          }
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, subjects, studentLoading, studentLevel]);

  // --- Todo action handlers ---
  const handleMarkComplete = async (todoId: string) => {
    const { error } = await supabase
      .from("todos")
      .update({ done: true })
      .eq("id", todoId);
    if (error) {
      toast({ title: "Failed to mark as complete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task marked as complete!" });
      setEvents(prev => prev.map(e => 
        e.id === todoId ? { ...e, done: true, event_time: "Completed" } : e
      ));
    }
  };

  const handleDeleteTodo = async () => {
    if (!todoToDelete) return;
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", todoToDelete);
    if (error) {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task deleted" });
      setEvents(prev => prev.filter(e => e.id !== todoToDelete));
    }
    setTodoToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const openEditDialog = (ev: DbCalendarEvent) => {
    setEditingTodo(ev);
    setEditText(ev.title.replace(/^To-Do: /, ""));
    const d = new Date(ev.event_year, ev.event_month - 1, ev.event_date);
    setEditDate(d.toISOString().split("T")[0]);
    setEditDialogOpen(true);
  };

  const handleEditTodo = async () => {
    if (!editingTodo || !editText.trim() || !editDate) return;
    const dateObj = new Date(editDate);
    const { error } = await supabase
      .from("todos")
      .update({
        text: editText.trim(),
        todo_date: editDate,
      })
      .eq("id", editingTodo.id);
    if (error) {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task updated" });
      setEvents(prev => prev.map(e =>
        e.id === editingTodo.id
          ? {
              ...e,
              title: `To-Do: ${editText.trim()}`,
              event_month: dateObj.getMonth() + 1,
              event_year: dateObj.getFullYear(),
              event_date: dateObj.getDate(),
            }
          : e
      ));
    }
    setEditDialogOpen(false);
    setEditingTodo(null);
  };

  // Compute overdue todos
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTodos = events.filter(e => {
    if (e.type !== "todo" || e.done) return false;
    const eventDate = new Date(e.event_year, e.event_month - 1, e.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12 matching DB schema (event_month)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  };

  // Filter events for the current month and selected category filter
  const monthEvents = events.filter(
    (e) => e.event_month === month && e.event_year === year && (!filterCategory || e.category === filterCategory)
  );

  const getEventsForDay = (day: number) => monthEvents.filter((e) => e.event_date === day);

  const onBack = () => {
    router.push("/study");
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (isLoading) return  <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-24"
              >
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-4 text-muted-foreground text-sm font-medium">Loading Calendar Events...</p>
              </motion.div>;

  return (
    <><section className="bg-primary py-16 mx-auto w-full text-center">
            <div className="container">
              <div className="mx-auto">
                <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs text-primary-foreground/50  mx-auto hover:text-primary-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Tools
                </button>
                <h1 className="text-3xl font-bold text-primary-foreground">Calendar <span className="text-gradient-blue">Events</span></h1>
                <p className="mt-2 text-sm text-primary-foreground/50">ICAI exam dates, registration alerts, and reminders.</p>
              </div>
            </div>
          </section>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-8">
      {/* <Button variant="ghost" onClick={onBack} className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Study Tools
      </Button> */}

     

      {/* Category Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filterCategory === null ? "default" : "outline"}
          onClick={() => setFilterCategory(null)}
          className={filterCategory === null ? "bg-accent text-accent-foreground" : ""}
        >
          All Events
        </Button>
        {EVENT_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant="outline"
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
            className={
              filterCategory === cat
                ? `${CATEGORY_COLORS[cat]} ring-1 !ring-current shadow-sm`
                : "bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground transition-all"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card className="shadow-card" ref={calendarRef}>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg">{MONTHS[month - 1]} {year}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            
            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate === day;
                const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();

                return (
                  <div key={day} className="relative aspect-square">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`h-full w-full flex flex-col items-center justify-start rounded-lg p-1 text-sm transition-colors
                        ${isSelected ? "bg-accent text-accent-foreground ring-2 ring-accent" : "hover:bg-secondary"}
                        ${isToday && !isSelected ? "ring-1 ring-accent/50" : ""}
                      `}
                    >
                      <span className={`text-xs font-medium ${isToday ? "font-bold" : ""}`}>{day}</span>
                     {dayEvents.length > 0 && (
  <div className="mt-1 flex w-full flex-col gap-1 px-1">
    {dayEvents.slice(0, 3).map((ev) => {
      const categoryColor = CATEGORY_COLORS[ev.category] || "bg-primary text-primary-foreground border border-input";

      return (
        <div
          key={ev.id}
          className={`${categoryColor} w-full truncate rounded-md px-1.5 py-[2px] text-[10px] font-medium`}
        >
          {ev.event_time ? `${ev.event_time} ` : ''}
          {ev.title}
        </div>
      )
    })}

    {dayEvents.length > 3 && (
      <span className="text-[9px] font-medium text-muted-foreground pl-1">
        +{dayEvents.length - 3} more
      </span>
    )}
  </div>
)}
                    </motion.button>

                    {/* IN-CALENDAR POPOVER / TOOLTIP */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute left-[-50%] top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border bg-background p-4 shadow-xl"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              {MONTHS[month - 1]} {day}, {year}
                            </h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="max-h-[200px] space-y-3 overflow-y-auto pr-1">
                            {dayEvents.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No events scheduled.</p>
                            ) : (
                              dayEvents.map((ev) => (
                                <div key={ev.id} className={`rounded-lg border p-2.5 ${CATEGORY_COLORS[ev.category] || "bg-secondary text-secondary-foreground"}`}>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                                    {ev.category}
                                  </span>
                                  <p className="mt-0.5 text-sm font-medium leading-tight">{ev.title}</p>
                                  {ev.event_time && (
                                    <div className="mt-1.5 flex items-center gap-1 opacity-80">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-[10px]">{ev.event_time}</span>
                                    </div>
                                  )}
                                  {ev.description && <p className="mt-1 text-xs opacity-70">{ev.description}</p>}
                                  {ev.url && (
                                    <a
                                      href={ev.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline"
                                    >
                                      View Announcement <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                  {/* Todo action buttons */}
                                  {ev.type === "todo" && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                      {!ev.done && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 px-2 text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                                          onClick={(e) => { e.stopPropagation(); handleMarkComplete(ev.id); }}
                                        >
                                          <Check className="h-3 w-3" /> Done
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[10px] gap-1"
                                        onClick={(e) => { e.stopPropagation(); openEditDialog(ev); }}
                                      >
                                        <Pencil className="h-3 w-3" /> Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[10px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); setTodoToDelete(ev.id); setDeleteConfirmOpen(true); }}
                                      >
                                        <Trash2 className="h-3 w-3" /> Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Quick Upcoming Events + Overdue */}
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {overdueTodos.length > 0 && (
            <Card className="shadow-card border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Overdue Tasks ({overdueTodos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueTodos.slice(0, 8).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 group">
                    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border ${CATEGORY_COLORS["Todo"]}`}>
                      <span className="text-[10px] font-bold leading-none">{MONTHS[ev.event_month - 1]?.slice(0, 3)}</span>
                      <span className="text-xs font-bold leading-none">{ev.event_date}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{ev.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{ev.description}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 px-1.5 text-[9px] gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                          onClick={() => handleMarkComplete(ev.id)}
                        >
                          <Check className="h-2.5 w-2.5" /> Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 px-1.5 text-[9px] gap-0.5"
                          onClick={() => openEditDialog(ev)}
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 px-1.5 text-[9px] gap-0.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => { setTodoToDelete(ev.id); setDeleteConfirmOpen(true); }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upcoming This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {monthEvents
                .filter(e => e.event_date >= new Date().getDate() || month !== (new Date().getMonth() + 1))
                .sort((a, b) => a.event_date - b.event_date)
                .slice(0, 5)
                .map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border ${CATEGORY_COLORS[ev.category] || ""}`}>
                    <span className="text-xs font-bold leading-none">{ev.event_date}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{ev.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {ev.category}
                    </p>
                  </div>
                </div>
              ))}
              {monthEvents.length === 0 && (
                <p className="text-xs text-muted-foreground">No upcoming events this month.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>

    {/* Delete confirmation modal */}
    <ConfirmModal
      isOpen={deleteConfirmOpen}
      onClose={() => { setDeleteConfirmOpen(false); setTodoToDelete(null); }}
      onConfirm={handleDeleteTodo}
      title="Delete Task?"
      description="Are you sure you want to delete this to-do task? This action cannot be undone."
      confirmText="Delete"
      variant="destructive"
    />

    {/* Edit todo dialog */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Description</label>
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Task description..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTodo} disabled={!editText.trim() || !editDate}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ExamCalendarView;