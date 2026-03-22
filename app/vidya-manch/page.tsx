"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, Loader2, CheckCircle,
  AlertCircle, X, Info, ShieldCheck, Clock,
} from "lucide-react";
import { motion } from "framer-motion";

// Match schema enums exactly
const RESOURCE_TYPES = ["NOTES", "PYQ", "SYLLABUS"] as const;
const DEPARTMENTS = [
  "COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS",
  "ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH",
] as const;

type FormData = {
  title:       string;
  type:        string;
  subject:     string;
  semester:    string;
  department:  string;
  chapterTopic:string;
  description: string;
};

export default function VidyaManchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  const [formData, setFormData] = useState<FormData>({
    title:       "",
    type:        "NOTES",
    subject:     "",
    semester:    "1",
    department:  "COMPUTER",
    chapterTopic:"",
    description: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/vidya-manch");
    }
  }, [status, router]);

  // Check email verification
  const isVerified = (session?.user as any)?.emailVerified;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50 MB"); return;
    }
    setFile(f);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!isVerified) { setError("Please verify your email before uploading"); return; }

    setUploading(true);
    setError("");

    try {
      // TODO: Replace with real Vercel Blob / UploadThing upload
      // For now we send a placeholder URL so the form can be tested
      const fileUrl = `https://storage.vidyaverse.com/placeholder/${Date.now()}_${encodeURIComponent(file.name)}`;

      // No Authorization header — session cookie is sent automatically
      const res  = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       formData.title,
          type:        formData.type,        // enum: NOTES | PYQ | SYLLABUS
          subject:     formData.subject,
          semester:    parseInt(formData.semester),
          department:  formData.department,
          chapterTopic:formData.chapterTopic || undefined,
          description: formData.description,
          fileUrl,
          fileSize:    file.size,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setSuccess(true);
      setTimeout(() => router.push("/vidya-vault"), 2500);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Submitted for Review!</h2>
          <p className="text-muted-foreground mb-2">
            Your resource will be reviewed by our moderators and published within 24 hours.
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Redirecting to VidyaVault…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text mb-2">
          Upload Resource
        </h1>
        <p className="text-muted-foreground">Share your notes and help fellow students</p>
      </motion.div>

      {/* Email not verified warning */}
      {status === "authenticated" && !isVerified && (
        <div className="glass rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-600 text-sm">Email not verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify your email first to upload resources.{" "}
              <button
                className="text-primary underline"
                onClick={() => fetch("/api/auth/resend-verification", { method: "POST" })}
              >
                Resend verification email
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="glass rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3 text-blue-600 text-sm">
          <Info className="h-4 w-4" /> Upload Guidelines
        </h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Only original or properly attributed content</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Maximum file size: 50 MB · PDF, DOCX, PPTX, XLSX</li>
          <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-blue-500" /> Your upload will be reviewed before being published</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="glass rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive">{error}</span>
          <button className="ml-auto" onClick={() => setError("")}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
      )}

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass rounded-2xl border border-border/50 p-8 space-y-5"
      >
        {/* File drop zone */}
        <div>
          <label className="block text-sm font-medium mb-2">File *</label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors hover:border-primary/50">
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <span className="text-sm">
                  <span className="text-primary font-medium">Choose a file</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </span>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, XLSX · Max 50 MB</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.pptx,.xlsx"
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required minLength={5}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
            placeholder="e.g., Data Structures Complete Notes"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Resource Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2">Subject *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required minLength={2}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
            placeholder="e.g., Data Structures"
          />
        </div>

        {/* Semester + Department */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Semester *</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            >
              {[1,2,3,4,5,6,7,8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Department *</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapter/Topic */}
        <div>
          <label className="block text-sm font-medium mb-2">Chapter / Topic <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input
            type="text"
            value={formData.chapterTopic}
            onChange={(e) => setFormData({ ...formData, chapterTopic: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
            placeholder="e.g., Trees and Graphs"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required minLength={10}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm resize-none"
            placeholder="Brief description of the content (min 10 characters)…"
          />
        </div>

        <Button
          type="submit"
          disabled={uploading || !file || !isVerified}
          className="w-full h-11 gap-2"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="h-4 w-4" /> Submit for Review</>
          )}
        </Button>
      </motion.form>
    </div>
  );
}