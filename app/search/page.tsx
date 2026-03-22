"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Search, Filter, Download, Star, BookOpen, Loader2,
  SlidersHorizontal, X, TrendingUp, Sparkles,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";

// Schema-correct constants
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
  id: string; title: string; description: string;
  subject: string; semester: number; department: string;
  resourceType: string; chapterTopic: string | null;
  fileSize: number; downloadCount: number;
  averageRating: number | null; totalRatings: number;
  isPremium: boolean; thumbnailUrl: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null };
}

// ─────────────────────────────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { data: session, status } = useSession();

  const initialQ = searchParams.get("q") || "";

  const [query,        setQuery]        = useState(initialQ);
  const [hasSearched,  setHasSearched]  = useState(!!initialQ);
  const [results,      setResults]      = useState<Resource[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);

  const [pagination, setPagination] = useState({
    page: 1, totalPages: 1, total: 0,
  });

  const [filters, setFilters] = useState({
    type:       "ALL",
    semester:   "ALL",
    department: "ALL",
    sortBy:     "recent",
  });

  // Recommendations
  const [trending,     setTrending]     = useState<Resource[]>([]);
  const [similar,      setSimilar]      = useState<Resource[]>([]);
  const [recsLoading,  setRecsLoading]  = useState(false);
  const [focusedId,    setFocusedId]    = useState<string | null>(null);

  // Bookmarks
  const [bookmarked,  setBookmarked]  = useState<Set<string>>(new Set());
  const [bookmarking, setBookmarking] = useState<Set<string>>(new Set());

  // Fetch trending once
  useEffect(() => {
    fetch("/api/recommendations?type=trending&limit=6")
      .then((r) => r.json())
      .then((d) => { if (d.success) setTrending(d.data.resources); })
      .catch(() => {});
  }, []);

  // Fetch similar when a result is focused
  useEffect(() => {
    if (!focusedId) { setSimilar([]); return; }
    setRecsLoading(true);
    fetch(`/api/recommendations?type=similar&resourceId=${focusedId}&limit=4`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSimilar(d.data.resources); })
      .catch(() => {})
      .finally(() => setRecsLoading(false));
  }, [focusedId]);

  const doSearch = useCallback(async (q: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (q)                           params.append("q",          q);
      if (filters.type !== "ALL")      params.append("type",       filters.type);
      if (filters.semester !== "ALL")  params.append("semester",   filters.semester);
      if (filters.department !== "ALL")params.append("department", filters.department);
      params.append("sortBy", filters.sortBy);

      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data.results);
        setPagination({
          page:       data.data.pagination.page,
          totalPages: data.data.pagination.totalPages,
          total:      data.data.pagination.total,
        });
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters]);

  // Run search on mount if initial query present
  useEffect(() => {
    if (initialQ) doSearch(initialQ, 1);
  }, []); // eslint-disable-line

  // Re-run when filters change (only if already searched)
  useEffect(() => {
    if (hasSearched) doSearch(query, 1);
  }, [filters]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    router.replace(`/search?q=${encodeURIComponent(query)}`);
    doSearch(query, 1);
  };

  const handleDownload = async (resource: Resource) => {
    if (status !== "authenticated") { router.push("/login"); return; }
    const res  = await fetch(`/api/resources/${resource.id}/download`, { method: "POST" });
    const data = await res.json();
    if (res.status === 429)    { alert(data.message); return; }
    if (data.success)           window.open(data.data.fileUrl, "_blank");
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
    } finally {
      setBookmarking((p) => { const n = new Set(p); n.delete(resourceId); return n; });
    }
  };

  const activeFiltersCount = [
    filters.type !== "ALL",
    filters.semester !== "ALL",
    filters.department !== "ALL",
    filters.sortBy !== "recent",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Title ── */}
        <div>
          <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-1">
            Search Resources
          </h1>
          <p className="text-muted-foreground text-sm">
            {hasSearched && query
              ? `Results for "${query}"`
              : "Find notes, PYQs, and study materials from across VidyaVerse"}
          </p>
        </div>

        {/* ── Search bar ── */}
        <form
          onSubmit={handleSearch}
          className="glass rounded-2xl border border-border/60 p-4 space-y-3"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, subject, chapter…"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <Button type="submit" className="h-12 px-8 gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 relative"
              onClick={() => setShowFilters((p) => !p)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* ── Recommendations shown UNDER search bar (before results) ── */}
          {!hasSearched && !loading && (
            <div className="pt-2 space-y-4">
              {trending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending this week
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setQuery(r.subject);
                          setHasSearched(true);
                          router.replace(`/search?q=${encodeURIComponent(r.subject)}`);
                          doSearch(r.subject, 1);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs border border-border bg-muted/50 hover:border-primary/60 hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${TYPE_COLORS[r.resourceType]?.includes("blue") ? "bg-blue-500" : TYPE_COLORS[r.resourceType]?.includes("orange") ? "bg-orange-500" : "bg-purple-500"}`} />
                        {r.subject}
                        <span className="text-muted-foreground/60">
                          <Download className="h-3 w-3 inline" /> {r.downloadCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tip: Search by subject like <em>"Data Structures"</em> or type like <em>"PYQ Mathematics"</em>
              </p>
            </div>
          )}
        </form>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl border border-border/50 overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </h3>
                  <div className="flex gap-2">
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7"
                        onClick={() => setFilters({ type:"ALL", semester:"ALL", department:"ALL", sortBy:"recent" })}>
                        Reset
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
                    >
                      <option value="ALL">All Types</option>
                      {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Semester</label>
                    <select
                      value={filters.semester}
                      onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
                    >
                      <option value="ALL">All</option>
                      {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
                    >
                      <option value="ALL">All</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="downloads">Most Downloaded</option>
                      <option value="rating">Highest Rated</option>
                      <option value="title">A → Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result count ── */}
        {hasSearched && !loading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {pagination.total.toLocaleString()} result{pagination.total !== 1 ? "s" : ""}
              {query && <> for <em>"{query}"</em></>}
            </span>
            {pagination.totalPages > 1 && (
              <span>Page {pagination.page} / {pagination.totalPages}</span>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* ── No results ── */}
        {!loading && hasSearched && results.length === 0 && (
          <div className="glass rounded-2xl border border-border/50 p-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">Try different keywords or adjust your filters</p>
            <Button variant="outline" onClick={() =>
              setFilters({ type:"ALL", semester:"ALL", department:"ALL", sortBy:"recent" })
            }>
              Clear Filters
            </Button>
          </div>
        )}

        {/* ── Results layout: list + similar sidebar ── */}
        {!loading && results.length > 0 && (
          <div className="flex gap-6">
            {/* Results list */}
            <div className="flex-1 min-w-0 space-y-4">
              <AnimatePresence mode="popLayout">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`glass rounded-2xl border transition-all duration-200 p-5 cursor-pointer
                      ${focusedId === r.id
                        ? "border-primary/60 ring-1 ring-primary/20"
                        : "border-border/50 hover:border-primary/30"}`}
                    onClick={() => setFocusedId(focusedId === r.id ? null : r.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${TYPE_COLORS[r.resourceType] ?? "bg-muted"}`}>
                            {r.resourceType}
                          </span>
                          {r.isPremium && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                              ✦ Premium
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base mb-1 truncate">{r.title}</h3>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {r.subject}
                          </span>
                          <span>Sem {r.semester}</span>
                          {r.department && <span>{r.department}</span>}
                          <span>By {r.uploadedBy.name ?? "Anonymous"}</span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" /> {r.downloadCount.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {r.averageRating?.toFixed(1) ?? "—"}
                            {r.totalRatings > 0 && <span className="opacity-60">({r.totalRatings})</span>}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm" className="gap-1.5 h-8 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleDownload(r); }}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                          disabled={bookmarking.has(r.id)}
                          onClick={(e) => { e.stopPropagation(); handleBookmark(r.id); }}>
                          {bookmarking.has(r.id) ? <Loader2 className="h-3 w-3 animate-spin" />
                            : bookmarked.has(r.id) ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                            : <Bookmark className="h-3.5 w-3.5" />}
                          {bookmarked.has(r.id) ? "Saved" : "Save"}
                        </Button>
                      </div>
                    </div>

                    {/* Similar resources — inline when focused */}
                    <AnimatePresence>
                      {focusedId === r.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-primary" /> Similar resources
                            </p>
                            {recsLoading ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                              </div>
                            ) : similar.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No similar resources found</p>
                            ) : (
                              <div className="grid sm:grid-cols-2 gap-2">
                                {similar.map((s) => (
                                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/30 hover:border-primary/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{s.title}</p>
                                      <p className="text-[10px] text-muted-foreground">{s.subject} · Sem {s.semester}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 shrink-0"
                                      onClick={() => handleDownload(s)}>
                                      <Download className="h-2.5 w-2.5" /> Get
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button variant="outline" size="sm" className="gap-1"
                    disabled={pagination.page === 1}
                    onClick={() => doSearch(query, pagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button variant="outline" size="sm" className="gap-1"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => doSearch(query, pagination.page + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Sticky sidebar — trending */}
            {trending.length > 0 && (
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-28 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Trending
                  </h3>
                  <div className="space-y-2">
                    {trending.map((r) => (
                      <div key={r.id}
                        className="glass rounded-xl border border-border/40 p-3 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => { setQuery(r.subject); setHasSearched(true); doSearch(r.subject, 1); }}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[r.resourceType] ?? "bg-muted"}`}>
                          {r.resourceType}
                        </span>
                        <p className="text-xs font-medium mt-1.5 line-clamp-2">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Download className="h-2.5 w-2.5" /> {r.downloadCount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Navbar />
      <SearchContent />
    </Suspense>
  );
}