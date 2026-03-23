"use client";
// app/dashboard/notifications/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender?: { name: string; profilePicture?: string };
};

const TYPE_ICONS: Record<string, string> = {
  ROLE_REQUEST_APPROVED: "✅",
  ROLE_REQUEST_REJECTED: "❌",
  ROLE_REQUEST_SUBMITTED: "🔔",
  UPLOAD_APPROVED: "📄",
  UPLOAD_REJECTED: "🚫",
  UPLOAD_UNDER_REVIEW: "🔍",
  NEW_ANSWER: "💬",
  ANSWER_ACCEPTED: "🏆",
  MENTOR_BOOKING_RECEIVED: "📚",
  MENTOR_BOOKING_CONFIRMED: "✅",
  MENTOR_BOOKING_CANCELLED: "❌",
  SYSTEM: "⚙️",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const LIMIT = 20;

  const fetchPage = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => append ? [...prev, ...data.data.notifications] : data.data.notifications);
        setTotal(data.data.total);
        setUnreadCount(data.data.unreadCount);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [notif.id] }) });
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  // Group by date
  const grouped: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const day = new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(n);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-[var(--font-crimson)]">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center border border-border/50">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">You're all caught up!</p>
          <p className="text-sm text-muted-foreground/70 mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{day}</p>
              <div className="space-y-1">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                      !n.isRead
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/8"
                        : "bg-background border-border/40 hover:bg-muted/20"
                    }`}
                  >
                    {/* Icon */}
                    <div className="text-xl shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] || "🔔"}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!n.isRead ? "text-foreground" : "text-foreground/80"}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      {n.linkUrl && (
                        <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                          View <ExternalLink className="h-3 w-3" />
                        </p>
                      )}
                    </div>
                    {/* Unread dot */}
                    {!n.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {notifications.length < total && (
            <div className="text-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</> : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}