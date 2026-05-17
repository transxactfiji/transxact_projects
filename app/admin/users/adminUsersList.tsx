"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiUserPlus,
  FiSave,
} from "react-icons/fi";
import { toast } from "sonner";
import AppButton from "@/app/ui/appButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import InlineStatus from "@/app/ui/inlineStatus";
import { Spinner } from "@/app/ui/loading";
import Modal from "@/app/ui/modal";
import { statusBadgeClassMap, roleBadgeClassMap } from "@/app/ui/formStatus";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: "admin" | "member";
  status: "active" | "inactive" | "pending";
  lastLoginAt: string | null;
  createdAt: string;
}

interface ListResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "admin" | "member">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "pending">("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "member">("member");
  const [editStatus, setEditStatus] = useState<"active" | "inactive" | "pending">("active");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setIsEditModalOpen(true);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: ListResult = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users/export/csv?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Users exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export users");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteStatus({ tone: "error", message: "Email is required" });
      return;
    }

    try {
      setIsInviting(true);
      setInviteStatus(null);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite user");
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
      setIsInviteModalOpen(false);
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to invite user";
      setInviteStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    if (editRole === editingUser.role && editStatus === editingUser.status) {
      toast.error("No changes made");
      return;
    }

    try {
      setIsSavingEdit(true);
      const body: Record<string, string> = {};
      if (editRole !== editingUser.role) body.role = editRole;
      if (editStatus !== editingUser.status) body.status = editStatus;

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <div className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <div>
            <h2>User Management</h2>
            <p>Manage system users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-1.5">
            <AppButton
              variant="primary"
              onClick={() => {
                setInviteEmail("");
                setInviteRole("member");
                setInviteStatus(null);
                setIsInviteModalOpen(true);
              }}
              startIcon={<FiPlus />}
            >
              Invite User
            </AppButton>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-2.5 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-40 border rounded-md bg-accent text-foreground text-sm pl-9 pr-2 py-1.5 transition-colors focus:border-primary w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as "" | "admin" | "member");
              setPage(1);
            }}
            className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | "active" | "inactive" | "pending");
              setPage(1);
            }}
            className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <AppButton
            variant="secondary"
            onClick={handleExportCSV}
            startIcon={<FiDownload />}
          >
            Export CSV
          </AppButton>
        </div>

        <div className="text-muted-foreground text-sm">
          <span>Showing <strong>{users.length}</strong> of <strong>{total}</strong> users</span>
        </div>
      </div>

      {loading ? (
          <div className="rounded-lg border bg-card shadow-card text-center py-12 px-4">
            <div className="mb-3">
              <Spinner />
            </div>
          <p className="text-muted-foreground text-center">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border bg-card shadow-card text-center py-12 px-4">
          <p className="text-muted-foreground text-center">No users found</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card shadow-card p-0">
          <div className="max-h-[none] overflow-auto border rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Name</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Email</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Role</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Status</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Last Login</th>
                  <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left font-semibold">{user.name || "\u2014"}</td>
                    <td className="border-b px-2 py-1.5 text-left">{user.email}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <span
                        className={`inline-flex items-center border-none rounded-full text-xs font-semibold px-1.5 py-0.5 ${roleBadgeClassMap[user.role] ?? "bg-accent text-muted-foreground"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <span
                        className={`inline-flex items-center border-none rounded-full text-xs font-semibold px-1.5 py-0.5 ${statusBadgeClassMap[user.status] ?? "bg-accent text-muted-foreground"}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center gap-1 border-0 bg-transparent text-primary cursor-pointer text-sm font-semibold p-0 transition-colors hover:text-primary/80"
                            >
                              <span className="inline-flex items-center gap-1">
                                <FiEdit2 /> Edit
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit user</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="inline-flex items-center gap-1 border-0 bg-transparent text-destructive cursor-pointer text-sm font-semibold p-0 transition-colors hover:text-destructive/80"
                            >
                              <span className="inline-flex items-center gap-1">
                                <FiTrash2 /> Delete
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete user</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t bg-accent px-2 py-1.5">
            <span className="text-muted-foreground text-sm">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <AppButton
                variant="ghost"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <FiChevronLeft />
              </AppButton>
              <AppButton
                variant="ghost"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <FiChevronRight />
              </AppButton>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteStatus(null);
        }}
        title="Invite New User"
      >
        <div className="mt-0 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="invite-email" className="text-sm font-semibold text-muted-foreground">Email Address</label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-[0.7rem] text-muted-foreground"
              />
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border rounded-md bg-accent text-foreground text-sm pl-9 pr-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="invite-role" className="text-sm font-semibold text-muted-foreground">Role</label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
              className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {inviteRole === "admin"
                ? "Admins can manage users and system settings"
                : "Members have basic access to projects and tasks"}
            </p>
          </div>

          <AppButton
            onClick={handleInvite}
            fullWidth
            disabled={isInviting}
            isLoading={isInviting}
            loadingLabel="Sending..."
            startIcon={<FiUserPlus />}
          >
            Send Invitation
          </AppButton>

          <InlineStatus
            tone={inviteStatus?.tone ?? "info"}
            message={inviteStatus?.message ?? null}
          />
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? `Edit ${editingUser.name || editingUser.email}` : "Edit User"}
      >
        {editingUser && (
          <div className="mt-0 flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Name</label>
              <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                {editingUser.name || "\u2014"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <p className="w-full border rounded-md bg-muted text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground cursor-default">
                {editingUser.email}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edit-role" className="text-sm font-semibold text-muted-foreground">Role</label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as "admin" | "member")}
                className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{editingUser.role}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edit-status" className="text-sm font-semibold text-muted-foreground">Status</label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "active" | "inactive" | "pending")}
                className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{editingUser.status}</strong>
              </p>
            </div>

            <AppButton
              onClick={handleEditSave}
              fullWidth
              disabled={isSavingEdit || (editRole === editingUser.role && editStatus === editingUser.status)}
              isLoading={isSavingEdit}
              loadingLabel="Saving..."
              startIcon={<FiSave />}
            >
              Save Changes
            </AppButton>
          </div>
        )}
      </Modal>
    </section>
  );
}
