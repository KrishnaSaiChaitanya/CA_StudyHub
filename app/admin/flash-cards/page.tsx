"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Layers, Send, Inbox, ArrowUpRight, Info, UploadCloud, Globe, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { formatSubjectName } from "@/utils/subjects";
import { Badge } from "@/components/ui/badge";
import CreateSetDialog from "@/components/flash-cards/CreateSetDialog";
import BulkUploadStepper from "@/components/admin/BulkUploadStepper";
import { deleteFlashcardRequest } from "./actions";

export default function AdminFlashcardsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [sets, setSets] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [presetTitle, setPresetTitle] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

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
      await deleteFlashcardRequest(requestId);

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

  const flashcardInstructions = (
    <div className="space-y-2">
      <p>Please provide a JSON array of flashcard sets. Each set must follow this structure:</p>
      <pre className="text-[10px] bg-muted p-2 rounded-md overflow-auto">
{`[
  {
    "title": "Accounting Principles",
    "subject": "principles_and_practice_of_accounting",
    "cards": [
      {
        "front": "What is the Matching Principle?",
        "back": "Expenses should be recorded..."
      }
    ]
  }
]`}
      </pre>
    </div>
  );

  const handleBulkUploadParse = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) throw new Error("Root must be an array of flashcard sets.");
      if (data.length === 0) throw new Error("No sets found in the array.");
      
      let totalCards = 0;
      data.forEach((set: any, i: number) => {
        if (!set.title) throw new Error(`Set at index ${i} is missing 'title'.`);
        if (!set.subject) throw new Error(`Set at index ${i} is missing 'subject'.`);
        if (!set.cards || !Array.isArray(set.cards)) throw new Error(`Set at index ${i} is missing 'cards' array.`);
        
        set.cards.forEach((c: any, ci: number) => {
          if (!c.front) throw new Error(`Set ${i}, Card ${ci} missing 'front'.`);
          if (!c.back) throw new Error(`Set ${i}, Card ${ci} missing 'back'.`);
        });
        totalCards += set.cards.length;
      });

      return { data: { sets: data, totalSets: data.length, totalCards }, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  };

  const handleBulkUploadPreview = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-primary">{data.totalSets}</div>
          <div className="text-sm text-muted-foreground font-medium uppercase">Sets to Add</div>
        </div>
        <div className="bg-background p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-primary">{data.totalCards}</div>
          <div className="text-sm text-muted-foreground font-medium uppercase">Total Cards</div>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-semibold">Content Details:</h4>
        <Accordion type="multiple" className="w-full space-y-2">
          {data.sets.map((s: any, i: number) => (
            <AccordionItem value={`item-${i}`} key={i} className="bg-background border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-sm text-left line-clamp-1 flex-1 pr-2">{s.title}</span>
                  <Badge variant="secondary" className="shrink-0">{s.cards.length} cards</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm text-muted-foreground border-t mt-2">
                <div className="mb-4 text-xs">
                  <strong>Subject:</strong> {formatSubjectName(s.subject as any) || s.subject}
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Cards Preview:</p>
                  {s.cards.slice(0, 5).map((c: any, ci: number) => (
                    <div key={ci} className="p-2 bg-muted/30 rounded border text-xs flex flex-col gap-1">
                      <div><strong className="text-muted-foreground mr-1">Q:</strong> <span className="font-medium text-foreground">{c.front}</span></div>
                      <div className="text-muted-foreground pl-5 relative before:absolute before:left-1 before:top-1 before:w-[2px] before:h-[calc(100%-8px)] before:bg-border">
                        {c.back}
                      </div>
                    </div>
                  ))}
                  {s.cards.length > 5 && (
                    <div className="text-xs italic mt-2 text-center text-muted-foreground bg-muted/10 p-2 rounded">
                      + {s.cards.length - 5} more cards
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );

  const handleBulkUploadSubmit = async (data: any, state: 'draft' | 'published') => {
    for (const set of data.sets) {
      const { data: setRow, error: setErr } = await supabase.from('flashcard_sets').insert({
        title: set.title,
        subject: set.subject,
        is_admin: true,
        state: state
      }).select().single();

      if (setErr) throw setErr;

      if (set.cards && set.cards.length > 0) {
        const cardsToInsert = set.cards.map((c: any, index: number) => ({
          set_id: setRow.id,
          front: c.front,
          back: c.back,
          position: index
        }));
        const { error: cardErr } = await supabase.from('flashcards').insert(cardsToInsert);
        if (cardErr) throw cardErr;
      }
    }
  };

  const handlePublishSet = async (id: string) => {
    setActionId(id);
    const { error } = await supabase.from('flashcard_sets').update({ state: 'published' }).eq('id', id);
    if (!error) {
      toast({ title: "Set Published!" });
      fetchAdminSets();
    } else {
      toast({ title: "Error publishing set", description: error.message, variant: "destructive" });
    }
    setActionId(null);
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

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowBulkUpload(true)} className="gap-2 font-semibold">
            <UploadCloud className="h-5 w-5" /> Bulk Upload
          </Button>
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
                    <TableHead className="font-bold">State</TableHead>
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
                      <TableCell>
                        {set.state === 'published' ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-50/50 gap-1 text-[10px]">
                            <Globe className="h-3 w-3" /> Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-50/50 gap-1 text-[10px]">
                            <FileSignature className="h-3 w-3" /> Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">
                        {set.cardCount} cards
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(set.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-2 justify-end">
                          {set.state === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishSet(set.id)}
                              className="h-8 gap-1 border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold"
                              disabled={actionId === set.id}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSet(set.id)}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                            disabled={actionId === set.id}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <BulkUploadStepper
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        title="Bulk Upload Flashcards"
        instructions={flashcardInstructions}
        onParse={handleBulkUploadParse}
        onPreviewRender={handleBulkUploadPreview}
        onSubmit={handleBulkUploadSubmit}
        onSuccess={fetchAdminSets}
      />
    </div>
  );
}
