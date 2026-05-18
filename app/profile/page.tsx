"use client";

import { useState, useEffect, useCallback } from "react";
import { FiMonitor, FiSave, FiUser, FiX } from "react-icons/fi";
import { toast } from "sonner";
import AppButton from "@/app/ui/appButton";
import TextField from "@/app/ui/textField";
import InlineStatus from "@/app/ui/inlineStatus";
import PageHeading from "@/app/ui/pageHeading";
import { FormStatus } from "@/app/ui/formStatus";
import { Loading } from "@/app/ui/loading";
import { formatDateTime } from "@/lib/utils";
import { getProfile, updateProfileName } from "@/services/profile.service";
import type { ProfileUser } from "@/services/profile.service";

interface SessionItem {
  id: number;
  deviceLabel: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isActive: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch {
      // silent
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setName(data.name ?? "");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to load profile";
        setStatus({ tone: "error", message: msg });
        toast.error(msg);
      } finally {
        setLoading(false);
      }
      await fetchSessions();
    })();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: number): Promise<void> => {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to revoke session");
      toast.success("Session revoked");
      fetchSessions();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to revoke session";
      toast.error(msg);
    } finally {
      setRevokingId(null);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setStatus({ tone: "error", message: "Name is required" });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const updated = await updateProfileName(trimmed);
      setProfile(updated);
      setName(updated.name ?? "");
      setStatus({ tone: "success", message: "Profile updated successfully" });
      toast.success("Profile updated");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update profile";
      setStatus({ tone: "error", message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading label="Loading profile..." />;
  }

  if (!profile) {
    return (
      <section className="flex flex-col gap-2 min-h-0">
        <div className="rounded-lg border bg-card shadow-card text-center py-12 px-4">
          <p className="text-muted-foreground text-center">Could not load profile.</p>
        </div>
      </section>
    );
  }

  const hasChanges = name.trim() !== (profile.name ?? "");

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <div className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <PageHeading level={2} icon={<FiUser aria-hidden="true" />}>Profile</PageHeading>
        </div>

        <div className="mt-0 flex flex-col gap-2">
          <TextField
            id="name"
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (status?.tone === "error") setStatus(null);
            }}
            placeholder="Your name"
            disabled={saving}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Email</label>
            <div className="flex items-center px-2.5 py-1.5 border rounded-md bg-accent text-muted-foreground text-sm min-h-8">
              <span>{profile.email}</span>
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Member since</label>
              <div className="flex items-center px-2.5 py-1.5 border rounded-md bg-accent text-muted-foreground text-sm min-h-8">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Last login</label>
              <div className="flex items-center px-2.5 py-1.5 border rounded-md bg-accent text-muted-foreground text-sm min-h-8">
                {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2">
            <span className="inline-flex items-center rounded-full text-xs font-semibold px-1.5 py-0.5 bg-primary/10 text-primary">
              {profile.role}
            </span>
            <span
              className={`inline-flex items-center rounded-full text-xs font-semibold px-1.5 py-0.5 ${profile.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : profile.status === "inactive" ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"}`}
            >
              {profile.status}
            </span>
          </div>

          <InlineStatus tone={status?.tone ?? "info"} message={status?.message ?? null} />

          <AppButton
            onClick={handleSave}
            isLoading={saving}
            loadingLabel="Saving..."
            disabled={!hasChanges}
            startIcon={<FiSave aria-hidden="true" />}
          >
            Save changes
          </AppButton>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <PageHeading level={2} icon={<FiMonitor aria-hidden="true" />}>Sessions</PageHeading>
        </div>

        <div className="max-h-64 overflow-auto border rounded-md">
          {sessionsLoading ? (
            <p className="text-muted-foreground text-center p-4">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">No active sessions.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Device</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Last used</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Created</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Status</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left font-medium">
                      <span className="inline-flex items-center gap-1">
                        <FiMonitor size={14} />
                        <span>{s.deviceLabel}</span>
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left text-muted-foreground">{formatDateTime(s.lastUsedAt)}</td>
                    <td className="border-b px-2 py-1.5 text-left text-muted-foreground">{formatDateTime(s.createdAt)}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <span
                        className={`inline-flex items-center rounded-full text-xs font-semibold px-1.5 py-0.5 ${s.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}
                      >
                        {s.isActive ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      {s.isActive && (
                        <AppButton
                          variant="ghost"
                          onClick={() => void handleRevokeSession(s.id)}
                          disabled={revokingId === s.id}
                          isLoading={revokingId === s.id}
                          loadingLabel="Revoking..."
                        >
                          <FiX size={14} />
                        </AppButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
