"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Search, Filter, Download, Star, BookOpen,
  Loader2, AlertCircle, Bookmark, BookmarkCheck,
  TrendingUp, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Schema enums
const RESOURCE_TYPES = ["NOTES", "PYQ", "SYLLABUS"] as const;
const DEPARTMENTS = [
  "COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS",
  "ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH",
] as const;

const TYPE_COLORS: Record<string, string> = {
  NOTES:    "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PYQ:      "bg-orange-500/10 text-orange-600 border-orange-500/20",
  SYLLABUS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

interface Resource {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: number;
  department: string;
  resourceType: string;       // ← correct field name from API
  chapterTopic: string | null;
  fileSize: number;
  downloadCount: number;
  averageRating: number | null;
  totalRatings: number;
  isPremium: boolean;
  uploadedBy: { id: string; name: string | null };
}

interface RecommendedResource extends Resource {
  thumbnailUrl: string | null;
  createdAt: string;
}

export default function VidyaVaultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Search state
  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedType,     setSelectedType]     = useState("ALL");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedDept,     setSelectedDept]     = useState("ALL");
  const [sortBy,           setSortBy]           = useState("recent");

  // Data state
  const [resources,  setResources]  = useState<Resource[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Recommendations
  const [trending,     setTrending]     = useState<RecommendedResource[]>([]);
  const [personalized, setPersonalized] = useState<RecommendedResource[]>([]);
  const [recsLoading,  setRecsLoading]  = useState(true);

  // Bookmark state
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bookmarking, setBookmarking] = useState<Set<string>>(new Set());

  // Fetch recommendations on mount
  useEffect(() => {
    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const [trendRes, persRes] = await Promise.all([
          fetch("/api/recommendations?type=trending&limit=4"),
          fetch("/api/recommendations?type=personalized&limit=4"),
        ]);
        const trendData = await trendRes.json();
        const persData  = await persRes.json();
        if (trendData.success) setTrending(trendData.data.resources);
        if (persData.success)  setPersonalized(persData.data.resources);
      } catch {
        // silent — recs are non-critical
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecs();
  }, [status]);

  const fetchResources = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (searchQuery)            params.append("search",     searchQuery);
      if (selectedType !== "ALL") params.append("type",       selectedType);
      if (selectedSemester !== "ALL") params.append("semester", selectedSemester);
      if (selectedDept !== "ALL") params.append("department", selectedDept);
      params.append("sortBy", sortBy);

      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (data.success) {
        setResources(data.data.results);
        setPagination({
          page:       data.data.pagination.page,
          totalPages: data.data.pagination.totalPages,
          total:      data.data.pagination.total,
        });
      } else {
        setError("Failed to fetch resources");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedSemester, selectedDept, sortBy]);

  useEffect(() => { fetchResources(1); }, [selectedType, selectedSemester, selectedDept, sortBy]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchResources(1); };

  const handleDownload = async (resource: Resource) => {
    if (status !== "authenticated") { router.push("/login"); return; }
    try {
      const res  = await fetch(`/api/resources/${resource.id}/download`, { method: "POST" });
      const data = await res.json();
      if (res.status === 429) {
        alert(data.message); return;
      }
      if (data.success && data.data.fileUrl) {
        window.open(data.data.fileUrl, "_blank");
      }
    } catch {
      alert("Download failed. Please try again.");
    }
  };

  const handleBookmark = async (resourceId: string) => {
    if (status !== "authenticated") { router.push("/login"); return; }
    if (bookmarking.has(resourceId)) return;

    setBookmarking((p) => new Set(p).add(resourceId));
    const already = bookmarked.has(resourceId);
    try {
      if (already) {
        await fetch(`/api/bookmarks?resourceId=${resourceId}`, { method: "DELETE" });
        setBookmarked((p) => { const n = new Set(p); n.delete(resourceId); return n; });
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });
        setBookmarked((p) => new Set(p).add(resourceId));
      }
    } catch {
      // revert
    } finally {
      setBookmarking((p) => { const n = new Set(p); n.delete(resourceId); return n; });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-2">
          VidyaVault
        </h1>
        <p className="text-muted-foreground text-lg">
          Explore thousands of study materials shared by students
        </p>
      </motion.div>

      {/* ── Recommendations ── */}
      {!recsLoading && (trending.length > 0 || personalized.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Trending */}
          {trending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending this week
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {trending.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    resource={r}
                    bookmarked={bookmarked.has(r.id)}
                    onDownload={() => handleDownload(r)}
                    onBookmark={() => handleBookmark(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Personalized */}
          {personalized.length > 0 && status === "authenticated" && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                Picked for you
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {personalized.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    resource={r}
                    bookmarked={bookmarked.has(r.id)}
                    onDownload={() => handleDownload(r)}
                    onBookmark={() => handleBookmark(r.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Search & Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl border border-border/60 p-6 space-y-4"
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject, or topic…"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-6">Search</Button>
          <Link href="/search">
            <Button variant="outline" className="h-11 gap-2">
              <Filter className="h-4 w-4" /> Advanced
            </Button>
          </Link>
        </form>

        <div className="flex flex-wrap gap-3">
          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Semester */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Depts</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </motion.div>

      {/* ── Results header ── */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading
            ? "Loading…"
            : `${pagination.total.toLocaleString()} resource${pagination.total !== 1 ? "s" : ""} found`}
        </span>
        {pagination.totalPages > 1 && (
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        )}
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl border border-destructive/40 p-10 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchResources(pagination.page)} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && resources.length === 0 && (
        <div className="glass rounded-2xl border border-border/50 p-16 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No resources found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or search query</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery(""); setSelectedType("ALL");
              setSelectedSemester("ALL"); setSelectedDept("ALL");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* ── Resource List ── */}
      {!loading && !error && resources.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {resources.map((resource, i) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl border border-border/50 hover:border-primary/40 transition-all duration-300 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLORS[resource.resourceType] ?? "bg-muted text-muted-foreground"}`}>
                        {resource.resourceType}
                      </span>
                      {resource.isPremium && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                          ✦ Premium
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold mb-1 truncate pr-4">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {resource.subject}
                      </span>
                      <span>Sem {resource.semester}</span>
                      {resource.department && <span>{resource.department}</span>}
                      {resource.chapterTopic && <span>• {resource.chapterTopic}</span>}
                      <span>By {resource.uploadedBy.name ?? "Anonymous"}</span>
                    </div>

                    <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {resource.downloadCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        {resource.averageRating?.toFixed(1) ?? "—"}
                        {resource.totalRatings > 0 && (
                          <span className="text-muted-foreground/60">({resource.totalRatings})</span>
                        )}
                      </span>
                      <span>{(resource.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-2 h-9"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 h-9"
                      onClick={() => handleBookmark(resource.id)}
                      disabled={bookmarking.has(resource.id)}
                    >
                      {bookmarking.has(resource.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : bookmarked.has(resource.id) ? (
                        <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {bookmarked.has(resource.id) ? "Saved" : "Save"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => fetchResources(pagination.page - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchResources(pagination.page + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Recommendation mini-card ──────────────────────────────────────────────────
function RecommendationCard({
  resource,
  bookmarked,
  onDownload,
  onBookmark,
}: {
  resource: RecommendedResource;
  bookmarked: boolean;
  onDownload: () => void;
  onBookmark: () => void;
}) {
  return (
    <div className="glass rounded-xl border border-border/50 hover:border-primary/40 transition-all p-4 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[resource.resourceType] ?? "bg-muted"}`}>
          {resource.resourceType}
        </span>
        <button onClick={onBookmark} className="text-muted-foreground hover:text-primary transition-colors">
          {bookmarked
            ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
            : <Bookmark className="h-3.5 w-3.5" />}
        </button>
      </div>
      <h4 className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {resource.title}
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        {resource.subject} · Sem {resource.semester}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Download className="h-3 w-3" />
          {resource.downloadCount.toLocaleString()}
        </span>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={onDownload}>
          <Download className="h-3 w-3" /> Get
        </Button>
      </div>
    </div>
  );
}