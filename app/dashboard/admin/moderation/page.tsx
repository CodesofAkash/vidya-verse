"use client";
// app/dashboard/admin/moderation/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, XCircle, ChevronDown,
  Loader2, AlertCircle, Clock, ExternalLink,
  Upload, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type PendingUpload = {
  id: string; title: string; description: string;
  subject: string; semester: number; department: string;
  resourceType: string; chapterTopic?: string;
  blobUrl: string; fileSize: number; status: string;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string; profilePicture?: string };
};

const STATUS_TABS = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
const TYPE_LABELS: Record<string, string> = { NOTES: "Notes", PYQ: "PYQ", SYLLABUS: "Syllabus" };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ModerationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>("PENDING");
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { type: "success" | "error"; msg: string }>>({});
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (session && !user?.roles?.some((r: string) => r === "ADMIN" || r === "OWNER")) {
      router.push("/dashboard");
    }
  }, [session, user, router]);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation?status=${activeTab}`);
      const data = await res.json();
      if (data.success) { setUploads(data.data.uploads); setTotal(data.data.total); }
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  // UploadThing hook for moving approved files to permanent storage
  const { startUpload, isUploading } = useUploadThing("resourceUploader" as keyof OurFileRouter, {
    onUploadProgress: (progress) => {
      if (uploadingForId) setUploadProgress((prev) => ({ ...prev, [uploadingForId]: progress }));
    },
    onClientUploadComplete: async (res) => {
      if (!res?.[0] || !uploadingForId) return;
      const { url, key } = res[0];
      // Now approve in DB
      const modRes = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadingForId,
          decision: "APPROVED",
          uploadthingUrl: url,
          uploadthingKey: key,
        }),
      });
      const data = await modRes.json();
      if (!modRes.ok) {
        setFeedback((prev) => ({ ...prev, [uploadingForId]: { type: "error", msg: data.message } }));
      } else {
        setFeedback((prev) => ({ ...prev, [uploadingForId]: { type: "success", msg: "Approved and published!" } }));
        setTimeout(() => { fetchUploads(); setExpandedId(null); }, 1500);
      }
      setUploadingForId(null);
      setProcessing(null);
    },
    onUploadError: (error) => {
      if (uploadingForId) {
        setFeedback((prev) => ({ ...prev, [uploadingForId]: { type: "error", msg: `Upload failed: ${error.message}` } }));
        setUploadingForId(null);
        setProcessing(null);
      }
    },
  });

  const handleApprove = async (upload: PendingUpload) => {
    // Fetch the blob file, then re-upload to UploadThing
    setProcessing(upload.id);
    setUploadingForId(upload.id);
    setFeedback((prev) => ({ ...prev, [upload.id]: { type: "success", msg: "Fetching file from storage..." } }));

    try {
      // Fetch the blob as File
      const blobResp = await fetch(upload.blobUrl);
      const blob = await blobResp.blob();
      const ext = upload.blobUrl.split(".").pop()?.split("?")[0] || "pdf";
      const file = new File([blob], `${upload.title.replace(/\s+/g, "_")}.${ext}`, { type: blob.type });

      setFeedback((prev) => ({ ...prev, [upload.id]: { type: "success", msg: "Uploading to permanent storage..." } }));
      await startUpload([file]);
    } catch (err: any) {
      setFeedback((prev) => ({ ...prev, [upload.id]: { type: "error", msg: `Failed to process file: ${err.message}` } }));
      setUploadingForId(null);
      setProcessing(null);
    }
  };

  const handleReject = async (uploadId: string) => {
    const reason = rejectionReasons[uploadId]?.trim();
    if (!reason) {
      setFeedback((prev) => ({ ...prev, [uploadId]: { type: "error", msg: "Please provide a rejection reason." } }));
      return;
    }
    setProcessing(uploadId);
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, decision: "REJECTED", rejectionReason: reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback((prev) => ({ ...prev, [uploadId]: { type: "error", msg: data.message } }));
    } else {
      setFeedback((prev) => ({ ...prev, [uploadId]: { type: "success", msg: "Rejected successfully." } }));
      setTimeout(() => { fetchUploads(); setExpandedId(null); }, 1200);
    }
    setProcessing(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10"><FileText className="h-6 w-6 text-blue-500" /></div>
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">Review and publish student uploads</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 w-fit flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : uploads.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-border/50">
          <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab.toLowerCase()} uploads</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => {
            const isExpanded = expandedId === upload.id;
            return (
              <motion.div key={upload.id} layout className="glass rounded-xl border border-border/50 overflow-hidden">
                <button
                  className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : upload.id)}
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{upload.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {TYPE_LABELS[upload.resourceType] || upload.resourceType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {upload.uploadedBy.name} · {upload.subject} · Sem {upload.semester} · {upload.department} · {formatSize(upload.fileSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(upload.createdAt).toLocaleDateString("en-IN")}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                          <p className="mt-1 text-sm bg-muted/30 rounded-lg p-3 border border-border/40 leading-relaxed">{upload.description}</p>
                        </div>

                        {upload.chapterTopic && (
                          <p className="text-sm text-muted-foreground"><strong>Chapter/Topic:</strong> {upload.chapterTopic}</p>
                        )}

                        {/* Preview link */}
                        <a
                          href={upload.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Eye className="h-4 w-4" /> Preview File
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        {/* Feedback message */}
                        {feedback[upload.id] && (
                          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                            feedback[upload.id].type === "success"
                              ? "bg-green-500/10 text-green-600 border border-green-500/30"
                              : "bg-red-500/10 text-red-600 border border-red-500/30"
                          }`}>
                            {feedback[upload.id].type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                            <div>
                              <p>{feedback[upload.id].msg}</p>
                              {uploadingForId === upload.id && uploadProgress[upload.id] && (
                                <div className="mt-2 w-full bg-green-500/20 rounded-full h-1.5">
                                  <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress[upload.id]}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions — only for PENDING */}
                        {activeTab === "PENDING" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Rejection Reason (required if rejecting)
                              </label>
                              <textarea
                                rows={2}
                                value={rejectionReasons[upload.id] || ""}
                                onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [upload.id]: e.target.value }))}
                                placeholder="e.g. File is incomplete, duplicate content, poor quality..."
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                disabled={processing === upload.id || isUploading}
                                onClick={() => handleApprove(upload)}
                              >
                                {processing === upload.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Approve & Publish</>}
                              </Button>
                              <Button
                                size="sm" variant="destructive" className="flex-1"
                                disabled={processing === upload.id}
                                onClick={() => handleReject(upload.id)}
                              >
                                {processing === upload.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Reject</>}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}