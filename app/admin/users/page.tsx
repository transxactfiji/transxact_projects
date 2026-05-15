"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "sonner";
import AppButton from "@/app/ui/appButton";

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

const statusBadgeMap: Record<string, React.CSSProperties> = {
  active: { background: "var(--success-soft)", color: "var(--success)" },
  inactive: { background: "var(--error-soft)", color: "var(--error)" },
  pending: { background: "var(--info-soft)", color: "var(--info)" },
};

const roleBadgeMap: Record<string, React.CSSProperties> = {
  admin: { background: "var(--brand-soft)", color: "var(--brand)" },
  member: { background: "var(--info-soft)", color: "var(--info)" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "admin" | "member">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "pending">("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  return (
    <section className="workflow-stack">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>User Management</h2>
            <p>Manage system users, roles, and permissions</p>
          </div>
          <div className="card-controls">
            <Link
              href="/admin/users/invite"
              className="app-button is-primary"
            >
              <span className="app-button-content">
                <FiPlus /> Invite User
              </span>
            </Link>
          </div>
        </div>

        <div className="workflow-form">
          <div style={{ position: "relative", flex: 1 }}>
            <FiSearch
              style={{ position: "absolute", left: "0.66rem", top: "0.6rem", color: "var(--text-muted)" }}
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
              className="filter-input"
              style={{ paddingLeft: "2.2rem", width: "100%" }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as "" | "admin" | "member");
              setPage(1);
            }}
            className="filter-input"
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
            className="filter-input"
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

        <div className="pagination-info">
          <span>Showing <strong>{users.length}</strong> of <strong>{total}</strong> users</span>
        </div>
      </div>

      {loading ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div className="loading-spinner"></div>
          <p className="empty-row">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p className="empty-row">No users found</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ maxHeight: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Login</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="workflow-title">{user.name || "\u2014"}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className="workflow-status-pill"
                        style={{ ...roleBadgeMap[user.role], border: "none" }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className="workflow-status-pill"
                        style={{ ...statusBadgeMap[user.status], border: "none" }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td>
                      <div className="button-row">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-link"
                          title="Edit user"
                        >
                          <span className="icon-with-label">
                            <FiEdit2 /> Edit
                          </span>
                        </Link>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-link"
                          style={{ color: "var(--error)" }}
                          title="Delete user"
                        >
                          <span className="icon-with-label">
                            <FiTrash2 /> Delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="button-row">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="app-button is-ghost"
                title="Previous page"
              >
                <span className="app-button-content">
                  <FiChevronLeft />
                </span>
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="app-button is-ghost"
                title="Next page"
              >
                <span className="app-button-content">
                  <FiChevronRight />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
