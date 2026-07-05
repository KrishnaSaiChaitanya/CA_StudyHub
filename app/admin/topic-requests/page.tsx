"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Inbox, Info, Loader2, RefreshCw, Search, Send, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { formatSubjectName } from "@/utils/subjects";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import BulkUploadStepper from "@/components/admin/BulkUploadStepper";
import { deleteFlashcardRequest, getUserEmails } from "./actions";
import InfiniteScrollLoader from "@/components/admin/InfiniteScrollLoader";

export default function AdminTopicRequestsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Pagination & Search state
  const [searchRequests, setSearchRequests] = useState("");
  const [pageRequests, setPageRequests] = useState(0);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);

  const [actionId, setActionId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const fetchTopicRequests = async (page = 0, append = false, query = searchRequests) => {
    setLoadingRequests(true);
    try {
      let q = supabase
        .from("flashcard_requests")
        .select("*, profiles(full_name)", { count: 'exact' })
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (query) {
        q = q.ilike("topic", `%${query}%`);
      }

      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;

      if (error) throw error;

      // Fetch emails from auth.users via server action
      const userIds = (data || []).map((r: any) => r.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const emails = await getUserEmails(userIds);
        setEmailMap((prev) => ({ ...prev, ...emails }));
      }
      
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
    setPageRequests(0);
    const timeout = setTimeout(() => {
      fetchTopicRequests(0, false, searchRequests);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchRequests]);

  const sentinelRequestsRef = useRef<HTMLDivElement | null>(null);

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
        user_id: selectedUserId || null,
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

    if (selectedRequestId) {
      const { error: reqErr } = await supabase
        .from("flashcard_requests")
        .update({ status: "created" })
        .eq("id", selectedRequestId);
      if (reqErr) console.error("Error closing request status:", reqErr);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
            Topic Requests
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Requested by users for official study materials.
          </p>
        </div>
      </div>

      <Card className="border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-accent" />
              Topic Requests
            </CardTitle>
            <CardDescription>Review student requested topics and bulk upload flashcard sets.</CardDescription>
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
                    <TableHead className="font-bold">Email</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">
                        {emailMap[req.user_id] || "—"}
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
                            onClick={() => {
                              setSelectedUserId(req.user_id);
                              setSelectedRequestId(req.id);
                              setShowBulkUpload(true);
                            }}
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
              <InfiniteScrollLoader
                loading={loadingRequests}
                hasMore={hasMoreRequests}
                sentinelRef={(node) => {
                  sentinelRequestsRef.current = node;
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <BulkUploadStepper
        open={showBulkUpload}
        onOpenChange={(open) => {
          setShowBulkUpload(open);
          if (!open) {
            setSelectedUserId(null);
            setSelectedRequestId(null);
          }
        }}
        title="Bulk Upload Flashcards"
        instructions={flashcardInstructions}
        onParse={handleBulkUploadParse}
        onPreviewRender={handleBulkUploadPreview}
        onSubmit={handleBulkUploadSubmit}
        onSuccess={() => fetchTopicRequests(0, false, searchRequests)}
      />
    </div>
  );
}
