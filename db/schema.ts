import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type UserStatus = "active" | "inactive" | "pending";
export const user = sqliteTable("user", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  code: text(),
  jwt: text(),
  status: text().notNull().$type<UserStatus>(),
  lastLoginAt: text(),
  createdAt: text().notNull(),
  updatedAt: text(),
});

export const project = sqliteTable("project", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text(),
});

export type PhaseStatus = "not_started" | "in_progress" | "completed";
export const phase = sqliteTable("phase", {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int().notNull(),
  name: text().notNull(),
  description: text(),
  status: text().notNull().$type<PhaseStatus>(),
  createdAt: text().notNull(),
  updatedAt: text(),
});

export type TaskStatus = "not_started" | "in_progress" | "completed";
export const task = sqliteTable("task", {
  id: int().primaryKey({ autoIncrement: true }),
  phaseId: int().notNull(),
  title: text().notNull(),
  description: text(),
  status: text().notNull().$type<TaskStatus>(),
  createdAt: text().notNull(),
  updatedAt: text(),
});

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export const issue = sqliteTable("issue", {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int().notNull(),
  title: text().notNull(),
  description: text(),
  status: text().notNull().$type<IssueStatus>(),
  createdAt: text().notNull(),
  updatedAt: text(),
});
