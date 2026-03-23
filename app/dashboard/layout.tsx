"use client";
// app/dashboard/layout.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Bookmark, User, Settings, BookOpen,
  Upload, MessageSquare, Users, Bell, Search, Menu, X,
  LogOut, ChevronRight, Shield, ExternalLink, CheckCheck,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/role-request", label: "Role Upgrade", icon: Shield },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
  { href: "/dashboard/admin/moderation", icon: Shield, label: "Moderation Queue" },
  { href: "/dashboard/admin/role-requests", icon: UserCheck, label: "Role Requests" },
];

const MODULE_ITEMS = [
  { href: "/vidya-vault", label: "VidyaVault", icon: BookOpen },
  { href: "/vidya-manch", label: "VidyaManch", icon: Upload },
  { href: "/vidya-sang", label: "VidyaSang", icon: MessageSquare },
  { href: "/vidya-setu", label: "VidyaSetu", icon: Users },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isAdmin = user?.roles?.some((r: string) => r === "ADMIN" || r === "OWNER");

  // Fetch unread count (polling every 30s)
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1");
      const data = await res.json();
      if (data.success) setUnreadCount(data.data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Fetch full list when bell opens
  const openBell = async () => {
    setBellOpen(true);
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications?limit=8");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [notif.id] }) });
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setBellOpen(false);
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5 border-b border-border/50">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">V</div>
        <div>
          <span className="font-bold text-base font-[var(--font-crimson)] gradient-text">VidyaVerse</span>
          <p className="text-xs text-muted-foreground leading-none">Knowledge Platform</p>
        </div>
      </Link>

      {/* User card */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Navigation</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="h-px bg-border/50 my-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Admin</p>
            <Link
              href="/dashboard/admin/role-requests"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/dashboard/admin") ? "bg-primary text-primary-foreground" : "text-orange-500 hover:bg-orange-500/10"
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Role Requests
            </Link>
            <Link
              href="/dashboard/admin/moderation"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/dashboard/admin/moderation") ? "bg-primary text-primary-foreground" : "text-orange-500 hover:bg-orange-500/10"
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Moderation Queue
            </Link>
          </>
        )}

        <div className="h-px bg-border/50 my-2" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Modules</p>
        {MODULE_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            <ExternalLink className="h-3 w-3 ml-auto opacity-40" />
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-background shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border/50 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground font-medium capitalize">
              {pathname.split("/").filter(Boolean).pop() || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={bellOpen ? () => setBellOpen(false) : openBell}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Dropdown */}
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Dropdown header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <span className="font-semibold text-sm">Notifications</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <CheckCheck className="h-3 w-3" /> Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="py-8 text-center"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0 ${
                              !n.isRead ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* View all footer */}
                    <div className="border-t border-border/50">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center justify-center gap-2 py-3 text-sm text-primary hover:bg-muted/30 transition-colors font-medium"
                      >
                        View all notifications
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}