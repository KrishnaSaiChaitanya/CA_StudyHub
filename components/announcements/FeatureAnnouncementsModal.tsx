"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { FeatureAnnouncement } from "@/utils/supabase/types";

const STORAGE_KEY = "seen_feature_announcements";

interface FeatureAnnouncementsModalProps {
  previewItems?: FeatureAnnouncement[] | null;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export function FeatureAnnouncementsModal({
  previewItems = null,
  isPreview = false,
  onClosePreview,
}: FeatureAnnouncementsModalProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [direction, setDirection] = useState(0);

  // Helper to read seen map from localStorage
  const getSeenMap = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // Helper to mark a specific announcement as seen with its updated_at timestamp
  const markAsSeen = useCallback(
    (announcement: FeatureAnnouncement) => {
      if (isPreview || typeof window === "undefined") return;
      try {
        const seenMap = getSeenMap();
        seenMap[announcement.id] = announcement.updated_at || announcement.created_at;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seenMap));
      } catch (err) {
        console.error("Failed to save seen announcement state:", err);
      }
    },
    [getSeenMap, isPreview]
  );

  // Check announcements on load / auth change
  useEffect(() => {
    if (isPreview && previewItems && previewItems.length > 0) {
      setAnnouncements(previewItems);
      setCurrentIndex(0);
      setIsOpen(true);
      return;
    }

    if (isPreview) return;

    const supabase = createClient();

    const fetchEligibleAnnouncements = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // User is not logged in; we don't show feature updates
          setIsOpen(false);
          return;
        }

        const userCreatedAt = new Date(session.user.created_at);

        // Fetch all active announcements
        const { data, error } = await supabase
          .from("feature_announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true }); // Oldest first or newest first for pagination

        if (error || !data || data.length === 0) {
          setAnnouncements([]);
          setIsOpen(false);
          return;
        }

        const seenMap = getSeenMap();

        // Filter:
        // 1. Must be created AFTER or at user registration date
        // 2. Must not be marked as seen with the latest updated_at
        const eligible = (data as FeatureAnnouncement[]).filter((item) => {
          const itemCreatedAt = new Date(item.created_at);
          // Allow 30 seconds buffer for edge cases where user just registered
          const isAfterUserJoined = itemCreatedAt.getTime() >= userCreatedAt.getTime() - 30000;
          if (!isAfterUserJoined) return false;

          const lastSeenTime = seenMap[item.id];
          if (!lastSeenTime) return true; // Never seen

          // If announcement was updated AFTER user last saw it, show it again
          const itemUpdateTime = new Date(item.updated_at || item.created_at).getTime();
          const seenTime = new Date(lastSeenTime).getTime();
          return itemUpdateTime > seenTime;
        });

        if (eligible.length > 0) {
          setAnnouncements(eligible);
          setCurrentIndex(0);
          setIsOpen(true);
          // Mark the first item as seen since user is viewing it
          markAsSeen(eligible[0]);
        } else {
          setAnnouncements([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.warn("Could not check feature announcements:", err);
      }
    };

    fetchEligibleAnnouncements();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchEligibleAnnouncements();
      } else {
        setIsOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isPreview, previewItems, getSeenMap, markAsSeen]);

  // When index changes, mark the current item as seen
  const handleGoTo = (index: number) => {
    if (index < 0 || index >= announcements.length) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    if (announcements[index]) {
      markAsSeen(announcements[index]);
    }
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      handleGoTo(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleGoTo(currentIndex - 1);
    }
  };

  // Main Action Button click handler
  const handleActionClick = () => {
    const current = announcements[currentIndex];
    if (current) {
      markAsSeen(current);
    }

    if (current?.button_url && current.button_url.trim()) {
      const url = current.button_url.trim();
      setIsOpen(false);
      if (isPreview && onClosePreview) {
        onClosePreview();
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        router.push(url);
      }
    } else {
      // If no URL is provided, move to next slide or close if on last slide
      if (currentIndex < announcements.length - 1) {
        handleNext();
      } else {
        handleConfirmDismiss();
      }
    }
  };

  // Handle top close (X) click -> Show confirmation prompt
  const handleRequestClose = () => {
    setShowConfirmClose(true);
  };

  // Confirm close
  const handleConfirmDismiss = () => {
    const current = announcements[currentIndex];
    if (current) {
      markAsSeen(current);
    }
    setShowConfirmClose(false);
    setIsOpen(false);
    if (isPreview && onClosePreview) {
      onClosePreview();
    }
  };

  const handleCancelDismiss = () => {
    setShowConfirmClose(false);
  };

  if (!isOpen || announcements.length === 0) return null;

  const currentItem = announcements[currentIndex];
  if (!currentItem) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 40 : -40,
      opacity: 0,
      scale: 0.98,
      transition: {
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleRequestClose();
      }}
    >
      <DialogContent
        hideClose
        className="w-[94vw] sm:w-full max-w-xl p-0 overflow-hidden border border-border/70 bg-card text-card-foreground shadow-2xl rounded-2xl sm:rounded-3xl backdrop-blur-xl"
      >
        {/* Glow Header Banner / Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-b from-accent/[0.12] via-accent/[0.04] to-transparent p-5 sm:p-6 pb-4 sm:pb-5">
          {/* Top luminous accent edge */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />
          
          {/* Subtle Ambient Orb Effect */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar with Badge, Pagination pill and Close Button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              {currentItem.badge && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 border border-accent/25 text-accent shadow-xs backdrop-blur-md tracking-wide">
                  <span>{currentItem.badge}</span>
                </div>
              )}

              {announcements.length > 1 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/80 border border-border/60 text-muted-foreground shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span>
                    {currentIndex + 1} of {announcements.length}
                  </span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleRequestClose}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-all shadow-xs hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/50"
              title="Close announcement"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close announcement</span>
            </button>
          </div>
        </div>

        {/* Separator Line with Gradient */}
        <div className="h-[1px] w-full bg-gradient-to-r from-border/20 via-border/80 to-border/20" />

        {/* Modal Main Body */}
        <div className="p-5 sm:p-7 pt-4 space-y-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentItem.id || currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {currentItem.title}
              </h2>

              {/* Rich Text Content */}
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed break-words max-h-[340px] overflow-y-auto pr-1 no-scrollbar space-y-2 [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-base [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-foreground [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-accent/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded text-sm sm:text-[15px]"
                dangerouslySetInnerHTML={{ __html: currentItem.content }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Footer Controls & Actions */}
          <div className="pt-2 border-t border-border/50 space-y-4">
            {/* Pagination Controls & Dots (if multiple) */}
            {announcements.length > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {announcements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGoTo(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? "w-6 bg-accent"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      title={`Go to update ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === announcements.length - 1}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                onClick={handleActionClick}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg font-semibold h-11 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base rounded-xl"
              >
                <span>
                  {currentItem.button_text && currentItem.button_text.trim()
                    ? currentItem.button_text
                    : currentItem.button_url && currentItem.button_url.trim()
                    ? "Check It Out"
                    : currentIndex < announcements.length - 1
                    ? "Next Update"
                    : "Got It, Thanks!"}
                </span>
                {currentItem.button_url && currentItem.button_url.trim() ? (
                  currentItem.button_url.startsWith("http") ? (
                    <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal overlay when user clicks (X) */}
        <AnimatePresence>
          {showConfirmClose && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <HelpCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold text-foreground">
                  Dismiss this announcement?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You won&apos;t see this update again once closed. You can always catch up on new releases anytime.
                </p>
              </div>

              <div className="flex gap-3 w-full max-w-xs pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelDismiss}
                  className="flex-1 rounded-xl h-10 font-medium"
                >
                  Keep Reading
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDismiss}
                  className="flex-1 rounded-xl h-10 font-medium"
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
