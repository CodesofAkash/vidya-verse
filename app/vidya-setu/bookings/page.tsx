"use client";
// app/vidya-setu/bookings/page.tsx

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, CheckCircle, XCircle, Star,
  Loader2, ExternalLink, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Booking = {
  id: string; subject: string; message: string;
  scheduledAt?: string; durationMins: number; status: string;
  meetingLink?: string; menteeRating?: number; menteeReview?: string;
  createdAt: string;
  mentorProfile: { id: string; headline: string; user: { name: string; profilePicture?: string } };
  mentee: { id: string; name: string; profilePicture?: string };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-green-600 bg-green-500/10 border-green-500/20", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-red-500 bg-red-500/10 border-red-500/20", icon: XCircle },
  COMPLETED: { label: "Completed", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: CheckCircle },
};

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [role, setRole] = useState<"mentee" | "mentor">("mentee");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const [meetingLinkInput, setMeetingLinkInput] = useState<Record<string, string>>({});
  const [ratingForm, setRatingForm] = useState<Record<string, { rating: number; review: string }>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/vidya-setu/bookings");
  }, [status, router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mentors/bookings?role=${role}`);
      const data = await res.json();
      if (data.success) setBookings(data.data.bookings);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [role]);

  const doAction = async (bookingId: string, action: string, extra: Record<string, any> = {}) => {
    setActionLoading(bookingId);
    setError((prev) => ({ ...prev, [bookingId]: "" }));
    try {
      const res = await fetch("/api/mentors/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { setError((prev) => ({ ...prev, [bookingId]: data.message })); return; }
      await fetchBookings();
      setExpandedId(null);
    } finally { setActionLoading(null); }
  };

  const isMentor = user?.roles?.some((r: string) => r === "MENTOR" || r === "ADMIN" || r === "OWNER");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-[var(--font-crimson)]">My Bookings</h1>
        <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Role toggle — only show if user is a mentor */}
      {isMentor && (
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 w-fit">
          {(["mentee", "mentor"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                role === r ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              As {r === "mentee" ? "Student" : "Mentor"}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : bookings.length === 0 ? (
        <div className="glass rounded-xl border border-border/50 p-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No bookings yet</p>
          {role === "mentee" && (
            <Button className="mt-4" onClick={() => router.push("/vidya-setu")}>Browse Mentors</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === booking.id;
            const isMentorView = role === "mentor";
            const otherPerson = isMentorView ? booking.mentee : booking.mentorProfile.user;

            return (
              <motion.div key={booking.id} layout className="glass rounded-xl border border-border/50 overflow-hidden">
                {/* Header */}
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {otherPerson.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isMentorView ? `From: ${otherPerson.name}` : `Mentor: ${otherPerson.name}`}
                      {booking.scheduledAt && ` · ${new Date(booking.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} shrink-0`}>
                    <StatusIcon className="h-3 w-3" /> {cfg.label}
                  </span>
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Message</p>
                          <p className="text-sm bg-muted/30 rounded-lg p-3 border border-border/40 leading-relaxed">{booking.message}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium">{booking.durationMins} minutes</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Requested</p>
                            <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                        </div>

                        {booking.meetingLink && (
                          <a
                            href={booking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" /> Join Meeting
                          </a>
                        )}

                        {error[booking.id] && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />{error[booking.id]}
                          </div>
                        )}

                        {/* Mentor actions */}
                        {isMentorView && booking.status === "PENDING" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={actionLoading === booking.id}
                                onClick={() => doAction(booking.id, "CONFIRM", {
                                  meetingLink: meetingLinkInput[booking.id] || undefined,
                                })}
                              >
                                {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Confirm</>}
                              </Button>
                              <Button
                                size="sm" variant="destructive"
                                disabled={actionLoading === booking.id}
                                onClick={() => doAction(booking.id, "CANCEL")}
                              >
                                {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Decline</>}
                              </Button>
                            </div>
                            <input
                              type="url"
                              placeholder="Meeting link (Google Meet / Zoom) — optional"
                              value={meetingLinkInput[booking.id] || ""}
                              onChange={(e) => setMeetingLinkInput((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background"
                            />
                          </div>
                        )}

                        {isMentorView && booking.status === "CONFIRMED" && (
                          <div className="space-y-3">
                            {!booking.meetingLink && (
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  placeholder="Add/update meeting link..."
                                  value={meetingLinkInput[booking.id] || ""}
                                  onChange={(e) => setMeetingLinkInput((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                                />
                                <Button size="sm" variant="outline" onClick={() => doAction(booking.id, "SET_LINK", { meetingLink: meetingLinkInput[booking.id] })}>
                                  Save Link
                                </Button>
                              </div>
                            )}
                            <Button size="sm" onClick={() => doAction(booking.id, "COMPLETE")} disabled={actionLoading === booking.id}>
                              {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Completed"}
                            </Button>
                          </div>
                        )}

                        {/* Mentee: cancel pending */}
                        {!isMentorView && booking.status === "PENDING" && (
                          <Button size="sm" variant="destructive" disabled={actionLoading === booking.id} onClick={() => doAction(booking.id, "CANCEL")}>
                            {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Request"}
                          </Button>
                        )}

                        {/* Mentee: rate completed */}
                        {!isMentorView && booking.status === "COMPLETED" && !booking.menteeRating && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Rate this session</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm((prev) => ({ ...prev, [booking.id]: { ...prev[booking.id] || { review: "" }, rating: star } }))}
                                  className={`text-2xl transition-transform hover:scale-110 ${
                                    (ratingForm[booking.id]?.rating || 0) >= star ? "text-yellow-400" : "text-muted-foreground/30"
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={2} placeholder="Optional review..."
                              value={ratingForm[booking.id]?.review || ""}
                              onChange={(e) => setRatingForm((prev) => ({ ...prev, [booking.id]: { ...prev[booking.id] || { rating: 0 }, review: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background resize-none"
                            />
                            <Button
                              size="sm" disabled={!ratingForm[booking.id]?.rating || actionLoading === booking.id}
                              onClick={() => doAction(booking.id, "RATE", {
                                menteeRating: ratingForm[booking.id]?.rating,
                                menteeReview: ratingForm[booking.id]?.review || undefined,
                              })}
                            >
                              {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Star className="h-4 w-4 mr-1" />Submit Rating</>}
                            </Button>
                          </div>
                        )}

                        {/* Show existing rating */}
                        {booking.menteeRating && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <span key={s} className={s <= (booking.menteeRating || 0) ? "text-yellow-400" : "text-muted-foreground/20"}>★</span>
                              ))}
                            </div>
                            {booking.menteeReview && <span className="text-muted-foreground">"{booking.menteeReview}"</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}