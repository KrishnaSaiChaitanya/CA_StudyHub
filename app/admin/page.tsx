"use client"
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Mail, FileText, ArrowUpRight, Clock, Plus, Users, BookOpen, Layers,
  Save, Trash2, ArrowUp, ArrowDown, Pencil, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DashboardOverview() {
  const [counts, setCounts] = useState({ planners: 0, tests: 0, faculty: 0 });
  const [recentStats, setRecentStats] = useState({ contact: 0, submissions: 0 });
  const [recentContactData, setRecentContactData] = useState<any[]>([]);
  const [recentSubmissionData, setRecentSubmissionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Dashboard Ticker State
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [tickerSaving, setTickerSaving] = useState(false);
  
  // Form State
  const [newTickerMessage, setNewTickerMessage] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const [pRes, tRes, fRes, cRes, sRes, contactRes, submissionRes, tickerRes] = await Promise.all([
          supabase.from('study_planners').select('*', { count: 'exact', head: true }),
          supabase.from('tests').select('*', { count: 'exact', head: true }),
          supabase.from('faculty').select('*', { count: 'exact', head: true }),
          supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).gte('created_at', twoDaysAgo),
          supabase.from('community_submissions').select('*', { count: 'exact', head: true }).gte('created_at', twoDaysAgo),
          supabase.from('contact_submissions').select('*').gte('created_at', twoDaysAgo).order('created_at', { ascending: false }).limit(3),
          supabase.from('community_submissions').select('*').gte('created_at', twoDaysAgo).order('created_at', { ascending: false }).limit(3),
          supabase.from('site_content').select('*').eq('page_id', 'dashboard_ticker').maybeSingle()
        ]);

        setCounts({
          planners: pRes.count || 0,
          tests: tRes.count || 0,
          faculty: fRes.count || 0
        });
        setRecentStats({
          contact: cRes.count || 0,
          submissions: sRes.count || 0
        });
        setRecentContactData(contactRes.data || []);
        setRecentSubmissionData(submissionRes.data || []);

        if (tickerRes?.data && tickerRes.data.content && Array.isArray(tickerRes.data.content.messages)) {
          setTickerMessages(tickerRes.data.content.messages);
        } else {
          // Default fallback announcements
          setTickerMessages([
            "🚀 New: Practice Planner is live — track question-wise revision",
            "📅 Exam attempts now available: Nov 2026, May 2027, Nov 2027, May 2028",
            "🤖 AI Chatbot upgraded with faster responses",
            "🏆 Climb the new Leaderboard — earn XP daily",
            "📚 Fresh ICAI announcements added every week"
          ]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setTickerLoading(false);
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleSaveTickerConfig = async () => {
    setTickerSaving(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({ 
          page_id: 'dashboard_ticker', 
          content: { messages: tickerMessages } 
        }, { onConflict: 'page_id' });

      if (error) {
        toast.error("Failed to save ticker settings: " + error.message);
      } else {
        toast.success("Dashboard ticker announcements saved!");
      }
    } catch (e: any) {
      toast.error("An unexpected error occurred: " + e.message);
    } finally {
      setTickerSaving(false);
    }
  };

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerMessage.trim()) return;

    setTickerMessages(prev => [...prev, newTickerMessage.trim()]);
    setNewTickerMessage("");
    toast.success("Announcement added locally. Save changes to publish.");
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingMessage(tickerMessages[index]);
  };

  const handleUpdateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex === null || !editingMessage.trim()) return;

    setTickerMessages(prev => prev.map((msg, idx) => idx === editingIndex ? editingMessage.trim() : msg));
    setEditingIndex(null);
    setEditingMessage("");
    toast.success("Announcement updated locally. Save changes to publish.");
  };

  const handleDeleteMessage = (index: number) => {
    setTickerMessages(prev => prev.filter((_, idx) => idx !== index));
    toast.success("Announcement removed locally. Save changes to publish.");
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingMessage("");
    }
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const newMessages = [...tickerMessages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMessages.length) return;

    const temp = newMessages[index];
    newMessages[index] = newMessages[targetIndex];
    newMessages[targetIndex] = temp;

    setTickerMessages(newMessages);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Review your platform's performance and recent activity at a glance.
          </p>
        </div>

        <a
          href="/dashboard"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 w-fit"
        >
          <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Main Application
          <ArrowUpRight className="w-4 h-4 opacity-70" />
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BookOpen className="w-20 h-20 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Study Planners</h3>
          </div>
          <p className="text-5xl font-black text-primary mb-2 tabular-nums">
            {loading ? '---' : counts.planners}
          </p>
        
        </div>

        <div className="relative overflow-hidden bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="w-20 h-20 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Tests & MCQs</h3>
          </div>
          <p className="text-5xl font-black text-blue-500 mb-2 tabular-nums">
            {loading ? '---' : counts.tests}
          </p>
         
        </div>

        <div className="relative overflow-hidden bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-20 h-20 text-green-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Faculty</h3>
          </div>
          <p className="text-5xl font-black text-green-500 mb-2 tabular-nums">
            {loading ? '---' : counts.faculty}
          </p>
       
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Contact Us Submissions */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border/50 bg-muted/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-inner">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Contact Requests</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last 48 Hours</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-orange-500">{recentStats.contact}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">New Messages</span>
            </div>
          </div>
          
          <div className="p-4 flex-1 space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
              ))
            ) : recentContactData.length > 0 ? (
              recentContactData.map((contact) => (
                <div key={contact.id} className="group p-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center font-bold text-foreground/40 uppercase group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                      {contact.name?.[0] || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{contact.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{contact.subject || 'Inquiry'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(contact.created_at)}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-extrabold uppercase bg-background px-1.5 h-4 border-muted">Active</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <Mail className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No new requests in the last 2 days</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border/50 bg-muted/5">
            <a href="/admin/contact-us" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5">
              View All Submissions <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Recent Community Submissions */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border/50 bg-muted/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">New Submissions</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last 48 Hours</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-purple-500">{recentStats.submissions}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Material Added</span>
            </div>
          </div>
          
          <div className="p-4 flex-1 space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
              ))
            ) : recentSubmissionData.length > 0 ? (
              recentSubmissionData.map((sub) => (
                <div key={sub.id} className="group p-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-purple-500/10 group-hover:text-purple-500 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{sub.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1">{sub.category}</Badge>
                        <span className="text-[10px] text-muted-foreground italic truncate">by {sub.uploader_name || 'User'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(sub.created_at)}
                    </span>
                    <Badge variant={sub.status === 'approved' ? 'default' : 'outline'} className="text-[9px] font-extrabold uppercase px-1.5 h-4">
                      {sub.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <FileText className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No new submissions in the last 2 days</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border/50 bg-muted/5">
            <a href="/admin/community-submissions" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5">
              Review Submissions <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Dashboard Ticker Configuration */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Dashboard Marquee Ticker Announcements</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Manage the scrolling announcement ticker messages displayed on the user dashboard.
            </p>
          </div>
          <Button 
            onClick={handleSaveTickerConfig} 
            disabled={tickerSaving} 
            className="gap-2 font-bold w-fit self-start md:self-auto"
            size="sm"
          >
            {tickerSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Ticker Settings
          </Button>
        </div>

        {tickerLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Announcement List */}
            <div className="lg:col-span-2 space-y-3">
              <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Announcements</Label>
              
              {tickerMessages.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                  <p className="text-sm font-medium">No announcements active. Ticker will fall back to default values.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickerMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl border bg-card border-border hover:bg-secondary/15 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground shrink-0">{index + 1}.</span>
                        <p className="text-sm font-semibold text-foreground truncate">{msg}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={index === 0}
                          onClick={() => handleMoveMessage(index, 'up')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        
                        {/* Move Down */}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={index === tickerMessages.length - 1}
                          onClick={() => handleMoveMessage(index, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartEdit(index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteMessage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Add/Edit Form */}
            <div className="bg-muted/15 border rounded-2xl p-5 space-y-4 h-fit">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {editingIndex !== null ? "Edit Announcement" : "Add Announcement"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingIndex !== null ? "Modify the message content below." : "Enter a new announcement to append to the marquee."}
                </p>
              </div>

              {editingIndex !== null ? (
                <form onSubmit={handleUpdateMessage} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-msg" className="text-xs font-semibold">Message Text</Label>
                    <Input
                      id="edit-msg"
                      required
                      value={editingMessage}
                      onChange={(e) => setEditingMessage(e.target.value)}
                      placeholder="e.g., Nov 2026 Exam schedules released!"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1 font-semibold">
                      Update
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setEditingIndex(null); setEditingMessage(""); }}
                      className="font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddMessage} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="add-msg" className="text-xs font-semibold">Message Text</Label>
                    <Input
                      id="add-msg"
                      required
                      value={newTickerMessage}
                      onChange={(e) => setNewTickerMessage(e.target.value)}
                      placeholder="e.g., Nov 2026 Exam schedules released!"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full font-semibold gap-1.5">
                    <Plus className="h-4 w-4" /> Add Announcement
                  </Button>
                </form>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

