"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Todo as TodoType, SubjectCategory } from "@/utils/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_ABBREVIATIONS, getSubjectAbbreviation } from "@/utils/subjects";

interface TodoListCardProps {
  userId: string | null;
  subjects: SubjectCategory[];
  dynamicSubjects: { label: string; value: string; color: string }[];
  getSubjectColor: (val: string) => string;
}

export const TodoListCard = ({
  userId,
  subjects,
  dynamicSubjects,
  getSubjectColor,
}: TodoListCardProps) => {
  const supabase = createClient();
  const { toast } = useToast();

  const [todos, setTodos] = useState<TodoType[]>([]);
  const [todoFilter, setTodoFilter] = useState<string>("All");
  const [newTodo, setNewTodo] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const dayKey = useCallback((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }, []);

  const todayKey = useMemo(() => {
    return dayKey(new Date());
  }, [dayKey]);

  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  const fetchTodos = async (uid: string) => {
    let todosQuery = supabase.from('todos').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (subjects.length > 0) {
      todosQuery = todosQuery.in('subject', [...subjects, "general"]);
    }
    const { data } = await todosQuery;
    if (data) setTodos(data);
  };

  useEffect(() => {
    if (userId) {
      fetchTodos(userId);
    }
  }, [userId, subjects]);

  const toggleTodo = async (id: string) => {
    const todoToToggle = todos.find((t) => t.id === id);
    if (!todoToToggle) return;
    const newDone = !todoToToggle.done;
    setTodos((t) => t.map((todo) => (todo.id === id ? { ...todo, done: newDone } : todo)));
    const { error } = await supabase.from('todos').update({ done: newDone }).eq('id', id);
    if (error) {
      setTodos((t) => t.map((todo) => (todo.id === id ? { ...todo, done: !newDone } : todo)));
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((t) => t.filter((todo) => todo.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !userId) return;
    setIsAddingTodo(true);
    const subject = todoFilter === "All" ? 'general' as SubjectCategory : (todoFilter as SubjectCategory);

    const { data, error } = await supabase.from('todos').insert({
      user_id: userId,
      text: newTodo.trim(),
      subject: subject,
      todo_date: selectedDay,
      done: false
    }).select().single();

    if (!error && data) {
      setTodos((prev) => [data, ...prev]);
      setNewTodo("");
    } else {
      toast({ title: "Failed to add task", variant: "destructive" });
    }
    setIsAddingTodo(false);
  };

  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchesDay = t.todo_date === selectedDay;
      const matchesSubject = todoFilter === "All" ? true : t.subject === todoFilter;
      return matchesDay && matchesSubject;
    });
  }, [todos, selectedDay, todoFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col h-[700px]"
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-sm font-semibold text-card-foreground">To-Do List</h2>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{filteredTodos.length} tasks</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4 shrink-0">
        {days.map((d) => {
          const key = dayKey(d);
          const isSelected = key === selectedDay;
          const isToday = key === todayKey;
          const count = todos.filter((t) => t.todo_date === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`relative flex flex-col items-center rounded-lg py-1.5 transition-all ${isSelected
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              <span className="text-[9px] font-medium uppercase">
                {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)}
              </span>
              <span className="text-xs font-bold">{d.getDate()}</span>
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
              )}
              {count > 0 && !isToday && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-muted-foreground/30" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3 shrink-0">
        {selectedDay === todayKey
          ? "Today's tasks"
          : new Date(selectedDay).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4 max-h-24 overflow-y-auto shrink-0">
        <button
          onClick={() => setTodoFilter("All")}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${todoFilter === "All"
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
        >
          All
        </button>
        {[{ value: 'general', label: 'General', color: getSubjectColor('general') }, ...dynamicSubjects].map((s) => {
          const isSelected = todoFilter === s.value;
          const subjColor = s.color;
          return (
            <button
              key={s.value}
              onClick={() => setTodoFilter(s.value)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${isSelected
                  ? "text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              style={isSelected ? { backgroundColor: subjColor } : {}}
            >
              {SUBJECT_ABBREVIATIONS[s.value as SubjectCategory]}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4 shrink-0">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          disabled={isAddingTodo}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={addTodo} disabled={isAddingTodo}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
        <AnimatePresence>
          {filteredTodos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-secondary/60 transition-colors"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${todo.done
                    ? "border-accent bg-accent"
                    : "border-border hover:border-accent/50"
                  }`}
              >
                {todo.done && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs leading-relaxed ${todo.done ? "text-muted-foreground line-through" : "text-card-foreground"
                    }`}
                >
                  {todo.text}
                </p>
                <span
                  className="inline-block mt-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                  style={{
                    backgroundColor: `${getSubjectColor(todo.subject)}20`,
                    color: getSubjectColor(todo.subject),
                  }}
                >
                  {getSubjectAbbreviation(todo.subject)}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </motion.div>
          ))}
          {filteredTodos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks found.</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
