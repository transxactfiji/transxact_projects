"use server";

import db, { ensureDbSchema } from "@/db/connection";
import {
  user,
  auditLog,
  type AuditLogAction,
  type UserRole,
  type UserStatus,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail, createUnifiedEmailContent } from "./email.service";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface UserListFilters extends PaginationParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface UserListResult {
  users: (typeof user.$inferSelect)[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuditLogEntry {
  id: number;
  adminUserId: number;
  targetUserId: number;
  action: AuditLogAction;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: string;
}

async function logAuditAction(
  adminUserId: number,
  targetUserId: number,
  action: AuditLogAction,
  previousValue?: string,
  newValue?: string,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  await db.insert(auditLog).values({
    adminUserId,
    targetUserId,
    action,
    previousValue: previousValue || null,
    newValue: newValue || null,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

export async function listUsers(
  filters: UserListFilters,
): Promise<UserListResult> {
  await ensureDbSchema();

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: Array<ReturnType<typeof sql>> = [];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      sql`(${user.name} LIKE ${searchTerm} OR ${user.email} LIKE ${searchTerm})`,
    );
  }

  if (filters.role) {
    conditions.push(eq(user.role, filters.role));
  }

  if (filters.status) {
    conditions.push(eq(user.status, filters.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, countResult] = await Promise.all([
    db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getUserById(
  userId: number,
): Promise<typeof user.$inferSelect | null> {
  await ensureDbSchema();

  const result = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0] || null;
}

export async function updateUserRole(
  adminUserId: number,
  targetUserId: number,
  newRole: UserRole,
): Promise<typeof user.$inferSelect> {
  await ensureDbSchema();

  if (adminUserId === targetUserId) {
    throw new Error("You cannot change your own role");
  }

  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  const oldRole = targetUser.role;
  const now = new Date().toISOString();

  await db
    .update(user)
    .set({
      role: newRole,
      updatedAt: now,
    })
    .where(eq(user.id, targetUserId));

  await logAuditAction(
    adminUserId,
    targetUserId,
    "role_changed",
    oldRole,
    newRole,
    { changedBy: adminUserId },
  );

  const updatedUser = await getUserById(targetUserId);
  if (!updatedUser) throw new Error("Failed to fetch updated user");

  // Send notification email
  await sendRoleChangeEmail(
    updatedUser.email,
    updatedUser.name || "User",
    oldRole,
    newRole,
  );

  return updatedUser;
}

export async function updateUserStatus(
  adminUserId: number,
  targetUserId: number,
  newStatus: UserStatus,
): Promise<typeof user.$inferSelect> {
  await ensureDbSchema();

  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  const oldStatus = targetUser.status;
  const now = new Date().toISOString();

  await db
    .update(user)
    .set({
      status: newStatus,
      updatedAt: now,
    })
    .where(eq(user.id, targetUserId));

  await logAuditAction(
    adminUserId,
    targetUserId,
    "status_changed",
    oldStatus,
    newStatus,
    { changedBy: adminUserId },
  );

  const updatedUser = await getUserById(targetUserId);
  if (!updatedUser) throw new Error("Failed to fetch updated user");

  // Send notification email
  await sendStatusChangeEmail(
    updatedUser.email,
    updatedUser.name || "User",
    oldStatus,
    newStatus,
  );

  return updatedUser;
}

export async function deleteUser(
  adminUserId: number,
  targetUserId: number,
): Promise<void> {
  await ensureDbSchema();

  if (adminUserId === targetUserId) {
    throw new Error("You cannot delete your own account");
  }

  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  // Soft delete by marking as inactive and clearing sensitive data
  const now = new Date().toISOString();
  await db
    .update(user)
    .set({
      status: "inactive",
      name: null,
      code: null,
      jwt: null,
      updatedAt: now,
    })
    .where(eq(user.id, targetUserId));

  await logAuditAction(
    adminUserId,
    targetUserId,
    "deleted",
    JSON.stringify({ email: targetUser.email, role: targetUser.role }),
    "inactive",
    { deletedEmail: targetUser.email },
  );
}

export async function getAuditLogs(
  targetUserId: number,
  filters?: PaginationParams,
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  await ensureDbSchema();

  const page = Math.max(1, filters?.page || 1);
  const limit = Math.min(100, Math.max(1, filters?.limit || 20));
  const offset = (page - 1) * limit;

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(eq(auditLog.targetUserId, targetUserId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(auditLog)
      .where(eq(auditLog.targetUserId, targetUserId)),
  ]);

  const total = countResult[0]?.count || 0;

  return { logs, total };
}

export async function exportUsersToCSV(
  filters?: Omit<UserListFilters, "page" | "limit">,
): Promise<string> {
  await ensureDbSchema();

  const result = await listUsers({ ...filters, page: 1, limit: 10000 });
  const users = result.users;

  const headers = [
    "ID",
    "Name",
    "Email",
    "Role",
    "Status",
    "Created At",
    "Last Login",
  ];
  const rows = users.map((u) => [
    u.id,
    u.name || "",
    u.email,
    u.role,
    u.status,
    u.createdAt,
    u.lastLoginAt || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const stringCell = String(cell || "");
          return stringCell.includes(",") || stringCell.includes('"')
            ? `"${stringCell.replace(/"/g, '""')}"`
            : stringCell;
        })
        .join(","),
    ),
  ].join("\n");

  return csvContent;
}

// Email notification helpers
async function sendRoleChangeEmail(
  email: string,
  userName: string,
  oldRole: string,
  newRole: string,
): Promise<void> {
  const content = createUnifiedEmailContent({
    headline: "Role update",
    messageLines: [
      `Hello ${userName},`,
      `Your role in Transxact has been changed from ${oldRole} to ${newRole}.`,
      "If you did not expect this change, please contact an administrator.",
    ],
    previewText: `Your Transxact role has been updated to ${newRole}`,
  });

  await sendEmail({
    to: email,
    subject: "Role Update Notification",
    text: content.text,
    html: content.html,
  });
}

async function sendStatusChangeEmail(
  email: string,
  userName: string,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  const isActive = newStatus === "active";
  const content = createUnifiedEmailContent({
    headline: isActive ? "Account activated" : "Account deactivated",
    messageLines: isActive
      ? [
          `Hello ${userName},`,
          "Your Transxact account has been activated. You can now sign in and use the workspace.",
        ]
      : [
          `Hello ${userName},`,
          "Your Transxact account has been deactivated. You will not be able to sign in until an admin reactivates your account.",
        ],
    footerLines: [
      "If you did not expect this change, please contact an administrator.",
    ],
    previewText: `Your Transxact account has been ${newStatus}`,
  });

  await sendEmail({
    to: email,
    subject: "Account Status Update",
    text: content.text,
    html: content.html,
  });
}


