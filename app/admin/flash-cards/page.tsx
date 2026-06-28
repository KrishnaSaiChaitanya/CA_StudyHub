"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Layers, Send, Inbox, Info, UploadCloud, Globe, FileSignature, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { formatSubjectName } from "@/utils/subjects";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import CreateSetDialog from "@/components/flash-cards/CreateSetDialog";
import EditSetDialog from "@/components/flash-cards/EditSetDialog";
import BulkUploadStepper from "@/components/admin/BulkUploadStepper";
import { deleteFlashcardRequest } from "./actions";

export default function AdminFlashcardsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [sets, setSets] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Pagination & Search state
  const [searchSets, setSearchSets] = useState("");
  const [pageSets, setPageSets] = useState(0);
  const [hasMoreSets, setHasMoreSets] = useState(true);

  const [searchRequests, setSearchRequests] = useState("");
  const [pageRequests, setPageRequests] = useState(0);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSetId, setEditSetId] = useState("");
  const [presetTitle, setPresetTitle] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const fetchAdminSets = async (page = 0, append = false, query = searchSets) => {
    if (!append) setLoadingSets(true);
    try {
      let q = supabase
        .from("flashcard_sets")
        .select("*, flashcards(count)", { count: 'exact' })
        .eq("is_admin", true)
        .order("created_at", { ascending: false });

      if (query) {
        q = q.or(`title.ilike.%${query}%,subject.ilike.%${query}%`);
      }

      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;

      if (error) throw error;

      const formattedData = (data || []).map((s) => ({
        ...s,
        cardCount: s.flashcards?.[0]?.count || 0,
      }));

      if (append) {
        setSets((prev) => {
          // Avoid duplicates on strict mode
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = formattedData.filter(d => !existingIds.has(d.id));
          return [...prev, ...newItems];
        });
      } else {
        setSets(formattedData);
      }

      setHasMoreSets(count !== null && from + formattedData.length < count);
    } catch (err: any) {
      toast({ title: "Failed to load admin sets", description: err.message, variant: "destructive" });
    } finally {
      setLoadingSets(false);
    }
  };

  const fetchTopicRequests = async (page = 0, append = false, query = searchRequests) => {
    if (!append) setLoadingRequests(true);
    try {
      let q = supabase
        .from("flashcard_requests")
        .select("*, profiles(full_name)", { count: 'exact' })
        .order("created_at", { ascending: false });

      if (query) {
        q = q.ilike("topic", `%${query}%`);
      }

      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;

      if (error) throw error;
      
      if (append) {
        setRequests((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = (data || []).filter(d => !existingIds.has(d.id));
          return [...prev, ...newItems];
        });
      } else {
        setRequests(data || []);
      }

      setHasMoreRequests(count !== null && from + (data || []).length < count);
    } catch (err: any) {
      toast({ title: "Failed to load requests", description: err.message, variant: "destructive" });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    setPageSets(0);
    const timeout = setTimeout(() => {
      fetchAdminSets(0, false, searchSets);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchSets]);

  useEffect(() => {
    setPageRequests(0);
    const timeout = setTimeout(() => {
      fetchTopicRequests(0, false, searchRequests);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchRequests]);

  const sentinelSetsRef = useRef<HTMLDivElement | null>(null);
  const sentinelRequestsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreSets && !loadingSets) {
        setPageSets((prev) => {
          const next = prev + 1;
          fetchAdminSets(next, true, searchSets);
          return next;
        });
      }
    }, { threshold: 0.1 });

    if (sentinelSetsRef.current) observer.observe(sentinelSetsRef.current);
    return () => observer.disconnect();
  }, [hasMoreSets, loadingSets, searchSets]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreRequests && !loadingRequests) {
        setPageRequests((prev) => {
          const next = prev + 1;
          fetchTopicRequests(next, true, searchRequests);
          return next;
        });
      }
    }, { threshold: 0.1 });

    if (sentinelRequestsRef.current) observer.observe(sentinelRequestsRef.current);
    return () => observer.disconnect();
  }, [hasMoreRequests, loadingRequests, searchRequests]);

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
      fetchAdminSets(0, false, searchSets);
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

      <Tabs defaultValue="sets" className="w-full">
        <TabsList className="mb-4 bg-muted/50 w-full justify-start h-12 p-1 border">
          <TabsTrigger value="sets" className="gap-2 text-sm font-semibold h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Layers className="h-4 w-4" />
            Published Sets
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2 text-sm font-semibold h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Send className="h-4 w-4" />
            Topic Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4 outline-none">
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  Admin Sets
                </CardTitle>
                <CardDescription>Manage official cards accessible to all users</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sets..."
                    className="pl-9 h-9"
                    value={searchSets}
                    onChange={(e) => setSearchSets(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fetchAdminSets(0, false, searchSets)} disabled={loadingSets}>
                  <RefreshCw className={`h-4 w-4 ${loadingSets && !sets.length ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSets && sets.length === 0 ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sets.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/5">
                  <Layers className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">No admin sets found</p>
                </div>
              ) : (
                <>
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
                            <div className="flex gap-1 justify-end items-center">
                              {set.state === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePublishSet(set.id)}
                                  className="h-8 gap-1 border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold mr-2"
                                  disabled={actionId === set.id}
                                >
                                  Publish
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditSetId(set.id);
                                  setEditOpen(true);
                                }}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                disabled={actionId === set.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
                  {hasMoreSets && (
                    <div ref={sentinelSetsRef} className="p-4 flex justify-center border-t bg-muted/10">
                      {loadingSets ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 outline-none">
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Send className="h-5 w-5 text-accent" />
                  Topic Requests
                </CardTitle>
                <CardDescription>Requested by users for official study materials</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    className="pl-9 h-9"
                    value={searchRequests}
                    onChange={(e) => setSearchRequests(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fetchTopicRequests(0, false, searchRequests)} disabled={loadingRequests}>
                  <RefreshCw className={`h-4 w-4 ${loadingRequests && !requests.length ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRequests && requests.length === 0 ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : requests.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/5">
                  <Inbox className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">No topic requests found</p>
                </div>
              ) : (
                <>
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
                  {hasMoreRequests && (
                    <div ref={sentinelRequestsRef} className="p-4 flex justify-center border-t bg-muted/10">
                      {loadingRequests ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating admin set */}
      <CreateSetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isAdmin={true}
        onCreated={() => {
          fetchAdminSets(0, false, searchSets);
          fetchTopicRequests(0, false, searchRequests); // Dismisses or updates requests if needed
        }}
      />

      {/* Dialog for editing admin set */}
      <EditSetDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        setId={editSetId}
        onEdited={() => fetchAdminSets(0, false, searchSets)}
      />

      <BulkUploadStepper
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        title="Bulk Upload Flashcards"
        instructions={flashcardInstructions}
        onParse={handleBulkUploadParse}
        onPreviewRender={handleBulkUploadPreview}
        onSubmit={handleBulkUploadSubmit}
        onSuccess={() => fetchAdminSets(0, false, searchSets)}
      />
    </div>
  );
}
