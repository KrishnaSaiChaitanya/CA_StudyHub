"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Mail, Loader2, RefreshCw, Eye, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TableFilters } from "@/components/admin/TableFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateContactSubmissionStatus } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ContactSubmissionsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({ column: "name", value: "" });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchSubmissions = async (currentStatus = statusFilter) => {
    setLoading(true);
    let q = supabase.from('contact_submissions').select('*');
    
    if (currentStatus !== 'all') {
      q = q.eq('status', currentStatus);
    }
    
    const { data, error } = await q.order('created_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions(statusFilter);
  }, [statusFilter]);

  const handleStatusChange = async (submissionId: string, status: "resolved" | "dismissed") => {
    // Store current state for potential rollback
    const previousSubmissions = [...submissions];
    const previousSelected = selectedSubmission;

    // Optimistically update the UI state immediately
    setSubmissions((prev) => 
      statusFilter === "all"
        ? prev.map((s) => s.id === submissionId ? { ...s, status } : s)
        : prev.filter((s) => s.id !== submissionId)
    );
    
    if (selectedSubmission?.id === submissionId) {
      setSelectedSubmission((prev: any) => prev ? { ...prev, status } : null);
    }

    setActionId(submissionId);
    try {
      await updateContactSubmissionStatus(submissionId, status);
      
      toast({
        title: `Submission marked as ${status}`,
      });
    } catch (err: any) {
      // Rollback on error
      setSubmissions(previousSubmissions);
      if (previousSelected?.id === submissionId) {
        setSelectedSubmission(previousSelected);
      }
      
      toast({
        title: "Failed to update status",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setActionId(null);
    }
  };

  const handleViewDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bug":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20 font-semibold px-2 py-0.5 text-xs">Bug</Badge>;
      case "feature_request":
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/10 border-purple-500/20 font-semibold px-2 py-0.5 text-xs">Request</Badge>;
      case "general":
      default:
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20 font-semibold px-2 py-0.5 text-xs">General</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    // Standardize checking for 'generic' or 'general' as type
    const sType = s.type || 'general';
    if (typeFilter !== "all" && sType !== typeFilter) return false;
    if (!filters.value) return true;
    const field = s[filters.column];
    return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground mt-1">View and manage messages from the contact form</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchSubmissions(statusFilter)} className="gap-2">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start justify-between mb-6">
        <div className="flex-1">
          <TableFilters 
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "subject", label: "Subject" },
              { key: "message", label: "Message" }
            ]} 
            onFilterChange={setFilters}
            placeholder="Filter submissions..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 bg-card p-2 rounded-xl border border-border/50 shadow-sm justify-center items-center">
          <div className="w-full sm:w-[150px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="all">History (All)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[150px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-background border-border/60">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No submissions found yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id} className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetails(submission)}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {/* <Calendar className="h-3 w-3 text-muted-foreground" /> */}
                        {formatDate(submission.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell className="text-muted-foreground">{submission.email}</TableCell>
                    <TableCell>{getTypeBadge(submission.type ?? "general")}</TableCell>
                    <TableCell className="max-w-[200px] truncate"> <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewDetails(submission)}
                          className="h-8 w-8 hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button></TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end items-center">
                       
                        {submission.status !== "pending" ? (
                          <Badge 
                            className={cn(
                              "font-semibold px-2 py-0.5 text-xs capitalize",
                              submission.status === "resolved" 
                                ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20" 
                                : "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/10 border-zinc-500/20"
                            )}
                          >
                            {submission.status}
                          </Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(submission.id, "dismissed")}
                              className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all text-xs"
                              disabled={actionId === submission.id}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(submission.id, "resolved")}
                              className="h-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm transition-all text-xs font-bold"
                              disabled={actionId === submission.id}
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl sm:rounded-2xl border-border/60">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Mail className="h-5 w-5 text-accent" />
              Submission Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-7 gap-6">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                    <User className="h-3 w-3" /> From
                  </label>
                  <p className="font-medium text-foreground">{selectedSubmission.name}</p>
                </div>
                <div className="space-y-1.5 col-span-3">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <p className="font-medium text-foreground">{selectedSubmission.email}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Type
                  </label>
                  <div className="mt-1">{getTypeBadge(selectedSubmission.type || 'general')}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge 
                      className={cn(
                        "font-semibold px-2 py-0.5 text-xs capitalize",
                        (selectedSubmission.status || "pending") === "resolved" 
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20" 
                          : (selectedSubmission.status || "pending") === "dismissed"
                          ? "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/10 border-zinc-500/20"
                          : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20"
                      )}
                    >
                      {selectedSubmission.status || "pending"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                  <Tag className="h-3 w-3" /> Subject
                </label>
                <p className="font-medium text-foreground text-lg">{selectedSubmission.subject}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
                <div className="bg-muted/30 p-4 rounded-xl text-foreground leading-relaxed whitespace-pre-wrap min-h-[150px] border border-border/40">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  Submitted on {formatDate(selectedSubmission.created_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
