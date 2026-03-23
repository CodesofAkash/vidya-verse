"use client";
// app/vidya-sang/page.tsx

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Plus, CheckCircle, Clock, TrendingUp, Loader2, ChevronRight, Tag } from "lucide-react";
import { motion } from "framer-motion";

const DEPARTMENTS = ["COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS","ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH"];
const DEPT_LABELS: Record<string, string> = {
  COMPUTER: "CSE", PHYSICS: "Physics", CHEMISTRY: "Chemistry", MATHEMATICS: "Maths",
  ELECTRONICS: "ECE", BOTANY: "Botany", ZOOLOGY: "Zoology", BIOLOGY: "Biology", ENGLISH: "English",
};

type Question = {
  id: string; title: string; body: string; subject: string;
  semester?: number; department?: string; tags: string[];
  viewCount: number; answerCount: number; isResolved: boolean;
  createdAt: string;
  author: { id: string; name: string; profilePicture?: string; roles: string[] };
  _count: { answers: number };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function VidyaSangPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const fetchQuestions = async (reset = false) => {
    if (reset) setLoading(true);
    const params = new URLSearchParams({ page: reset ? "1" : String(page), limit: "15", sort });
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    if (data.success) {
      setQuestions(reset ? data.data.questions : (prev: Question[]) => [...prev, ...data.data.questions]);
      setTotal(data.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(true); setPage(1); }, [search, department, sort]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-muted/40 to-background border-b border-border/50 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <MessageSquare className="h-4 w-4" />
            Ask. Answer. Learn.
          </div>
          <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-3">VidyaSang</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A community Q&A platform where every student can ask doubts and every student can answer.
          </p>
          <div className="mt-6">
            <Button onClick={() => session ? router.push("/vidya-sang/ask") : router.push("/login?callbackUrl=/vidya-sang/ask")} className="gap-2">
              <Plus className="h-4 w-4" />
              Ask a Question
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Viewed</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* Stats row */}
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${total} question${total !== 1 ? "s" : ""}`}
        </div>

        {/* Questions list */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-border/50">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No questions found.</p>
            <Button className="mt-4" onClick={() => router.push("/vidya-sang/ask")}>Be the first to ask!</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/vidya-sang/questions/${q.id}`}
                  className="block glass rounded-xl border border-border/50 p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex gap-4">
                    {/* Vote/answer counts */}
                    <div className="hidden sm:flex flex-col items-center gap-2 shrink-0 min-w-[52px]">
                      <div className={`text-center px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                        q.isResolved ? "bg-green-500/10 text-green-600" : q._count.answers > 0 ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                      }`}>
                        <div className="text-base font-bold">{q._count.answers}</div>
                        <div>ans</div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">
                        <div>{q.viewCount}</div>
                        <div>views</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        {q.isResolved && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <CheckCircle className="h-3 w-3" /> Resolved
                          </span>
                        )}
                        {q.department && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {DEPT_LABELS[q.department] || q.department}
                          </span>
                        )}
                        {q.semester && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Sem {q.semester}</span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                        {q.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.body}</p>

                      {/* Tags */}
                      {q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {q.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-primary/8 text-primary border border-primary/15">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">{q.author.name}</span>
                        <span>·</span>
                        <span>{q.subject}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo(q.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Load more */}
            {questions.length < total && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => { setPage((p) => p + 1); fetchQuestions(); }}>
                  Load more questions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}