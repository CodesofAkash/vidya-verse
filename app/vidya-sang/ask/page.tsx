"use client";
// app/vidya-sang/ask/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, X, Plus } from "lucide-react";
import Link from "next/link";

const DEPARTMENTS = ["COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS","ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH"];

export default function AskQuestionPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [form, setForm] = useState({
    title: "", body: "", subject: "",
    semester: "", department: "", tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 5) {
      setForm({ ...form, tags: [...form.tags, t] });
      setTagInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          subject: form.subject,
          semester: form.semester ? parseInt(form.semester) : undefined,
          department: form.department || undefined,
          tags: form.tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      router.push(`/vidya-sang/questions/${data.data.question.id}`);
    } catch {
      setError("Failed to post question. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/vidya-sang" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to questions
        </Link>

        <div className="glass rounded-2xl border border-border/50 p-8">
          <h1 className="text-2xl font-bold font-[var(--font-crimson)] mb-6">Ask a Question</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                type="text" required minLength={10} maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What do you want to know? Be specific."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Details *</label>
              <textarea
                required minLength={20} rows={6}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Explain your question in detail. Include what you've tried, what you expected, and what happened."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject *</label>
                <input
                  type="text" required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Data Structures"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
                >
                  <option value="">Any semester</option>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
              >
                <option value="">Any department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Tags <span className="text-muted-foreground font-normal">(max 5)</span></label>
              <div className="flex gap-2">
                <input
                  type="text" value={tagInput} maxLength={30}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
                />
                <Button type="button" variant="outline" onClick={addTag} disabled={form.tags.length >= 5}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      #{tag}
                      <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : "Post Question"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}