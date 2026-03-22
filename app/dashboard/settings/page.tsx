"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  User,
  Lock,
  Bell,
  Settings as SettingsIcon,
  Mail,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Mail },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: SettingsIcon },
];

const departments = [
  "COMPUTER", "PHYSICS", "CHEMISTRY", "MATHEMATICS",
  "ELECTRONICS", "BOTANY", "ZOOLOGY", "BIOLOGY", "ENGLISH",
];

interface College { id: string; name: string; city: string; state: string }

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [colleges, setColleges] = useState<College[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    semester: "",
    department: "",
    collegeId: "",
    profilePicture: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, collegesRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/colleges"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          const p = data.data?.profile;
          setProfileData(p);
          setProfileForm({
            name: p?.name || "",
            bio: p?.bio || "",
            semester: p?.semester?.toString() || "",
            department: p?.department || "",
            collegeId: p?.collegeId || "",
            profilePicture: p?.profilePicture || "",
          });
        }

        if (collegesRes.ok) {
          const data = await collegesRes.json();
          setColleges(data.data?.colleges || []);
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          bio: profileForm.bio || null,
          semester: profileForm.semester ? parseInt(profileForm.semester) : null,
          department: profileForm.department || null,
          collegeId: profileForm.collegeId || null,
          profilePicture: profileForm.profilePicture || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showMessage("success", "Profile updated successfully!");
        // Refresh profile data
        const refreshRes = await fetch("/api/user/profile");
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setProfileData(refreshData.data?.profile);
        }
      } else {
        showMessage("error", data.message || "Update failed");
      }
    } catch {
      showMessage("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showMessage("success", "Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showMessage("error", data.message || "Password change failed");
      }
    } catch {
      showMessage("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-crimson)]">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/40 text-green-600 dark:text-green-400"
              : "bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Tab nav */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl border border-border/60 p-2 space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left text-sm ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl border border-border/60 p-6">

            {/* Profile tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold font-[var(--font-crimson)]">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">Update your personal and academic details</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData?.email || session?.user?.email || ""}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed text-sm"
                      />
                      {profileData?.emailVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-500 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {profileForm.bio.length}/500
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">
                      <Building2 className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      College
                    </label>
                    <select
                      value={profileForm.collegeId}
                      onChange={(e) => setProfileForm({ ...profileForm, collegeId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                    >
                      <option value="">Select your college</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.city}, {c.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Semester</label>
                    <select
                      value={profileForm.semester}
                      onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                    >
                      <option value="">Select semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Department</label>
                    <select
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Profile Picture URL (optional)</label>
                    <input
                      type="url"
                      value={profileForm.profilePicture}
                      onChange={(e) => setProfileForm({ ...profileForm, profilePicture: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">Roles</label>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData?.roles?.map((role: string) => (
                        <span key={role} className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Contact admin to request role changes</p>
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}

            {/* Account tab */}
            {activeTab === "account" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold font-[var(--font-crimson)]">Account</h2>
                  <p className="text-sm text-muted-foreground">Your account details and status</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: "Email Verification",
                      desc: profileData?.emailVerified ? "Your email is verified" : "Verify your email to unlock all features",
                      ok: profileData?.emailVerified,
                      action: !profileData?.emailVerified ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs">Resend Email</Button>
                      ) : null,
                    },
                    {
                      label: "Account Status",
                      desc: profileData?.isActive ? "Your account is active" : "Account suspended",
                      ok: profileData?.isActive,
                    },
                    {
                      label: "Upload Permission",
                      desc: profileData?.canUpload ? "You can upload resources" : "Upload permission revoked",
                      ok: profileData?.canUpload,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-3">
                        {item.ok ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Shield className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      {item.action}
                    </div>
                  ))}

                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Account ID</p>
                    <p className="text-sm font-mono">{profileData?.id}</p>
                  </div>

                  {profileData?.warningCount > 0 && (
                    <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                      <p className="text-sm">
                        You have <strong>{profileData.warningCount}</strong> warning{profileData.warningCount !== 1 ? "s" : ""} on your account
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold font-[var(--font-crimson)]">Security</h2>
                  <p className="text-sm text-muted-foreground">Change your password</p>
                </div>

                {["currentPassword", "newPassword", "confirmPassword"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1.5 capitalize">
                      {field.replace(/([A-Z])/g, " $1").trim()} *
                    </label>
                    <input
                      type="password"
                      value={passwordForm[field as keyof typeof passwordForm]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      required
                      minLength={field !== "currentPassword" ? 8 : undefined}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm"
                      placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                    />
                  </div>
                ))}

                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {saving ? "Changing..." : "Change Password"}
                </Button>
              </form>
            )}

            {/* Notifications tab */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold font-[var(--font-crimson)]">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Email Notifications", desc: "Receive updates via email", default: true },
                    { label: "Push Notifications", desc: "Get browser notifications", default: false },
                    { label: "Marketing Emails", desc: "Receive promotional content", default: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked={item.default} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences tab */}
            {activeTab === "preferences" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold font-[var(--font-crimson)]">Preferences</h2>
                  <p className="text-sm text-muted-foreground">Customize your experience</p>
                </div>
                <div className="text-center py-12 text-muted-foreground">
                  <SettingsIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}