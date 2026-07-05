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

export default function ContactSubmissionsPage() {
  const supabase = createClient();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({ column: "name", value: "" });

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground mt-1">View and manage messages from the contact form</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} className="gap-2">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

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
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.filter(s => {
                if (!filters.value) return true;
                const field = s[filters.column];
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No submissions found yet.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.filter(s => {
                  if (!filters.value) return true;
                  const field = s[filters.column];
                  return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
                }).map((submission) => (
                  <TableRow key={submission.id} className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetails(submission)}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(submission.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell className="text-muted-foreground">{submission.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-accent/20 bg-accent/5">
                        {submission.subject}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                        <Eye className="h-4 w-4" />
                      </Button>
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
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                    <User className="h-3 w-3" /> From
                  </label>
                  <p className="font-medium text-foreground">{selectedSubmission.name}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <p className="font-medium text-foreground">{selectedSubmission.email}</p>
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
