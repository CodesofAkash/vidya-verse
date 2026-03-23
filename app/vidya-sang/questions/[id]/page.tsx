"use client";
// app/vidya-sang/questions/[id]/page.tsx

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle,
  Clock, Eye, Tag, Loader2, AlertCircle, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Author = { id: string; name: string; profilePicture?: string; roles: string[] };
type Vote = { type: "UP" | "DOWN" };
type Answer = {
  id: string; body: string; isAccepted: boolean;
  upvotes: number; downvotes: number;
  createdAt: string; updatedAt: string;
  author: Author;
  votes: Vote[];
};
type Question = {
  id: string; title: string; body: string;
  subject: string; semester?: number; department?: string;
  tags: string[]; viewCount: number; answerCount: number;
  isResolved: boolean; createdAt: string;
  author: Author; answers: Answer[];
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function RoleBadge({ roles }: { roles: string[] }) {
  if (roles.includes("OWNER")) return <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">Owner</span>;
  if (roles.includes("ADMIN")) return <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Admin</span>;
  if (roles.includes("MENTOR")) return <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">Mentor</span>;
  if (roles.includes("CONTRIBUTOR")) return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Contributor</span>;
  return null;
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [answerBody, setAnswerBody] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");

  const [votingId, setVotingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/questions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQuestion(d.data.question);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (answerId: string, type: "UP" | "DOWN") => {
    if (!session) { router.push("/login"); return; }
    setVotingId(answerId);
    try {
      const res = await fetch(`/api/answers/${answerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && question) {
        setQuestion({
          ...question,
          answers: question.answers.map((a) =>
            a.id === answerId
              ? { ...a, upvotes: data.data.upvotes, downvotes: data.data.downvotes, votes: data.data.userVote ? [{ type: data.data.userVote }] : [] }
              : a
          ),
        });
      }
    } finally {
      setVotingId(null);
    }
  };

  const handleAccept = async (answerId: string) => {
    if (!session) return;
    setAcceptingId(answerId);
    try {
      const res = await fetch(`/api/answers/${answerId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok && question) {
        setQuestion({
          ...question,
          isResolved: true,
          answers: question.answers.map((a) => ({ ...a, isAccepted: a.id === answerId })),
        });
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    if (answerBody.trim().length < 10) { setAnswerError("Answer must be at least 10 characters"); return; }
    setAnswerError("");
    setSubmittingAnswer(true);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: answerBody }),
      });
      const data = await res.json();
      if (!res.ok) { setAnswerError(data.message); return; }
      setAnswerBody("");
      // Append answer to list
      if (question) {
        setQuestion({
          ...question,
          answerCount: question.answerCount + 1,
          answers: [...question.answers, data.data.answer],
        });
      }
    } catch {
      setAnswerError("Failed to post answer. Try again.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  );

  if (notFound || !question) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Question not found</h2>
        <Link href="/vidya-sang"><Button variant="outline">Back to Questions</Button></Link>
      </div>
    </div>
  );

  const isQuestionAuthor = currentUser?.id === question.author.id || currentUser?.sub === question.author.id;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/vidya-sang" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Questions
        </Link>

        {/* Question card */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {question.isResolved && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                <CheckCircle className="h-3 w-3" /> Resolved
              </span>
            )}
            {question.department && <span className="text-xs bg-muted px-2.5 py-1 rounded-full">{question.department}</span>}
            {question.semester && <span className="text-xs bg-muted px-2.5 py-1 rounded-full">Sem {question.semester}</span>}
            <span className="text-xs bg-muted px-2.5 py-1 rounded-full">{question.subject}</span>
          </div>

          <h1 className="text-2xl font-bold font-[var(--font-crimson)]">{question.title}</h1>

          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{question.body}</p>

          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">#{tag}</span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {question.author.name?.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-foreground/80">{question.author.name}</span>
              <RoleBadge roles={question.author.roles} />
            </div>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(question.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{question.viewCount} views</span>
            <span>·</span>
            <span>{question.answers.length} answer{question.answers.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Answers section */}
        {question.answers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold font-[var(--font-crimson)]">
              {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
            </h2>

            {question.answers.map((answer, i) => {
              const userVote = answer.votes?.[0]?.type ?? null;
              const canAccept = isQuestionAuthor && !question.isResolved;

              return (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass rounded-xl border p-5 space-y-4 ${
                    answer.isAccepted ? "border-green-500/40 bg-green-500/5" : "border-border/50"
                  }`}
                >
                  {answer.isAccepted && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Accepted Answer
                    </div>
                  )}

                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.body}</p>

                  {/* Answer footer */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Vote buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(answer.id, "UP")}
                        disabled={votingId === answer.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          userVote === "UP"
                            ? "bg-green-500/15 text-green-600 border-green-500/30"
                            : "border-border/50 hover:border-green-500/40 hover:bg-green-500/5 text-muted-foreground hover:text-green-600"
                        }`}
                      >
                        {votingId === answer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                        <span>{answer.upvotes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(answer.id, "DOWN")}
                        disabled={votingId === answer.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          userVote === "DOWN"
                            ? "bg-red-500/15 text-red-500 border-red-500/30"
                            : "border-border/50 hover:border-red-500/40 hover:bg-red-500/5 text-muted-foreground hover:text-red-500"
                        }`}
                      >
                        {votingId === answer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                        <span>{answer.downvotes}</span>
                      </button>

                      {canAccept && (
                        <button
                          onClick={() => handleAccept(answer.id)}
                          disabled={acceptingId === answer.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-500/30 text-green-600 hover:bg-green-500/10 transition-colors"
                        >
                          {acceptingId === answer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          Accept
                        </button>
                      )}
                    </div>

                    {/* Author + time */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {answer.author.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground/70">{answer.author.name}</span>
                      <RoleBadge roles={answer.author.roles} />
                      <span>·</span>
                      <span>{timeAgo(answer.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Post answer form */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold font-[var(--font-crimson)]">
            {session ? "Your Answer" : "Sign in to Answer"}
          </h2>

          {session ? (
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <textarea
                rows={5}
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Share your knowledge. Be specific and helpful. Include code, examples, or step-by-step explanations if relevant."
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
              />
              {answerError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />{answerError}
                </div>
              )}
              <Button type="submit" disabled={submittingAnswer || answerBody.trim().length < 10} className="gap-2">
                {submittingAnswer ? <><Loader2 className="h-4 w-4 animate-spin" />Posting...</> : <><Send className="h-4 w-4" />Post Answer</>}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">You need to be signed in to post an answer.</p>
              <Link href={`/login?callbackUrl=/vidya-sang/questions/${id}`}>
                <Button>Sign in to Answer</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}