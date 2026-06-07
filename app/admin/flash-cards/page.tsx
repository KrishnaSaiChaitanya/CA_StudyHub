"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Layers, Send, Inbox, ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { formatSubjectName } from "@/utils/subjects";
import { Badge } from "@/components/ui/badge";
import CreateSetDialog from "@/components/flash-cards/CreateSetDialog";

export default function AdminFlashcardsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [sets, setSets] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [presetTitle, setPresetTitle] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchAdminSets = async () => {
    setLoadingSets(true);
    try {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .select("*, flashcards(count)")
        .eq("is_admin", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSets(
        (data || []).map((s) => ({
          ...s,
          cardCount: s.flashcards?.[0]?.count || 0,
        }))
      );
    } catch (err: any) {
      toast({ title: "Failed to load admin sets", description: err.message, variant: "destructive" });
    } finally {
      setLoadingSets(false);
    }
  };

  const fetchTopicRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("flashcard_requests")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load requests", description: err.message, variant: "destructive" });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAdminSets();
    fetchTopicRequests();
  }, []);

  const handleDeleteSet = async (setId: string) => {
    if (!confirm("Are you sure you want to delete this admin flashcard set? All cards inside it will be deleted.")) return;

    setActionId(setId);
    try {
      const { error } = await supabase.from("flashcard_sets").delete().eq("id", setId);
      if (error) throw error;

      setSets((prev) => prev.filter((s) => s.id !== setId));
      toast({ title: "Set deleted successfully" });
    } catch (err: any) {
      toast({ title: "Failed to delete set", description: err.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to dismiss this request?")) return;

    setActionId(requestId);
    try {
      const { error } = await supabase.from("flashcard_requests").delete().eq("id", requestId);
      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({ title: "Request dismissed" });
    } catch (err: any) {
      toast({ title: "Failed to dismiss request", description: err.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const handleCreateFromRequest = (topic: string) => {
    setPresetTitle(topic);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
            Flashcards Admin
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Publish official flashcard sets and manage user topic requests.
          </p>
        </div>

        <Button
          onClick={() => {
            setPresetTitle("");
            setCreateOpen(true);
          }}
          className="gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Admin Set
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Topic Requests Section */}
        <Card className="border border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-accent" />
                Topic Requests
              </CardTitle>
              <CardDescription>Requested by users for official study materials</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchTopicRequests} disabled={loadingRequests}>
              <RefreshCw className={`h-4 w-4 ${loadingRequests ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRequests ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/5">
                <Inbox className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No topic requests submitted yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Requested By</TableHead>
                    <TableHead className="font-bold">Topic</TableHead>
                    <TableHead className="font-bold">Notes</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground italic">
                        {req.profiles?.full_name || "Anonymous"}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">{req.topic}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {req.notes ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{req.notes}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 text-sm whitespace-pre-wrap">
                                {req.notes}
                              </PopoverContent>
                            </Popover>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
                            disabled={actionId === req.id}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCreateFromRequest(req.topic)}
                            className="h-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm transition-all text-xs font-bold"
                            disabled={actionId === req.id}
                          >
                            Create Set
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Existing Admin Sets Section */}
        <Card className="border border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent" />
                Published Admin Sets
              </CardTitle>
              <CardDescription>Official cards accessible to all users</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchAdminSets} disabled={loadingSets}>
              <RefreshCw className={`h-4 w-4 ${loadingSets ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSets ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sets.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/5">
                <Layers className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No admin sets published yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Title</TableHead>
                    <TableHead className="font-bold">Subject</TableHead>
                    <TableHead className="font-bold">Card Count</TableHead>
                    <TableHead className="font-bold">Created At</TableHead>
                    <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sets.map((set) => (
                    <TableRow key={set.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-sm">{set.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-bold py-0.5">
                          {formatSubjectName(set.subject)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">
                        {set.cardCount} cards
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(set.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSet(set.id)}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                          disabled={actionId === set.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for creating admin set */}
      <CreateSetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isAdmin={true}
        onCreated={() => {
          fetchAdminSets();
          fetchTopicRequests(); // Dismisses or updates requests if needed
        }}
      />
    </div>
  );
}
