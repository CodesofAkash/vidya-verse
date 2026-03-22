"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Mail,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Building2,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  roles: string[];
  emailVerified: boolean;
  semester: number | null;
  department: string | null;
  collegeId: string | null;
  profilePicture: string | null;
  warningCount: number;
  canUpload: boolean;
  isActive: boolean;
  college: { name: string; city: string; state: string } | null;
  createdAt: string;
}

interface Stats {
  uploads: number;
  downloads: number;
  questions: number;
  bookmarks: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ uploads: 0, downloads: 0, questions: 0, bookmarks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/stats"),
        ]);

        if (!profileRes.ok) throw new Error("Failed to load profile");

        const profileData = await profileRes.json();
        setProfile(profileData.data?.profile ?? null);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data?.stats ?? stats);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-2xl border-2 border-destructive/40 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="font-semibold text-destructive mb-3">{error || "Failed to load profile"}</h3>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "Uploads", value: stats.uploads },
    { label: "Downloads", value: stats.downloads },
    { label: "Questions", value: stats.questions },
    { label: "Bookmarks", value: stats.bookmarks },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-border/60 overflow-hidden"
      >
        {/* Header strip */}
        <div className="h-20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />

        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-background">
              {profile.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                <Edit className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="space-y-2 mb-5">
            <h1 className="text-2xl font-bold font-[var(--font-crimson)]">
              {profile.name || "Anonymous"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{profile.email}</span>
              {profile.emailVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                {profile.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/60">
            {statItems.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Academic info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl border border-border/60 p-5"
      >
        <h2 className="font-bold mb-4 font-[var(--font-crimson)] flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          Academic Information
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Hash className="h-3 w-3" />
              Semester
            </div>
            <p className="font-semibold text-sm">
              {profile.semester ? `Semester ${profile.semester}` : "Not set"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BookOpen className="h-3 w-3" />
              Department
            </div>
            <p className="font-semibold text-sm">{profile.department || "Not set"}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Building2 className="h-3 w-3" />
              College
            </div>
            <p className="font-semibold text-sm truncate">
              {profile.college?.name || "Not set"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Account status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl border border-border/60 p-5"
      >
        <h2 className="font-bold mb-4 font-[var(--font-crimson)]">Account Status</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Email Verified", ok: profile.emailVerified },
            { label: "Account Active", ok: profile.isActive },
            { label: "Upload Permission", ok: profile.canUpload },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                item.ok
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${item.ok ? "text-green-500" : "text-red-400"}`}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        {profile.warningCount > 0 && (
          <div className="mt-3 flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-sm">
              You have <strong>{profile.warningCount}</strong> warning
              {profile.warningCount !== 1 ? "s" : ""} on your account
            </span>
          </div>
        )}
      </motion.div>

      {/* Recent activity placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-border/60 p-5"
      >
        <h2 className="font-bold mb-4 font-[var(--font-crimson)]">Recent Activity</h2>
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No recent activity yet</p>
        </div>
      </motion.div>
    </div>
  );
}