"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import AppButton from "@/app/ui/appButton";
import { Loading } from "@/app/ui/loading";
import { statusBadgeClassMap, roleBadgeClassMap } from "@/app/ui/formStatus";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: "admin" | "member";
  status: "active" | "inactive" | "pending";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface AuditLog {
  id: number;
  adminUserId: number;
  targetUserId: number;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: string;
}

interface AuditLogsResult {
  logs: AuditLog[];
  total: number;
}

export function AdminUserDetail({ userId }: { userId: number }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState<"admin" | "member" | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "pending" | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const userData: User = await response.json();
      setUser(userData);
      setNewRole(userData.role);
      setNewStatus(userData.status);

      const logsResponse = await fetch(`/api/admin/users/${userId}/audit-logs?limit=50`, {
        credentials: "include",
      });

      if (logsResponse.ok) {
        const logsData: AuditLogsResult = await logsResponse.json();
        setAuditLogs(logsData.logs);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load user");
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdateRole = async () => {
    if (!user || !newRole || newRole === user.role) {
      toast.error("Select a different role");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      toast.success("User role updated successfully");
      fetchUserData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const handleUpdateStatus = async () => {
    if (!user || !newStatus || newStatus === user.status) {
      toast.error("Select a different status");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      toast.success("User status updated successfully");
      fetchUserData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  if (loading) {
    return <Loading label="Loading user details..." />;
  }

  if (!user) {
    return (
      <section className="flex flex-col gap-2 min-h-0">
        <div className="rounded-lg border bg-card shadow-card text-center py-12 px-4">
          <p className="text-muted-foreground text-center">User not found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80">
        <span className="inline-flex items-center gap-1">
          <FiArrowLeft /> Back to Users
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-5">
        <div className="rounded-lg border bg-card shadow-card p-2.5">
          <div className="flex flex-wrap gap-2 justify-between mb-2">
            <h2>User Information</h2>
          </div>

          <div className="mt-0 flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Name</label>
              <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                {user.name || "\u2014"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                {user.email}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-muted-foreground">Created</label>
                <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-muted-foreground">Last Login</label>
                <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-card p-2.5">
          <div className="flex flex-wrap gap-2 justify-between mb-2">
            <h2>Manage User</h2>
          </div>

          <div className="mt-0 flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Role</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={newRole || ""}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
                  className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary flex-1"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                {newRole !== user.role && (
                  <AppButton
                    variant="primary"
                    onClick={handleUpdateRole}
                    startIcon={<FiSave />}
                  >
                    Save
                  </AppButton>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{user.role}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Status</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={newStatus || ""}
                  onChange={(e) => setNewStatus(e.target.value as "active" | "inactive" | "pending")}
                  className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary flex-1"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                {newStatus !== user.status && (
                  <AppButton
                    variant="primary"
                    onClick={handleUpdateStatus}
                    startIcon={<FiSave />}
                  >
                    Save
                  </AppButton>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{user.status}</strong>
              </p>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center border-none rounded-full text-xs font-semibold px-1.5 py-0.5 ${roleBadgeClassMap[user.role] ?? "bg-accent text-muted-foreground"}`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-flex items-center border-none rounded-full text-xs font-semibold px-1.5 py-0.5 ${statusBadgeClassMap[user.status] ?? "bg-accent text-muted-foreground"}`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <h2>Audit Log</h2>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No audit logs yet
          </p>
        ) : (
          <div className="max-h-[none] overflow-auto border rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Action</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Previous Value</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">New Value</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left capitalize">
                      <strong>{log.action.replace("_", " ")}</strong>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <code className="inline-flex items-center rounded-full bg-accent text-muted-foreground text-xs font-semibold px-1.5 py-0.5">
                        {log.previousValue || "\u2014"}
                      </code>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <code className="inline-flex items-center rounded-full bg-accent text-muted-foreground text-xs font-semibold px-1.5 py-0.5">
                        {log.newValue || "\u2014"}
                      </code>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left text-muted-foreground text-sm font-medium">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
