"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Upload,
  MessageSquare,
  Users,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  AlertCircle,
  Mail,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Stats {
  uploads: number;
  downloads: number;
  bookmarks: number;
  questions: number;
}

const quickActions = [
  {
    title: "Browse Resources",
    description: "Explore notes, PYQs, and study materials",
    icon: BookOpen,
    href: "/vidya-vault",
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "Upload Notes",
    description: "Share your knowledge with peers",
    icon: Upload,
    href: "/vidya-manch",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Ask Doubts",
    description: "Get help from the community",
    icon: MessageSquare,
    href: "/vidya-sang",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Find Mentors",
    description: "Connect with experienced guides",
    icon: Users,
    href: "/vidya-setu",
    gradient: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    uploads: 0,
    downloads: 0,
    bookmarks: 0,
    questions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.data?.stats ?? stats);
        }
      } catch {
        // silently fail — stats are non-critical
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const user = session?.user;
  const emailVerified = (user as any)?.emailVerified as boolean | undefined;

  const statItems = [
    { label: "Downloaded", value: stats.downloads, icon: BookOpen, color: "text-orange-500" },
    { label: "Questions", value: stats.questions, icon: MessageSquare, color: "text-purple-500" },
    { label: "Uploaded", value: stats.uploads, icon: Upload, color: "text-blue-500" },
    { label: "Bookmarks", value: stats.bookmarks, icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1 font-[var(--font-crimson)]">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your learning today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Keep learning!</span>
        </div>
      </motion.div>

      {/* Email verification banner */}
      {emailVerified === false && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-4 bg-yellow-500/10 border-2 border-yellow-500/40 rounded-2xl p-5"
        >
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
              Verify your email to unlock all features
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Check your inbox for a verification link we sent to{" "}
              <strong>{user?.email}</strong>.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 h-8 text-xs gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              Resend Verification Email
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="glass rounded-2xl p-5 border border-border/60 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Total
                </span>
              </div>
              <div className="text-2xl font-bold mb-0.5">
                {statsLoading ? (
                  <span className="inline-block w-6 h-6 bg-muted rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-lg font-bold mb-4 font-[var(--font-crimson)]">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
              >
                <Link href={action.href}>
                  <div className="group glass rounded-2xl p-5 border border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} shrink-0`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors text-sm">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {action.description}
                        </p>
                        <span className="inline-flex items-center gap-1 text-primary text-xs font-medium">
                          Get Started
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass rounded-2xl border border-border/60 p-5"
        >
          <h2 className="text-base font-bold mb-4 font-[var(--font-crimson)] flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </h2>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-3">No recent activity yet</p>
            <Link href="/vidya-vault">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                Browse Resources
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Getting started checklist */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5"
        >
          <h2 className="text-base font-bold mb-4 font-[var(--font-crimson)] flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Get Started
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Verify your email",
                done: !!emailVerified,
                href: null,
              },
              {
                label: "Complete your profile",
                done: !!(user as any)?.semester,
                href: "/dashboard/settings",
              },
              {
                label: "Browse study resources",
                done: stats.downloads > 0,
                href: "/vidya-vault",
              },
              {
                label: "Upload your first resource",
                done: stats.uploads > 0,
                href: "/vidya-manch",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${
                    item.done ? "text-green-500" : "text-muted-foreground/40"
                  }`}
                />
                {item.href && !item.done ? (
                  <Link
                    href={item.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`text-sm ${
                      item.done ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}