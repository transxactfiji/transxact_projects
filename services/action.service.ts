"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import db, { ensureDbSchema } from "@/db/connection";
import { action, user } from "@/db/schema";
import { requireSessionUser } from "./session.service";

const MIN_ACTION_NAME_LENGTH = 2;

export interface ActionItem {
  id: number;
  name: string;
  description: string | null;
  createdByUserId: number;
  authorLabel: string;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export async function listActionsByTask(taskId: number): Promise<ActionItem[]> {
  const currentUser = await requireSessionUser();
  await ensureDbSchema();

  const rows = await db
    .select({
      id: action.id,
      name: action.name,
      description: action.description,
      createdByUserId: action.createdByUserId,
      authorName: user.name,
      authorEmail: user.email,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    })
    .from(action)
    .innerJoin(user, eq(action.createdByUserId, user.id))
    .where(and(eq(action.taskId, taskId), isNull(action.deletedAt)))
    .orderBy(asc(action.createdAt), asc(action.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdByUserId: row.createdByUserId,
    authorLabel: row.authorName?.trim() || row.authorEmail,
    isOwn: row.createdByUserId === currentUser.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function createTaskAction(
  taskId: number,
  projectId: number,
  name: string,
  description?: string,
): Promise<void> {
  const currentUser = await requireSessionUser();
  await ensureDbSchema();

  const normalizedName = name.trim().replace(/\s+/g, " ");
  if (normalizedName.length < MIN_ACTION_NAME_LENGTH) {
    throw new Error(
      `Action name must be at least ${MIN_ACTION_NAME_LENGTH} characters.`,
    );
  }

  const normalizedDescription = description?.trim() || null;

  const nowIso = new Date().toISOString();
  await db.insert(action).values({
    projectId,
    taskId,
    createdByUserId: currentUser.id,
    name: normalizedName,
    description: normalizedDescription,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteTaskAction(actionId: number): Promise<void> {
  const currentUser = await requireSessionUser();
  await ensureDbSchema();

  const rows = await db
    .select({
      id: action.id,
      createdByUserId: action.createdByUserId,
    })
    .from(action)
    .where(and(eq(action.id, actionId), isNull(action.deletedAt)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Action not found.");
  }

  if (rows[0].createdByUserId !== currentUser.id) {
    throw new Error("You can only delete your own actions.");
  }

  const nowIso = new Date().toISOString();
  await db
    .update(action)
    .set({ deletedAt: nowIso, updatedAt: nowIso })
    .where(eq(action.id, actionId));
}
