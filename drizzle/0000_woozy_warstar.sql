-- Migration notes:
-- 1. This baseline migration targets a clean database.
-- 2. For existing databases, take a full backup before applying schema updates.
-- 3. Rollback strategy: restore the pre-migration backup.
-- 4. Backfill expectation for existing data:
--    - user.role defaults to 'member'
--    - user.status defaults to 'pending'
--    - user.codeAttemptCount defaults to 0

CREATE TABLE `audit_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actorUserId` integer,
	`entityType` text NOT NULL,
	`entityId` integer,
	`action` text NOT NULL,
	`metadata` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invite` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`invitedByUserId` integer NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`acceptedAt` text,
	`revokedAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`invitedByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_token_unique` ON `invite` (`token`);--> statement-breakpoint
CREATE TABLE `issue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`taskId` integer,
	`assigneeUserId` integer,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`createdByUserId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `phase` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`createdByUserId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdByUserId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phaseId` integer NOT NULL,
	`assigneeUserId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`dueAt` text NOT NULL,
	`createdByUserId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`phaseId`) REFERENCES `phase`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`code` text,
	`codeExpiresAt` text,
	`codeAttemptCount` integer DEFAULT 0 NOT NULL,
	`codeLastRequestedAt` text,
	`jwt` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`invitedByUserId` integer,
	`invitationAcceptedAt` text,
	`firstLoginCompletedAt` text,
	`lastLoginAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `work_item_attachment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer,
	`issueId` integer,
	`uploadedByUserId` integer NOT NULL,
	`fileName` text NOT NULL,
	`mimeType` text NOT NULL,
	`sizeBytes` integer NOT NULL,
	`storagePath` text NOT NULL,
	`createdAt` text NOT NULL,
	`deletedAt` text,
	FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issueId`) REFERENCES `issue`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploadedByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_item_comment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer,
	`issueId` integer,
	`createdByUserId` integer NOT NULL,
	`body` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issueId`) REFERENCES `issue`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
