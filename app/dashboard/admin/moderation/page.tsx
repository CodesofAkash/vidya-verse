"use client";
// app/dashboard/admin/moderation/page.tsx
// Approve flow: file is already in UploadThing (uploaded by user via pendingUploader).
// Admin just calls PATCH /api/admin/moderation with the existing blobUrl/uploadthingKey.
// No re-upload needed.

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, XCircle, ChevronDown,
  Loader2, AlertCircle, Clock, ExternalLink, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingUpload = {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: number;
  department: string;
  resourceType: string;
  chapterTopic?: string;
  blobUrl: string;
  uploadthingKey?: string;
  fileSize: number;
  status: string;
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
      if (data.success) {
        setUploads(data.data.uploads);
        setTotal(data.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  // Approve: file is already in UploadThing, just promote it in DB
  const handleApprove = async (upload: PendingUpload) => {
    setProcessing(upload.id);
    setFeedback((prev) => ({ ...prev, [upload.id]: { type: "success", msg: "Approving and publishing..." } }));

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: upload.id,
          decision: "APPROVED",
          // Pass the existing UploadThing URL/key — no re-upload needed
          uploadthingUrl: upload.blobUrl,
          uploadthingKey: upload.uploadthingKey ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback((prev) => ({ ...prev, [upload.id]: { type: "error", msg: data.message || "Approval failed" } }));
      } else {
        setFeedback((prev) => ({ ...prev, [upload.id]: { type: "success", msg: "Approved and published!" } }));
        setTimeout(() => { fetchUploads(); setExpandedId(null); }, 1500);
      }
    } catch (err: any) {
      setFeedback((prev) => ({ ...prev, [upload.id]: { type: "error", msg: err.message || "Approval failed" } }));
    } finally {
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
    try {
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
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <FileText className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and publish student uploads · {total} total
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 w-fit flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
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
                {/* Header row */}
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
                    <span className="text-xs text-muted-foreground">
                      {new Date(upload.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Description
                          </label>
                          <p className="mt-1 text-sm bg-muted/30 rounded-lg p-3 border border-border/40 leading-relaxed">
                            {upload.description}
                          </p>
                        </div>

                        {upload.chapterTopic && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Chapter/Topic:</strong> {upload.chapterTopic}
                          </p>
                        )}

                        {/* Preview link */}
                        <a
                          href={upload.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Eye className="h-4 w-4" />
                          Preview File
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        {/* Feedback */}
                        {feedback[upload.id] && (
                          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
                            feedback[upload.id].type === "success"
                              ? "bg-green-500/10 text-green-600 border-green-500/30"
                              : "bg-red-500/10 text-red-600 border-red-500/30"
                          }`}>
                            {feedback[upload.id].type === "success"
                              ? <CheckCircle className="h-4 w-4 shrink-0" />
                              : <AlertCircle className="h-4 w-4 shrink-0" />
                            }
                            <p>{feedback[upload.id].msg}</p>
                          </div>
                        )}

                        {/* Actions — only for PENDING */}
                        {activeTab === "PENDING" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Rejection Reason <span className="font-normal normal-case">(required if rejecting)</span>
                              </label>
                              <textarea
                                rows={2}
                                value={rejectionReasons[upload.id] || ""}
                                onChange={(e) =>
                                  setRejectionReasons((prev) => ({ ...prev, [upload.id]: e.target.value }))
                                }
                                placeholder="e.g. File is incomplete, duplicate content, poor quality..."
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                disabled={processing === upload.id}
                                onClick={() => handleApprove(upload)}
                              >
                                {processing === upload.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <><CheckCircle className="h-4 w-4 mr-1" /> Approve &amp; Publish</>
                                }
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                disabled={processing === upload.id}
                                onClick={() => handleReject(upload.id)}
                              >
                                {processing === upload.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <><XCircle className="h-4 w-4 mr-1" /> Reject</>
                                }
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