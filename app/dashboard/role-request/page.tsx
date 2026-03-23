"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Shield, ShieldCheck, Users, BookOpen, 
  ChevronRight, Clock, CheckCircle, XCircle, 
  Loader2, AlertCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

// app/dashboard/role-request/page.tsx

const ROLE_INFO = {
  CONTRIBUTOR: {
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    title: "Contributor",
    description: "Upload study resources, notes, PYQs, and syllabi for review.",
    requirements: ["Active student", "Email verified", "Good standing (no bans)"],
  },
  MENTOR: {
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    title: "Mentor",
    description: "Offer 1-on-1 mentorship sessions to students.",
    requirements: ["Expertise in your subject", "Consistent availability", "Commit to at least 2 sessions/month"],
  },
  ADMIN: {
    icon: ShieldCheck,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    title: "Admin",
    description: "Review uploads, manage users, and moderate the platform.",
    requirements: ["Trusted member", "Active for 3+ months", "Approved by OWNER"],
  },
} as const;

type RequestedRole = keyof typeof ROLE_INFO;

type RoleRequest = {
  id: string;
  requestedRole: RequestedRole;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewedBy?: { name: string };
};

export default function RoleRequestPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [selectedRole, setSelectedRole] = useState<RequestedRole | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const currentRoles: string[] = user?.roles ?? ["STUDENT"];

  useEffect(() => {
    fetch("/api/role-requests")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.data.requests); })
      .finally(() => setLoadingRequests(false));
  }, []);

  const pendingFor = (role: string) =>
    requests.some((r) => r.requestedRole === role && r.status === "PENDING");

  const handleSubmit = async () => {
    if (!selectedRole || reason.trim().length < 50) {
      setError("Please write at least 50 characters explaining why you want this role.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/role-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedRole: selectedRole, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccessMsg(`Your request for ${ROLE_INFO[selectedRole].title} has been submitted! Admins will review it shortly.`);
      setReason("");
      setSelectedRole(null);
      // Refresh request list
      const r2 = await fetch("/api/role-requests");
      const d2 = await r2.json();
      if (d2.success) setRequests(d2.data.requests);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Role Upgrade</h1>
        <p className="text-muted-foreground mt-1">
          Request a new role to unlock additional features on VidyaVerse.
        </p>
      </div>

      {/* Current Roles */}
      <div className="glass rounded-xl p-4 border border-border/50 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground mr-2">Your roles:</span>
        {currentRoles.map((role) => (
          <span key={role} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            {role}
          </span>
        ))}
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600">
          <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}

      {/* Role selector */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold font-[var(--font-crimson)]">Select Role to Request</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(ROLE_INFO) as RequestedRole[]).map((role) => {
            const info = ROLE_INFO[role];
            const Icon = info.icon;
            const alreadyHas = currentRoles.includes(role);
            const hasPending = pendingFor(role);
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                disabled={alreadyHas || hasPending}
                onClick={() => { setSelectedRole(role); setError(""); setSuccessMsg(""); }}
                className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                  alreadyHas || hasPending
                    ? "opacity-50 cursor-not-allowed border-border/30 bg-muted/30"
                    : isSelected
                    ? `${info.bg} ${info.border} border-2`
                    : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className={`inline-flex p-2 rounded-lg ${info.bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div className="font-semibold text-sm">{info.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.description}</div>
                {alreadyHas && <span className="text-xs text-green-500 mt-2 block">✓ Already have this</span>}
                {hasPending && <span className="text-xs text-orange-500 mt-2 block">⏳ Request pending</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected role details + form */}
      {selectedRole && !currentRoles.includes(selectedRole) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-border/50 space-y-5"
        >
          <div>
            <h3 className="font-semibold">Requirements for {ROLE_INFO[selectedRole].title}</h3>
            <ul className="mt-2 space-y-1">
              {ROLE_INFO[selectedRole].requirements.map((req) => (
                <li key={req} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-3 w-3 text-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Why do you want this role?{" "}
              <span className="text-muted-foreground font-normal">(min 50 characters)</span>
            </label>
            <textarea
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your background, how you plan to use this role, and why you'd be a good fit..."
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none text-sm"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">{reason.length} / 1000</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || reason.length < 50}
            className="w-full"
          >
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : `Submit Request for ${ROLE_INFO[selectedRole].title}`}
          </Button>
        </motion.div>
      )}

      {/* Request history */}
      <div>
        <h2 className="text-lg font-semibold font-[var(--font-crimson)] mb-4">Request History</h2>
        {loadingRequests ? (
          <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm glass rounded-xl border border-border/50">
            No role requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="glass rounded-xl p-4 border border-border/50 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{req.requestedRole}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{req.reason}</p>
                  {req.rejectionReason && (
                    <p className="text-xs text-destructive mt-1">Reason: {req.rejectionReason}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(req.requestedAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: any }> = {
    PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: Clock },
    APPROVED: { label: "Approved", className: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle },
    REJECTED: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle },
  };
  const { label, className, icon: Icon } = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}