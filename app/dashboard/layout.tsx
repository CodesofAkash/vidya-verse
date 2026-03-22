"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  Bookmark,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Loader2,
  BookOpen,
  MessageSquare,
  Users,
  Upload,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Bookmarks", href: "/dashboard/bookmarks", icon: Bookmark },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const modules = [
  { name: "VidyaVault", href: "/vidya-vault", icon: BookOpen, color: "text-orange-500" },
  { name: "VidyaManch", href: "/vidya-manch", icon: Upload, color: "text-blue-500" },
  { name: "VidyaSang", href: "/vidya-sang", icon: MessageSquare, color: "text-purple-500" },
  { name: "VidyaSetu", href: "/vidya-setu", icon: Users, color: "text-green-500" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const userInitial = session.user.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo — bigger, more prominent */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/vidya-verse-logo.png"
                alt="VidyaVerse"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-bold gradient-text font-[var(--font-crimson)] leading-tight block">
                VidyaVerse
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                Knowledge Platform
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User card */}
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate leading-tight">
                {session.user.name || "User"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Navigation
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground/70 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
              </Link>
            );
          })}

          <div className="pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Modules
            </p>
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm hover:bg-muted text-foreground/70 hover:text-foreground"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${mod.color}`} />
                  <span className="font-medium">{mod.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb / page title area */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-foreground font-medium capitalize">
                {pathname.split("/").pop() || "Dashboard"}
              </span>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}