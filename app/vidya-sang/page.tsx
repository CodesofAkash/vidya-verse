"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Plus, Search, CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

// Schema-correct departments
const DEPARTMENTS = [
  "COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS",
  "ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH",
] as const;

export default function VidyaSangPage() {
  const [showNewQuestion, setShowNewQuestion] = useState(false);

  const [filters, setFilters] = useState({
    search: "", semester: "ALL", department: "ALL", status: "ALL",
  });

  const [newQuestion, setNewQuestion] = useState({
    title: "", description: "", subject: "",
    semester: "1", department: "", tags: "",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-2">
            Doubts &amp; Q&amp;A
          </h1>
          <p className="text-muted-foreground">
            Ask questions and get help from the community
          </p>
        </div>
        <Button onClick={() => setShowNewQuestion(!showNewQuestion)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ask Question
        </Button>
      </motion.div>

      {/* New question form (UI-only — backend not built yet) */}
      {showNewQuestion && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass rounded-2xl border border-border/50 p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Ask a Question</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNewQuestion(false)}>
              Cancel
            </Button>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Q&A coming soon!"); }}>
            <div>
              <label className="block text-sm font-medium mb-2">Question Title *</label>
              <input
                type="text"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
                placeholder="e.g., How to implement binary search tree?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Describe your doubt *</label>
              <textarea
                value={newQuestion.description}
                onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                required rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm resize-none"
                placeholder="Explain your question in detail…"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Semester</label>
                <select
                  value={newQuestion.semester}
                  onChange={(e) => setNewQuestion({ ...newQuestion, semester: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
                >
                  {[1,2,3,4,5,6,7,8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={newQuestion.department}
                  onChange={(e) => setNewQuestion({ ...newQuestion, department: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
                >
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2">
              <MessageSquare className="h-4 w-4" /> Post Question
            </Button>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="glass rounded-2xl border border-border/50 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search questions…"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <select
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Questions</option>
            <option value="ANSWERED">Answered</option>
            <option value="UNANSWERED">Unanswered</option>
          </select>
        </div>
      </div>

      {/* Coming soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl border border-border/50 p-16 text-center"
      >
        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold font-[var(--font-crimson)] mb-3">Q&amp;A Coming Soon!</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          We're building a community Q&amp;A where you can ask doubts, get peer and mentor help,
          and earn reputation for great answers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {["Unlimited questions", "Expert answers", "Build reputation"].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}