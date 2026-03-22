"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Star, Trash2, AlertCircle, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Bookmark {
  id: string;
  createdAt: string;
  resource: {
    id: string;
    title: string;
    resourceType: string;
    subject: string;
    semester: number;
    downloadCount: number;
    averageRating: number | null;
    uploadedBy: { name: string | null };
  };
}

const typeColors: Record<string, string> = {
  NOTES: "bg-blue-500/10 text-blue-500",
  PYQ: "bg-orange-500/10 text-orange-500",
  SYLLABUS: "bg-purple-500/10 text-purple-500",
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      const data = await res.json();
      if (data.success) {
        setBookmarks(data.data?.bookmarks ?? []);
      } else {
        setError("Failed to fetch bookmarks");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (resourceId: string) => {
    setRemoving(resourceId);
    try {
      const res = await fetch(`/api/bookmarks?resourceId=${resourceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks((prev) => prev.filter((b) => b.resource.id !== resourceId));
      }
    } catch (err) {
      console.error("Remove bookmark error:", err);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-2xl border border-destructive/40 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button onClick={fetchBookmarks} variant="outline" size="sm">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Your Bookmarks</h1>
        <p className="text-sm text-muted-foreground">
          {bookmarks.length === 0
            ? "No bookmarks yet"
            : `${bookmarks.length} saved resource${bookmarks.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-border/60 p-14 text-center"
        >
          <BookOpen className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Browse resources and bookmark the ones you want to revisit
          </p>
          <Link href="/vidya-vault">
            <Button size="sm">Browse Resources</Button>
          </Link>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {bookmarks.map((bookmark, i) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl border border-border/60 hover:border-primary/40 transition-all p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          typeColors[bookmark.resource.resourceType] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {bookmark.resource.resourceType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Sem {bookmark.resource.semester}
                      </span>
                    </div>

                    <h3 className="font-semibold mb-1 leading-snug">
                      {bookmark.resource.title}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {bookmark.resource.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {bookmark.resource.downloadCount.toLocaleString()}
                      </span>
                      {bookmark.resource.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {bookmark.resource.averageRating.toFixed(1)}
                        </span>
                      )}
                      <span>
                        by {bookmark.resource.uploadedBy.name || "Anonymous"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/vidya-vault?resource=${bookmark.resource.id}`}>
                      <Button size="sm" className="h-8 text-xs w-full">View</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10 w-full"
                      disabled={removing === bookmark.resource.id}
                      onClick={() => handleRemove(bookmark.resource.id)}
                    >
                      {removing === bookmark.resource.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Remove
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}