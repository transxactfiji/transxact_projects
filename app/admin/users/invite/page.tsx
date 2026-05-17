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
    <section className="flex flex-col gap-2 min-h-0">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80">
        <span className="inline-flex items-center gap-1">
          <FiArrowLeft /> Back to Users
        </span>
      </Link>

      <div className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <div>
            <h2>Invite New User</h2>
            <p>Send an invitation link to a new user to join the platform</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="mt-0 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-semibold text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-[0.7rem] text-muted-foreground"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border rounded-md bg-accent text-foreground text-sm pl-9 pr-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-semibold text-muted-foreground">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground">
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
          <div className="mt-5 pt-5 border-t">
            <h3 className="font-semibold mb-3">
              Recently Invited Users
            </h3>
            <div className="mt-0 flex flex-col gap-2">
              {invitedUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
                >
                  <div>
                    <p className="font-semibold">{user.email}</p>
                    <p className="text-muted-foreground text-sm">
                      Role: <span className="font-medium">{user.role}</span>
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  >
                    <FiCheckCircle style={{ marginRight: "0.25rem" }} /> Invited
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <h3 className="font-semibold mb-3">
            How it works
          </h3>
          <div className="mt-0 flex flex-col gap-2">
            {[
              "Enter the user's email address and select their role",
              "An invitation email will be sent to them",
              "They will receive a link to join and set up their account",
              "Admin users can manage other users and system settings",
            ].map((step, i) => (
              <p key={i} className="text-muted-foreground text-sm flex gap-1.5">
                <strong className="text-blue-600 dark:text-blue-400">{i + 1}.</strong>
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
