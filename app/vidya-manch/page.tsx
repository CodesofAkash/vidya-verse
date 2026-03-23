"use client";
// app/vidya-manch/page.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Upload, Loader2, CheckCircle,
  AlertCircle, X, Info, Cloud, File,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const RESOURCE_TYPES = ["NOTES", "PYQ", "SYLLABUS"] as const;
const DEPARTMENTS = ["COMPUTER","PHYSICS","CHEMISTRY","MATHEMATICS","ELECTRONICS","BOTANY","ZOOLOGY","BIOLOGY","ENGLISH"] as const;
const DEPT_LABELS: Record<string, string> = {
  COMPUTER: "Computer Science", PHYSICS: "Physics", CHEMISTRY: "Chemistry",
  MATHEMATICS: "Mathematics", ELECTRONICS: "Electronics", BOTANY: "Botany",
  ZOOLOGY: "Zoology", BIOLOGY: "Biology", ENGLISH: "English",
};
const MAX_SIZE_MB = 64;
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

type Step = "form" | "uploading" | "saving" | "done" | "error";

export default function VidyaManchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "", type: "NOTES", subject: "",
    semester: "1", department: "COMPUTER",
    chapterTopic: "", description: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/vidya-manch");
  }, [status, router]);

  const isVerified = (session?.user as any)?.emailVerified;

  const { startUpload, isUploading } = useUploadThing("pendingUploader", {
    onUploadProgress: (p) => setUploadProgress(Math.round(p)),
    onUploadError: (err) => {
      setError(err.message || "Upload failed");
      setStep("error");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError(`File type not supported. Allowed: ${ALLOWED_EXTS.join(", ")}`);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange({ target: { files: [f] } } as any);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!formData.title.trim()) { setError("Title is required"); return; }
    if (!formData.subject.trim()) { setError("Subject is required"); return; }
    if (!formData.description.trim()) { setError("Description is required"); return; }

    setError("");
    setStep("uploading");
    setUploadProgress(0);

    try {
      // Upload directly to UploadThing
      const uploadRes = await startUpload([file]);
      if (!uploadRes?.[0]) throw new Error("Upload failed — no response from server");

      const { url, key } = uploadRes[0] as any;
      const utSize = (uploadRes[0] as any).size ?? file.size;
      setUploadProgress(100);
      setStep("saving");

      // Simple hash for duplicate detection (client-side, good enough for MVP)
      const fileHash = btoa(`${file.size}-${file.name}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);

      // Save metadata — blobUrl stores the UploadThing URL (field name kept for DB compat)
      const saveRes = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          resourceType: formData.type,
          subject: formData.subject,
          semester: parseInt(formData.semester),
          department: formData.department,
          chapterTopic: formData.chapterTopic || undefined,
          description: formData.description,
          blobUrl: url,
          uploadthingKey: key,
          fileSize: utSize,
          fileHash,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.message || "Failed to save resource");
      }

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStep("error");
    }
  };

  const resetForm = () => {
    setStep("form"); setFile(null); setError(""); setUploadProgress(0);
    setFormData({ title: "", type: "NOTES", subject: "", semester: "1", department: "COMPUTER", chapterTopic: "", description: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text font-[var(--font-crimson)]">Submitted for Review!</h2>
          <p className="text-muted-foreground">
            Your file has been uploaded securely. An admin will review it shortly and you&apos;ll get a notification when approved.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={resetForm}>Upload Another</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-[var(--font-crimson)] gradient-text">VidyaManch</h1>
          <p className="text-muted-foreground mt-2">Share your study materials with the community</p>
        </div>

        {!isVerified && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Email not verified</p>
              <p className="text-sm text-muted-foreground">Please verify your email to upload resources.</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {(step === "uploading" || step === "saving") && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="glass rounded-2xl p-8 max-w-sm w-full mx-4 border border-border text-center space-y-4">
                <Cloud className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <h3 className="font-bold text-lg">
                  {step === "uploading" ? "Uploading file..." : "Saving your resource..."}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step === "uploading" ? "Please don't close this tab." : "Almost done!"}
                </p>
                {step === "uploading" && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div className="bg-primary h-2 rounded-full" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <p className="text-sm font-medium text-primary">{uploadProgress}%</p>
                  </>
                )}
                {step === "saving" && <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-border/50 p-8 space-y-6">
          {/* File drop zone */}
          <div
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              file ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20"
            }`}
          >
            <input ref={fileInputRef} type="file" accept={ALLOWED_EXTS.join(",")} onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); resetForm(); }} className="ml-2 p-1 rounded hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">{ALLOWED_EXTS.join(", ")} — max {MAX_SIZE_MB} MB</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input type="text" required value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Data Structures Unit 3 Notes"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Resource Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm">
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Semester *</label>
              <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm">
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject *</label>
              <input type="text" required value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Data Structures"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Department *</label>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Chapter / Topic <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input type="text" value={formData.chapterTopic}
              onChange={(e) => setFormData({ ...formData, chapterTopic: e.target.value })}
              placeholder="e.g. Trees and Graphs"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea required rows={3} value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this resource cover? Who is it useful for?"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Your file is stored securely. After admin review (usually within 24h), it will be published on VidyaVault.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit"
            disabled={!isVerified || !file || isUploading || step === "uploading" || step === "saving"}
            className="w-full h-12 text-base font-semibold"
          >
            {isUploading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading...</> : <><Upload className="mr-2 h-5 w-5" /> Upload for Review</>}
          </Button>
        </form>
      </div>
    </div>
  );
}