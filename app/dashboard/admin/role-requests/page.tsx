"use client";
// app/dashboard/admin/role-requests/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle, XCircle, Clock,
  ChevronDown, User, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RoleRequest = {
  id: string;
  requestedRole: string;
  reason: string;
  status: string;
  requestedAt: string;
  user: { id: string; name: string; email: string; roles: string[]; profilePicture?: string; createdAt: string };
  reviewedBy?: { name: string };
};

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"] as const;

export default function AdminRoleRequestsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>("PENDING");
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "success" | "error"; msg: string } | null>(null);

  // Guard: only admins/owners
  useEffect(() => {
    if (session && !user?.roles?.some((r: string) => r === "ADMIN" || r === "OWNER")) {
      router.push("/dashboard");
    }
  }, [session, user, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/role-requests?status=${activeTab}`);
      const data = await res.json();
      if (data.success) { setRequests(data.data.requests); setTotal(data.data.total); }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleDecision = async (requestId: string, decision: "APPROVED" | "REJECTED") => {
    const rejectionReason = rejectionReasons[requestId];
    if (decision === "REJECTED" && !rejectionReason?.trim()) {
      setFeedback({ id: requestId, type: "error", msg: "Please provide a rejection reason." });
      return;
    }
    setProcessing(requestId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/role-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ id: requestId, type: "error", msg: data.message });
      } else {
        setFeedback({ id: requestId, type: "success", msg: `Request ${decision.toLowerCase()} successfully.` });
        setTimeout(() => { fetchRequests(); setExpandedId(null); }, 1200);
      }
    } catch {
      setFeedback({ id: requestId, type: "error", msg: "Request failed. Try again." });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Shield className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Role Requests</h1>
          <p className="text-sm text-muted-foreground">Review and action role upgrade requests</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-border/50">
          <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <motion.div key={req.id} layout className="glass rounded-xl border border-border/50 overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    {req.user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{req.user.name || req.user.email}</span>
                      <span className="text-xs text-muted-foreground">{req.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Requesting: {req.requestedRole}
                      </span>
                      {req.user.roles.map((r: string) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.requestedAt).toLocaleDateString("en-IN")}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                        {/* Reason */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</label>
                          <p className="mt-1 text-sm bg-muted/30 rounded-lg p-3 border border-border/40 leading-relaxed">
                            {req.reason}
                          </p>
                        </div>

                        {/* User info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                            <p className="text-xs text-muted-foreground">Member since</p>
                            <p className="font-medium">{new Date(req.user.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                            <p className="text-xs text-muted-foreground">Current roles</p>
                            <p className="font-medium">{req.user.roles.join(", ")}</p>
                          </div>
                        </div>

                        {/* Feedback message */}
                        {feedback?.id === req.id && (
                          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                            feedback.type === "success"
                              ? "bg-green-500/10 text-green-600 border border-green-500/30"
                              : "bg-red-500/10 text-red-600 border border-red-500/30"
                          }`}>
                            {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {feedback.msg}
                          </div>
                        )}

                        {/* Actions — only show for PENDING */}
                        {activeTab === "PENDING" && (
                          <div className="space-y-3">
                            {/* Rejection reason input */}
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Rejection Reason (required if rejecting)
                              </label>
                              <textarea
                                rows={2}
                                value={rejectionReasons[req.id] || ""}
                                onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                placeholder="e.g. Insufficient contributions yet, please build a history first..."
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm resize-none"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                disabled={processing === req.id}
                                onClick={() => handleDecision(req.id, "APPROVED")}
                              >
                                {processing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Approve</>}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                disabled={processing === req.id}
                                onClick={() => handleDecision(req.id, "REJECTED")}
                              >
                                {processing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Reject</>}
                              </Button>
                            </div>
                          </div>
                        )}

                        {activeTab !== "PENDING" && req.reviewedBy && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed by <strong>{req.reviewedBy.name}</strong>
                          </p>
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