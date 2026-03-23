"use client";
// app/vidya-setu/page.tsx

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Star, Calendar, Clock,
  Loader2, Plus, BookOpen, ChevronRight, Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const DEPARTMENTS = ["COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS","ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH"];
const DEPT_LABELS: Record<string, string> = {
  COMPUTER: "Computer Science", PHYSICS: "Physics", CHEMISTRY: "Chemistry",
  MATHEMATICS: "Mathematics", ELECTRONICS: "Electronics", BOTANY: "Botany",
  ZOOLOGY: "Zoology", BIOLOGY: "Biology", ENGLISH: "English",
};
const AVAIL_LABELS: Record<string, string> = {
  WEEKDAY_MORNINGS: "Weekday Mornings", WEEKDAY_EVENINGS: "Weekday Evenings",
  WEEKENDS: "Weekends", FLEXIBLE: "Flexible",
};

type MentorProfile = {
  id: string; userId: string; headline: string; bio: string;
  expertise: string[]; department: string; semester?: number;
  availability: string[]; hourlyRate?: number;
  totalSessions: number; averageRating?: number; totalRatings: number;
  user: { id: string; name: string; profilePicture?: string; college?: { name: string } };
  _count: { bookings: number };
};

export default function VidyaSetuPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  const hasMentorRole = user?.roles?.includes("MENTOR") || user?.roles?.some((r: string) => r === "ADMIN" || r === "OWNER");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "12" });
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    if (freeOnly) params.set("free", "true");

    fetch(`/api/mentors?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setMentors(d.data.mentors); setTotal(d.data.total); }
      })
      .finally(() => setLoading(false));
  }, [search, department, freeOnly]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-500/5 to-background border-b border-border/50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-sm font-medium mb-3">
                <Users className="h-4 w-4" />
                Find Your Mentor
              </div>
              <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text">VidyaSetu</h1>
              <p className="text-muted-foreground mt-1">Connect with experienced peers for 1-on-1 mentorship</p>
            </div>
            <div className="flex gap-3">
              {hasMentorRole ? (
                <Link href="/vidya-setu/become-mentor">
                  <Button className="gap-2"><Plus className="h-4 w-4" />My Mentor Profile</Button>
                </Link>
              ) : (
                <Link href="/dashboard/role-request">
                  <Button variant="outline" className="gap-2"><Zap className="h-4 w-4" />Become a Mentor</Button>
                </Link>
              )}
              <Link href="/vidya-setu/bookings">
                <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" />My Bookings</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, expertise, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
          </select>
          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
              freeOnly ? "border-green-500/40 bg-green-500/10 text-green-600" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            Free only
          </button>
        </div>

        <p className="text-sm text-muted-foreground">{loading ? "" : `${total} mentor${total !== 1 ? "s" : ""} available`}</p>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl border border-border/50">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No mentors found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/vidya-setu/mentors/${mentor.id}`}
                  className="block glass rounded-xl border border-border/50 p-5 hover:border-primary/30 hover:shadow-md transition-all group space-y-4"
                >
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                      {mentor.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold group-hover:text-primary transition-colors truncate">{mentor.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{mentor.headline}</p>
                      {mentor.user.college && (
                        <p className="text-xs text-muted-foreground/60 truncate">{mentor.user.college.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Rating + sessions */}
                  <div className="flex items-center gap-3 text-xs">
                    {mentor.averageRating ? (
                      <span className="flex items-center gap-1 text-yellow-500 font-medium">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {mentor.averageRating.toFixed(1)}
                        <span className="text-muted-foreground font-normal">({mentor.totalRatings})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No ratings yet</span>
                    )}
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{mentor.totalSessions} sessions</span>
                  </div>

                  {/* Expertise tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.expertise.slice(0, 3).map((e) => (
                      <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">{e}</span>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{mentor.expertise.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <div className="text-sm font-semibold">
                      {mentor.hourlyRate ? (
                        <span className="text-foreground">₹{mentor.hourlyRate}<span className="text-xs text-muted-foreground font-normal">/hr</span></span>
                      ) : (
                        <span className="text-green-600">Free</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Book Session <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}