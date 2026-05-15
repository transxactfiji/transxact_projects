"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiMail, FiUserPlus, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import AppButton from "@/app/ui/appButton";

export default function InviteUserPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [invitedUsers, setInvitedUsers] = useState<
    Array<{ email: string; role: string; createdAt: string }>
  >([]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite user");
      }

      const newUser = await response.json();
      setInvitedUsers([
        ...invitedUsers,
        { email: newUser.email, role: newUser.role, createdAt: newUser.createdAt },
      ]);

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setRole("member");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="workflow-stack">
      <Link href="/admin/users" className="text-link">
        <span className="icon-with-label">
          <FiArrowLeft /> Back to Users
        </span>
      </Link>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Invite New User</h2>
            <p>Send an invitation link to a new user to join the platform</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="form-stack" style={{ marginTop: 0 }}>
          <div className="field-wrap">
            <label htmlFor="email" className="field-label">
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <FiMail
                style={{ position: "absolute", left: "0.72rem", top: "0.7rem", color: "var(--text-muted)" }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="text-input"
                style={{ paddingLeft: "2.2rem" }}
                required
              />
            </div>
          </div>

          <div className="field-wrap">
            <label htmlFor="role" className="field-label">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="filter-input"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="field-note">
              {role === "admin"
                ? "Admins can manage users and system settings"
                : "Members have basic access to projects and tasks"}
            </p>
          </div>

          <AppButton
            type="submit"
            fullWidth
            disabled={loading}
            isLoading={loading}
            loadingLabel="Sending..."
            startIcon={<FiUserPlus />}
          >
            Send Invitation
          </AppButton>
        </form>

        {invitedUsers.length > 0 && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
              Recently Invited Users
            </h3>
            <div className="form-stack" style={{ marginTop: 0 }}>
              {invitedUsers.map((user, index) => (
                <div
                  key={index}
                  className="inline-status is-success"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div>
                    <p style={{ fontWeight: 600 }}>{user.email}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                      Role: <span style={{ fontWeight: 500 }}>{user.role}</span>
                    </p>
                  </div>
                  <span
                    className="workflow-status-pill"
                    style={{
                      background: "color-mix(in srgb, var(--success) 20%, transparent)",
                      color: "var(--success)",
                      border: "none",
                      fontWeight: 700,
                    }}
                  >
                    <FiCheckCircle style={{ marginRight: "0.25rem" }} /> Invited
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="inline-status is-info">
          <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
            How it works
          </h3>
          <div className="form-stack" style={{ marginTop: 0, gap: "0.5rem" }}>
            {[
              "Enter the user's email address and select their role",
              "An invitation email will be sent to them",
              "They will receive a link to join and set up their account",
              "Admin users can manage other users and system settings",
            ].map((step, i) => (
              <p key={i} style={{ color: "var(--text-secondary)", fontSize: "0.88rem", display: "flex", gap: "0.4rem" }}>
                <strong style={{ color: "var(--info)" }}>{i + 1}.</strong>
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
