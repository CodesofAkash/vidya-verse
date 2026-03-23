"use client";
// app/vidya-setu/mentors/[id]/page.tsx

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Star, Clock, Calendar, Users,
  CheckCircle, Loader2, AlertCircle, Send,
} from "lucide-react";
import { motion } from "framer-motion";

const AVAIL_LABELS: Record<string, string> = {
  WEEKDAY_MORNINGS: "Weekday Mornings",
  WEEKDAY_EVENINGS: "Weekday Evenings",
  WEEKENDS: "Weekends",
  FLEXIBLE: "Flexible",
};

type MentorProfile = {
  id: string; userId: string; headline: string; bio: string;
  expertise: string[]; department: string; semester?: number;
  availability: string[]; hourlyRate?: number;
  totalSessions: number; averageRating?: number; totalRatings: number;
  user: { id: string; name: string; profilePicture?: string; college?: { name: string } };
};

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({ subject: "", message: "", durationMins: "60" });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);

  useEffect(() => {
    // Fetch mentor by profile id — we fetch from the list and filter, or create a dedicated route
    // For simplicity we use the list endpoint with no filter and find by id
    // In production you'd have GET /api/mentors/[id]
    fetch(`/api/mentors?limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const found = d.data.mentors.find((m: MentorProfile) => m.id === id);
          if (found) setMentor(found);
          else setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    setBookError("");
    setBooking(true);
    try {
      const res = await fetch("/api/mentors/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentor!.id,
          subject: bookForm.subject,
          message: bookForm.message,
          durationMins: parseInt(bookForm.durationMins),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBookError(data.message); return; }
      setBookSuccess(true);
    } catch {
      setBookError("Booking failed. Try again.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (notFound || !mentor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Mentor not found</p>
        <Link href="/vidya-setu"><Button variant="outline" className="mt-4">Back to Mentors</Button></Link>
      </div>
    </div>
  );

  const isSelf = (session?.user as any)?.id === mentor.userId || (session?.user as any)?.sub === mentor.userId;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/vidya-setu" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Mentors
        </Link>

        {/* Profile card */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {mentor.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-[var(--font-crimson)]">{mentor.user.name}</h1>
              <p className="text-muted-foreground">{mentor.headline}</p>
              {mentor.user.college && <p className="text-sm text-muted-foreground/70 mt-0.5">{mentor.user.college.name}</p>}

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {mentor.averageRating ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    {mentor.averageRating.toFixed(1)} <span className="text-muted-foreground font-normal">({mentor.totalRatings} ratings)</span>
                  </span>
                ) : <span className="text-sm text-muted-foreground">No ratings yet</span>}
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" />{mentor.totalSessions} sessions
                </span>
                <span className="text-sm font-semibold">
                  {mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : <span className="text-green-600">Free</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{mentor.bio}</p>
          </div>

          {/* Expertise */}
          <div>
            <h3 className="font-semibold mb-2">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((e) => (
                <span key={e} className="px-3 py-1 rounded-full text-sm bg-primary/8 text-primary border border-primary/15 font-medium">{e}</span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-semibold mb-2">Availability</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.availability.map((a) => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-muted border border-border/50">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {AVAIL_LABELS[a] || a}
                </span>
              ))}
            </div>
          </div>

          {/* Book button */}
          {!isSelf && (
            <div className="pt-2 border-t border-border/50">
              {bookSuccess ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Booking request sent!</p>
                    <p className="text-sm opacity-80">{mentor.user.name} will review and confirm shortly.</p>
                  </div>
                </div>
              ) : (
                <Button onClick={() => session ? setShowBookForm(!showBookForm) : router.push("/login")} className="w-full sm:w-auto gap-2">
                  <Calendar className="h-4 w-4" />
                  {showBookForm ? "Cancel" : "Book a Session"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Booking form */}
        {showBookForm && !bookSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-border/50 p-6"
          >
            <h2 className="text-lg font-bold font-[var(--font-crimson)] mb-5">Book a Session with {mentor.user.name}</h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Topic / Subject *</label>
                <input
                  type="text" required minLength={5}
                  value={bookForm.subject}
                  onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                  placeholder="e.g. Help with Dynamic Programming"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                  required minLength={20} rows={4}
                  value={bookForm.message}
                  onChange={(e) => setBookForm({ ...bookForm, message: e.target.value })}
                  placeholder="Describe what you need help with, your current level, and what you hope to achieve..."
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Session Duration</label>
                <select
                  value={bookForm.durationMins}
                  onChange={(e) => setBookForm({ ...bookForm, durationMins: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {mentor.hourlyRate && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-sm">
                  <span className="font-medium">Estimated cost: </span>
                  <span className="text-primary font-semibold">
                    ₹{((mentor.hourlyRate * parseInt(bookForm.durationMins)) / 60).toFixed(0)}
                  </span>
                  <span className="text-muted-foreground"> (payment to be arranged with mentor)</span>
                </div>
              )}

              {bookError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />{bookError}
                </div>
              )}

              <Button type="submit" disabled={booking} className="w-full gap-2">
                {booking ? <><Loader2 className="h-4 w-4 animate-spin" />Sending request...</> : <><Send className="h-4 w-4" />Send Booking Request</>}
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}