"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Star, MessageSquare,
  Award, CheckCircle, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

// Schema-correct departments
const DEPARTMENTS = [
  "COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS",
  "ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH",
] as const;

export default function VidyaSetuPage() {
  const [filters, setFilters] = useState({
    search: "", department: "ALL", availability: "ALL",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-2">
          Find Mentors
        </h1>
        <p className="text-muted-foreground">
          Connect with experienced guides to accelerate your learning
        </p>
      </motion.div>

      {/* Filters */}
      <div className="glass rounded-2xl border border-border/50 p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search mentors…"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="ALL">All Mentors</option>
            <option value="AVAILABLE">Available Now</option>
            <option value="BUSY">Busy</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Mentors",    value: "0",   icon: Users },
          { label: "Active Sessions",  value: "0",   icon: MessageSquare },
          { label: "Success Stories",  value: "0",   icon: Award },
          { label: "Avg Rating",       value: "N/A", icon: Star },
        ].map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl border border-border/50 p-5"
          >
            <Icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Coming soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl border border-border/50 p-16 text-center"
      >
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold font-[var(--font-crimson)] mb-3">
          Mentorship Platform Coming Soon!
        </h2>
        <p className="text-muted-foreground text-base mb-10 max-w-xl mx-auto">
          Connect with experienced seniors, alumni, and industry professionals for
          personalised guidance on academics and career.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          {[
            { icon: Search,   title: "Find Your Mentor",   body: "Browse profiles matching your goals" },
            { icon: Calendar, title: "Schedule Sessions",  body: "Book 1-on-1 and group workshops" },
            { icon: Award,    title: "Track Your Growth",  body: "Monitor progress with mentors" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-xl border border-border/40 p-5">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {["Free for all students", "Verified mentors", "Career guidance"].map((f) => (
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