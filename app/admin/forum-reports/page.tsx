"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Trash2, Check, ShieldAlert, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { handleReportAction } from "./actions";

interface Report {
  id: string;
  post_id: string;
  user_id: string;
  feedback: string;
  status: string;
  created_at: string;
  forum_posts: {
    title: string;
    content: string;
    status: string;
  };
}

export default function ForumReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("forum_reports")
      .select(`
        *,
        forum_posts ( title, content, status )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data as any);
    }
    setLoading(false);
  };

  const handleAction = async (reportId: string, postId: string, action: "dismiss" | "block") => {
    setActionLoading(reportId);
    
    const result = await handleReportAction(reportId, postId, action);

    if (!result.success) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: `Report ${action === "block" ? "blocked" : "dismissed"}` });
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
    setActionLoading(null);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          Forum Reports
        </h2>
      </div>
      <p className="text-muted-foreground">Review and moderate reported forum posts.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No pending reports.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-card-foreground">Reported Post: {report.forum_posts?.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Reported {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    Pending Review
                  </span>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">User Feedback</p>
                  <p className="text-sm font-medium text-foreground">{report.feedback}</p>
                </div>

                <div className="bg-background rounded-lg p-4 border border-border/50 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post Link</p>
                  <a href={`/community/forum/${report.post_id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1 w-fit">
                    View Original Post <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <Button
                    variant="outline"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleAction(report.id, report.post_id, "dismiss")}
                    disabled={actionLoading === report.id}
                  >
                    {actionLoading === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Dismiss Report
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction(report.id, report.post_id, "block")}
                    disabled={actionLoading === report.id}
                  >
                    {actionLoading === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Block Post
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
