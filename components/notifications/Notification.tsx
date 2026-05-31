"use client";

import { useEffect, useState, useMemo } from "react";
import { Bell, MessageCircle, Megaphone, ExternalLink, Calendar, Check, CheckCheck, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { renderHtmlPreview } from "@/lib/utils";

interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  reference_id: string | null;
  metadata: {
    post_id?: string;
    post_title?: string;
    author_name?: string;
    summary?: string;
    url?: string;
    tag?: string;
    date?: string;
  };
  is_viewed: boolean;
  created_at: string;
}

const tagColors: Record<string, string> = {
  "Exam Schedule": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "Syllabus": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "Registration": "bg-green-500/10 text-green-400 border border-green-500/20",
  "Event": "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "Results": "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  "Study Material": "bg-teal-500/10 text-teal-400 border border-teal-500/20",
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"replies" | "announcements">("replies");
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Fetch unread count initially
  useEffect(() => {
    let active = true;

    const fetchCount = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || !active) return;
      setUserId(user.id);

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_viewed", false);

      if (!error && count !== null && active) {
        setUnreadCount(count);
      }
    };

    fetchCount();

    return () => {
      active = false;
    };
  }, []);

  // Fetch actual notification records when popover opens
  const fetchNotifications = async () => {
    if (!userId) return;
    setLoadingData(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_viewed", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data as DBNotification[]);
      setUnreadCount(data.length);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId]);

  // Real-time subscription to auto-update unread count & popover lists
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as DBNotification;
            if (!newNotif.is_viewed) {
              setUnreadCount((prev) => prev + 1);
              if (open) {
                setNotifications((prev) => [newNotif, ...prev]);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedNotif = payload.new as DBNotification;
            if (updatedNotif.is_viewed) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
              if (open) {
                setNotifications((prev) => prev.filter((n) => n.id !== updatedNotif.id));
              }
            }
          } else if (payload.eventType === "DELETE") {
            const { count } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("is_viewed", false);
            setUnreadCount(count || 0);
            if (open) {
              fetchNotifications();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, open]);

  // Split notifications into replies and announcements
  const replies = useMemo(() => {
    return notifications.filter((n) => n.type === "reply");
  }, [notifications]);

  const announcementsList = useMemo(() => {
    return notifications.filter((n) => n.type === "announcement");
  }, [notifications]);

  const unreadRepliesCount = useMemo(() => {
    return replies.length;
  }, [replies]);

  const unreadAnnouncementsCount = useMemo(() => {
    return announcementsList.length;
  }, [announcementsList]);

  const markAsViewed = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Optimistically remove from state
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const { error } = await supabase
      .from("notifications")
      .update({ is_viewed: true })
      .eq("id", id);

    if (error) {
      // Revert if API failed
      fetchNotifications();
    }
  };

  const markAllAsViewed = async () => {
    if (!userId) return;

    // Optimistically clear all
    setNotifications([]);
    setUnreadCount(0);

    const { error } = await supabase
      .from("notifications")
      .update({ is_viewed: true })
      .eq("user_id", userId)
      .eq("is_viewed", false);

    if (error) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: DBNotification) => {
    await markAsViewed(notif.id);
    setOpen(false);

    if (notif.type === "reply") {
      router.push("/community");
    } else if (notif.type === "announcement" && notif.metadata.url) {
      window.open(notif.metadata.url, "_blank", "noopener,noreferrer");
    } else {
      router.push("/study");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary hover:text-accent focus:outline-none"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground ring-2 ring-background animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-2rem))] p-0 overflow-hidden bg-card border border-border rounded-xl shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
          <p className="text-sm font-semibold text-card-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsViewed}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline hover:text-accent/80 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("replies")}
            className={`flex-1 px-4 py-2.5 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === "replies"
                ? "text-accent border-accent bg-accent/5"
                : "text-muted-foreground border-transparent hover:text-card-foreground hover:bg-secondary/30"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Replies
            {unreadRepliesCount > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                {unreadRepliesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("announcements")}
            className={`flex-1 px-4 py-2.5 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === "announcements"
                ? "text-accent border-accent bg-accent/5"
                : "text-muted-foreground border-transparent hover:text-card-foreground hover:bg-secondary/30"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" /> Updates
            {unreadAnnouncementsCount > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                {unreadAnnouncementsCount}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-border/60">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : tab === "replies" ? (
            replies.length === 0 ? (
              <div className="px-4 py-12 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground/40 mb-3">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <p className="text-xs text-muted-foreground">No new replies on your posts.</p>
              </div>
            ) : (
              <ul>
                {replies.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => handleNotificationClick(r)}
                    className="relative cursor-pointer px-4 py-3 transition-colors hover:bg-secondary/50 flex items-start gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-card-foreground leading-normal">
                        <span className="font-semibold">{r.metadata.author_name || "Someone"}</span>
                        <span className="text-muted-foreground"> replied to your post </span>
                        <span className="font-medium">"{r.metadata.post_title}"</span>
                      </p>
                      <div 
                        className="mt-1 text-xs text-muted-foreground line-clamp-2 bg-secondary/30 p-1.5 rounded border border-border/40 [&_p]:inline [&_p]:m-0 [&_p]:after:content-['\00a0'] [&_ul]:inline [&_ol]:inline [&_li]:inline"
                        dangerouslySetInnerHTML={{ __html: renderHtmlPreview(r.content) }}
                      />
                      <p className="mt-1.5 text-[10px] text-muted-foreground/80">{timeAgo(r.created_at)}</p>
                    </div>

                    <button
                      onClick={(e) => markAsViewed(r.id, e)}
                      aria-label="Dismiss"
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent/15 hover:text-accent text-muted-foreground transition-all shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )
          ) : announcementsList.length === 0 ? (
            <div className="px-4 py-12 text-center flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground/40 mb-3">
                <Megaphone className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground">No new announcements or updates.</p>
            </div>
          ) : (
            <ul>
              {announcementsList.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleNotificationClick(a)}
                  className="relative cursor-pointer px-4 py-3 transition-colors hover:bg-secondary/50 flex items-start gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.metadata.tag && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-medium leading-none ${
                            tagColors[a.metadata.tag] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.metadata.tag}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" /> {a.metadata.date || timeAgo(a.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-card-foreground leading-snug">
                      {a.title}
                    </p>
                    {a.metadata.summary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {a.metadata.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                    <button
                      onClick={(e) => markAsViewed(a.id, e)}
                      aria-label="Dismiss"
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent/15 hover:text-accent text-muted-foreground transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 bg-secondary/20">
          <button
            onClick={() => {
              setOpen(false);
              router.push(tab === "replies" ? "/community/forum" : "/study/announcements");
            }}
            className="w-full text-center text-xs font-medium text-accent hover:underline"
          >
            {tab === "replies" ? "View all in Community →" : "View all Announcements →"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
