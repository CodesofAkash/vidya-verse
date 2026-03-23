"use client";
// app/vidya-setu/become-mentor/page.tsx

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";

const DEPARTMENTS = ["COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS","ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH"];
const DEPT_LABELS: Record<string, string> = {
  COMPUTER: "Computer Science", PHYSICS: "Physics", CHEMISTRY: "Chemistry",
  MATHEMATICS: "Mathematics", ELECTRONICS: "Electronics", BOTANY: "Botany",
  ZOOLOGY: "Zoology", BIOLOGY: "Biology", ENGLISH: "English",
};
const AVAIL_OPTIONS = [
  { value: "WEEKDAY_MORNINGS", label: "Weekday Mornings" },
  { value: "WEEKDAY_EVENINGS", label: "Weekday Evenings" },
  { value: "WEEKENDS", label: "Weekends" },
  { value: "FLEXIBLE", label: "Flexible" },
];

export default function BecomeMentorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const hasMentorRole = user?.roles?.includes("MENTOR") || user?.roles?.some((r: string) => r === "ADMIN" || r === "OWNER");

  const [form, setForm] = useState({
    headline: "", bio: "", expertise: [] as string[],
    department: "COMPUTER", semester: "",
    availability: [] as string[], hourlyRate: "",
  });
  const [expertiseInput, setExpertiseInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/vidya-setu/become-mentor");
  }, [status, router]);

  const addExpertise = () => {
    const e = expertiseInput.trim();
    if (e && !form.expertise.includes(e) && form.expertise.length < 10) {
      setForm({ ...form, expertise: [...form.expertise, e] });
      setExpertiseInput("");
    }
  };

  const toggleAvailability = (val: string) => {
    const has = form.availability.includes(val);
    setForm({
      ...form,
      availability: has ? form.availability.filter((a) => a !== val) : [...form.availability, val],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.expertise.length === 0) { setError("Add at least 1 area of expertise"); return; }
    if (form.availability.length === 0) { setError("Select at least 1 availability slot"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          bio: form.bio,
          expertise: form.expertise,
          department: form.department,
          semester: form.semester ? parseInt(form.semester) : undefined,
          availability: form.availability,
          hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess(true);
      setTimeout(() => router.push("/vidya-setu"), 2000);
    } catch {
      setError("Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasMentorRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center glass rounded-2xl border border-border/50 p-8 space-y-4">
          <Zap className="h-12 w-12 text-orange-500 mx-auto" />
          <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Mentor Role Required</h1>
          <p className="text-muted-foreground">You need the MENTOR role to create a mentor profile. Request it from your dashboard.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/role-request"><Button>Request MENTOR Role</Button></Link>
            <Link href="/vidya-setu"><Button variant="outline">Back</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold gradient-text font-[var(--font-crimson)]">Profile Saved!</h2>
          <p className="text-muted-foreground">Redirecting to mentor listings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/vidya-setu" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Mentors
        </Link>

        <div className="glass rounded-2xl border border-border/50 p-8">
          <h1 className="text-2xl font-bold font-[var(--font-crimson)] mb-2">Mentor Profile</h1>
          <p className="text-muted-foreground text-sm mb-8">Set up your mentor profile so students can find and book you.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1.5">Headline *</label>
              <input
                type="text" required minLength={10} maxLength={150}
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder='e.g. "3rd Year CSE | Expert in DSA & Web Dev"'
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Bio *</label>
              <textarea
                required minLength={30} maxLength={2000} rows={5}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell students about yourself, your experience, teaching style, and what kind of help you offer..."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/2000</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Areas of Expertise * <span className="text-muted-foreground font-normal">(max 10)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text" value={expertiseInput} maxLength={40}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                  placeholder="e.g. Data Structures, React, Calculus"
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
                />
                <Button type="button" variant="outline" onClick={addExpertise} disabled={form.expertise.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.expertise.map((e) => (
                    <span key={e} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {e}
                      <button type="button" onClick={() => setForm({ ...form, expertise: form.expertise.filter((x) => x !== e) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Department *</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm"
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Your Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm"
                >
                  <option value="">Not specified</option>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Availability *</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAIL_OPTIONS.map(({ value, label }) => {
                  const selected = form.availability.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleAvailability(value)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Hourly Rate (₹) <span className="text-muted-foreground font-normal">— leave blank for free</span>
              </label>
              <input
                type="number" min="0" max="10000"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                placeholder="0 = Free"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full h-11 font-semibold">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Mentor Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}