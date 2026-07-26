"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Download,
} from "lucide-react";
import { formatSubjectName } from "@/utils/subjects";
import SaveToFolderPopover from "@/components/flash-cards/SaveToFolderPopover";
import { saveOfflineItem, deleteOfflineItem, getOfflineItem } from "@/utils/offline-db";

// Global cache variables for SWR caching
const cacheSetDetails: Record<string, any> = {};
const cacheSetCards: Record<string, any[]> = {};

interface StudyPageProps {
  params: Promise<{ id: string }>;
}

export default function StudyPage({ params }: StudyPageProps) {
  const router = useRouter();
  const { id: setId } = use(params);
  const supabase = createClient();
  const { toast } = useToast();

  const [set, setSet] = useState<any | null>(cacheSetDetails[setId] || null);
  const [cards, setCards] = useState<any[]>(cacheSetCards[setId] || []);
  const [loading, setLoading] = useState(!cacheSetDetails[setId]);

  // Study states
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);

  const checkOfflineStatus = async () => {
    try {
      const item = await getOfflineItem(setId);
      setIsOfflineCached(!!item);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkOfflineStatus();
  }, [setId]);

  const handleToggleOffline = async () => {
    setSavingOffline(true);
    try {
      if (isOfflineCached) {
        await deleteOfflineItem(setId);
        setIsOfflineCached(false);
        toast({ title: "Removed offline copy", description: "This set has been removed from offline storage." });
      } else {
        if (!set) return;
        await saveOfflineItem({
          id: setId,
          type: "flashcard",
          title: set.title,
          subject: set.subject,
          metadata: {
            is_admin: set.is_admin || false,
            cardCount: cards.length
          },
          data: cards
        });
        setIsOfflineCached(true);
        toast({ title: "Saved Offline", description: "This set is now available for offline study." });
      }
    } catch (e: any) {
      toast({ title: "Offline Save Failed", description: e.message || "Could not save set offline", variant: "destructive" });
    } finally {
      setSavingOffline(false);
    }
  };

  const fetchSetDetails = async (forceRefresh = false) => {
    if (!forceRefresh && cacheSetDetails[setId] && cacheSetCards[setId]) {
      setSet(cacheSetDetails[setId]);
      setCards(cacheSetCards[setId]);
      setLoading(false);
      // Background revalidation
    } else {
      setLoading(true);
    }

    try {
      const offlineItem = await getOfflineItem(setId);
      if (offlineItem) {
        setSet({
          id: offlineItem.id,
          title: offlineItem.title,
          subject: offlineItem.subject,
          is_admin: offlineItem.metadata?.is_admin,
          cardCount: offlineItem.metadata?.cardCount
        });
        setCards(offlineItem.data || []);
        setIsOfflineCached(true);
        setLoading(false);
        if (typeof window !== "undefined" && !navigator.onLine) {
          return;
        }
      }
    } catch (err) {
      console.error("IndexedDB error loading details:", err);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Fetch set metadata
      let query = supabase
        .from("flashcard_sets")
        .select("*")
        .eq("id", setId);

      if (user) {
        query = query.or(`state.eq.published,user_id.eq.${user.id}`);
      } else {
        query = query.eq("state", "published");
      }

      const { data: setData, error: setErr } = await query.single();

      if (setErr) throw setErr;
      setSet(setData);
      cacheSetDetails[setId] = setData;

      // 2. Fetch cards inside set
      const { data: cardsData, error: cardsErr } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", setId)
        .order("position", { ascending: true });

      if (cardsErr) throw cardsErr;
      const processedCards = cardsData || [];
      setCards(processedCards);
      cacheSetCards[setId] = processedCards;
    } catch (err: any) {
      toast({ title: "Failed to load set", description: err.message, variant: "destructive" });
      router.push("/study/flash-cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetDetails();
  }, [setId]);

  const handleNext = () => {
    setFlipped(false);
    if (cardIdx < cards.length - 1) {
      setCardIdx((i) => i + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handlePrev = () => {
    setFlipped(false);
    setCardIdx((i) => Math.max(i - 1, 0));
  };

  const handleMarkKnown = () => {
    const currentCardId = cards[cardIdx].id;
    if (!knownIds.includes(currentCardId)) {
      setKnownIds((prev) => [...prev, currentCardId]);
    }
    handleNext();
  };

  const handleRestart = () => {
    setCardIdx(0);
    setFlipped(false);
    setKnownIds([]);
    setSessionComplete(false);
  };

  if (loading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground font-medium">Loading set...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container py-16 max-w-2xl text-center">
        <h2 className="text-lg font-bold text-foreground">Empty Set</h2>
        <p className="text-sm text-muted-foreground mt-2">
          There are no cards in this set yet.
        </p>
        <Button onClick={() => router.push("/study/flash-cards")} className="mt-4 bg-accent text-accent-foreground">
          Go Back
        </Button>
      </div>
    );
  }

  const currentCard = cards[cardIdx];
  const progress = sessionComplete ? 100 : ((cardIdx) / cards.length) * 100;

  return (
    <div className="container py-8 max-w-2xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Go Back
      </Button>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight line-clamp-1">{set.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {sessionComplete ? cards.length : cardIdx + 1} of {cards.length} cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold py-0.5 bg-secondary/80 text-muted-foreground select-none">
            {formatSubjectName(set.subject)}
          </Badge>
          {process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleOffline}
              disabled={savingOffline}
              className="h-8 px-2 flex items-center gap-1 text-xs"
              title={isOfflineCached ? "Remove from offline storage" : "Save Offline"}
            >
              {savingOffline ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isOfflineCached ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isOfflineCached ? "Saved Offline" : "Save Offline"}</span>
            </Button>
          )}
          <SaveToFolderPopover setId={setId} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {sessionComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-md flex flex-col items-center justify-center min-h-[300px]"
          >
            <div className="h-14 w-14 rounded-full bg-accent/15 flex items-center justify-center mb-4">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Session Complete!</h2>
            {/* <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              You marked <span className="font-semibold text-foreground">{knownIds.length}</span> out of{" "}
              <span className="font-semibold text-foreground">{cards.length}</span> cards as known.
            </p> */}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => router.push("/study/flash-cards")} className="h-10 px-4">
                View Other Sets
              </Button>
              <Button onClick={handleRestart} className="h-10 px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                Restart Set
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* 3D Flip Card Container */}
            <div
              onClick={() => setFlipped(!flipped)}
              className="relative w-full cursor-pointer"
              style={{ perspective: 1200 }}
            >
              <motion.div
                className="relative grid"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div
                  className="col-start-1 row-start-1 rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center shadow-sm select-none"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="self-start text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Question
                  </span>

                  <p className="my-auto text-base font-medium leading-relaxed text-foreground">
                    {currentCard.front}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <RotateCw className="h-3 w-3" />
                    Tap to Flip
                  </div>
                </div>

                <div
                  className="col-start-1 row-start-1 rounded-2xl border border-accent/20 bg-accent/5 p-8 flex flex-col items-center text-center shadow-md select-none"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <span className="self-start text-[10px] font-bold uppercase tracking-wider text-accent">
                    Answer
                  </span>

                  <p className="my-8 text-base font-semibold leading-relaxed text-foreground">
                    {currentCard.back}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 text-[10px] font-semibold text-accent">
                    <RotateCw className="h-3 w-3" />
                    Tap to Flip
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={cardIdx === 0}
                className="h-10 px-3 flex items-center gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>


              <Button
                variant="outline"
                onClick={handleNext}
                className="h-10 px-3 flex items-center gap-1 text-xs"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
