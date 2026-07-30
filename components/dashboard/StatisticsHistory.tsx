"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Check, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { SUBJECT_COLOR_MAP, SUBJECT_ABBREVIATIONS } from "@/utils/subjects";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { SubjectCategory } from "@/utils/supabase/types";

const SUBJECTS = Object.keys(SUBJECT_COLOR_MAP);
const SUBJECT_COLORS = SUBJECT_COLOR_MAP as Record<string, string>;

interface HistoryDay {
    date: string; // YYYY-MM-DD
    totalHours: number;
    tasksCompleted: number;
    tasksTotal: number;
    breakdown: Record<string, number>;
}

interface StatisticsHistoryProps {
    userId: string;
}

const dayKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
};

export const StatisticsHistory = ({ userId }: StatisticsHistoryProps) => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<HistoryDay[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all study sessions for this user
                const { data: sessions, error: sessionsError } = await supabase
                    .from("study_sessions")
                    .select("category, duration_seconds, session_date, created_at")
                    .eq("user_id", userId);

                if (sessionsError) throw sessionsError;

                // Fetch all todos for this user
                const { data: todos, error: todosError } = await supabase
                    .from("todos")
                    .select("subject, todo_date, done, created_at")
                    .eq("user_id", userId);

                if (todosError) throw todosError;

                // Group sessions by date
                const sessionsByDate: Record<string, typeof sessions> = {};
                sessions?.forEach((s) => {
                    const dStr = s.session_date || dayKey(new Date(s.created_at));
                    if (!sessionsByDate[dStr]) {
                        sessionsByDate[dStr] = [];
                    }
                    sessionsByDate[dStr].push(s);
                });

                // Group todos by date
                const todosByDate: Record<string, typeof todos> = {};
                todos?.forEach((t) => {
                    const dStr = t.todo_date || dayKey(new Date(t.created_at));
                    if (!todosByDate[dStr]) {
                        todosByDate[dStr] = [];
                    }
                    todosByDate[dStr].push(t);
                });

                // Get all unique dates
                const allDates = new Set([
                    ...Object.keys(sessionsByDate),
                    ...Object.keys(todosByDate),
                ]);

                // Construct history data array
                const formattedData: HistoryDay[] = Array.from(allDates).map((dateStr) => {
                    const daySessions = sessionsByDate[dateStr] || [];
                    const dayTodos = todosByDate[dateStr] || [];

                    const breakdown: Record<string, number> = {};
                    let totalHours = 0;
                    daySessions.forEach((s) => {
                        const hours = s.duration_seconds / 3600;
                        const cat = s.category;
                        breakdown[cat] = (breakdown[cat] || 0) + hours;
                        totalHours += hours;
                    });

                    const tasksCompleted = dayTodos.filter((t) => t.done).length;
                    const tasksTotal = dayTodos.length;

                    return {
                        date: dateStr,
                        totalHours,
                        tasksCompleted,
                        tasksTotal,
                        breakdown,
                    };
                });

                setHistoryData(formattedData);
            } catch (error) {
                console.error("Error loading statistics history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, supabase]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
            </div>
        );
    }

    return <HistoryGraph historyData={historyData} />;
};

const HistoryGraph = ({ historyData }: { historyData: HistoryDay[] }) => {
    console.log(historyData);

    const { subjects } = useStudent();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [endDate, setEndDate] = useState<Date>(today);
    const [rangeDays, setRangeDays] = useState<number>(7);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeDate, setActiveDate] = useState<string | null>(null);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (rangeDays - 1));

    const startKey = dayKey(startDate);
    const endKey = dayKey(endDate);

    const rangeData = historyData.filter((d) => {
        return d.date >= startKey && d.date <= endKey;
    });

    // Fill missing days
    const filled: HistoryDay[] = [];
    for (let i = 0; i < rangeDays; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = dayKey(d);
        const existing = rangeData.find((r) => r.date === key);
        filled.push(existing || { date: key, totalHours: 0, tasksCompleted: 0, tasksTotal: 0, breakdown: {} });
    }

    const chartData = filled.map((d) => {
        const dt = new Date(d.date);
        return {
            date: d.date,
            label: dt.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
            total: d.totalHours,
            ...d.breakdown,
        };
    });

    const totalH = filled.reduce((a, b) => a + b.totalHours, 0);
    const avgH = totalH / rangeDays;
    const tasksDone = filled.reduce((a, b) => a + b.tasksCompleted, 0);
    const tasksTotal = filled.reduce((a, b) => a + b.tasksTotal, 0);

    const activeDay = activeDate ? filled.find((d) => d.date === activeDate) : filled[filled.length - 1];

    const shiftRange = (dir: -1 | 1) => {
        const next = new Date(endDate);
        next.setDate(next.getDate() + dir * rangeDays);
        if (next > today) return;
        setEndDate(next);
        setActiveDate(null);
    };

    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    {[7, 14, 30].map((n) => (
                        <button
                            key={n}
                            onClick={() => { setRangeDays(n); setActiveDate(null); }}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                rangeDays === n ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            {n}D
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => shiftRange(-1)}>‹</Button>
                    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {fmt(startDate)} – {fmt(endDate)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(d) => { if (d) { setEndDate(d); setActiveDate(null); setPickerOpen(false); } }}
                                disabled={(d) => d > today}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => shiftRange(1)}
                        disabled={endDate.getTime() >= today.getTime()}
                    >›</Button>
                </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-lg font-bold text-card-foreground">{totalH.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">Total studied</p>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-lg font-bold text-card-foreground">{avgH.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">Daily average</p>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-lg font-bold text-card-foreground">{tasksDone}<span className="text-xs text-muted-foreground">/{tasksTotal}</span></p>
                    <p className="text-[10px] text-muted-foreground">Tasks done</p>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-border bg-card p-3">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                            onClick={(e: any) => {
                                if (e && e.activeLabel) {
                                    const found = chartData.find((c) => c.label === e.activeLabel);
                                    if (found) setActiveDate(found.date);
                                }
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={rangeDays > 14 ? Math.floor(rangeDays / 10) : 0} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="h" />
                            <Tooltip
                                cursor={{ fill: "hsl(var(--secondary))", opacity: 0.5 }}
                                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                                formatter={(v: number, name: string) => [`${v.toFixed(1)}h`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                            {subjects.map((s) => (
                                <Bar
                                    key={s}
                                    dataKey={s}
                                    stackId="a"
                                    fill={SUBJECT_COLORS[s] || "hsl(210 20% 50%)"}
                                    radius={[0, 0, 0, 0]}
                                    name={SUBJECT_ABBREVIATIONS[s] || s}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Selected-day detail */}
            {activeDay && (
                <div className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-sm font-semibold text-card-foreground">
                                {new Date(activeDay.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Click any bar to inspect a day</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" /> <span className="font-medium text-card-foreground">{activeDay.totalHours.toFixed(1)}h</span>
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Check className="h-3 w-3" />
                                <span className="font-medium text-card-foreground">{activeDay.tasksCompleted}/{activeDay.tasksTotal}</span> tasks
                            </span>
                        </div>
                    </div>
                    {Object.keys(activeDay.breakdown).length ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            {Object.entries(activeDay.breakdown).map(([subject, hours]) => (
                                <div key={subject} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[subject] || "hsl(210 60% 50%)" }} />
                                    <span className="text-muted-foreground">{SUBJECT_ABBREVIATIONS[subject as SubjectCategory] || subject}</span>
                                    <span className="font-medium text-card-foreground">{hours.toFixed(1)}h</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No study logged this day.</p>
                    )}
                </div>
            )}
        </div>
    );
};
