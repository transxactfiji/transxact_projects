-- Migration notes:
-- 1. This migration introduces direct messaging, notification center, subscription, and delivery tracking tables.
-- 2. Rollback strategy: restore from pre-migration backup.
-- 3. Backfill: none required; defaults apply to new records only.

CREATE TABLE `direct_conversation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdByUserId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `direct_message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`senderUserId` integer NOT NULL,
	`body` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`editedAt` text,
	`deletedAt` text,
	FOREIGN KEY (`conversationId`) REFERENCES `direct_conversation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `direct_conversation_member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`userId` integer NOT NULL,
	`joinedAt` text NOT NULL,
	`updatedAt` text,
	`archivedAt` text,
	`lastReadMessageId` integer,
	`lastReadAt` text,
	FOREIGN KEY (`conversationId`) REFERENCES `direct_conversation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lastReadMessageId`) REFERENCES `direct_message`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_conversation_member_unique` ON `direct_conversation_member` (`conversationId`,`userId`);--> statement-breakpoint
CREATE INDEX `direct_conversation_member_user_idx` ON `direct_conversation_member` (`userId`,`archivedAt`);--> statement-breakpoint
CREATE INDEX `direct_message_conversation_idx` ON `direct_message` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `user_block` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blockerUserId` integer NOT NULL,
	`blockedUserId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`blockerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`blockedUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_block_unique` ON `user_block` (`blockerUserId`,`blockedUserId`);--> statement-breakpoint
CREATE INDEX `user_block_target_idx` ON `user_block` (`blockedUserId`);--> statement-breakpoint
CREATE TABLE `direct_message_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporterUserId` integer NOT NULL,
	`conversationId` integer NOT NULL,
	`messageId` integer,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reviewedByUserId` integer,
	`reviewedAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`reporterUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversationId`) REFERENCES `direct_conversation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `direct_message`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedByUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `direct_message_report_status_idx` ON `direct_message_report` (`status`,`createdAt`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`actorUserId` integer,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`href` text NOT NULL,
	`sourceType` text NOT NULL,
	`sourceId` integer,
	`inAppVisible` integer DEFAULT 1 NOT NULL,
	`isRead` integer DEFAULT 0 NOT NULL,
	`readAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notification_user_unread_idx` ON `notification` (`userId`,`inAppVisible`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE TABLE `notification_preference` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`category` text NOT NULL,
	`inAppEnabled` integer DEFAULT 1 NOT NULL,
	`emailEnabled` integer DEFAULT 1 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preference_unique` ON `notification_preference` (`userId`,`category`);--> statement-breakpoint
CREATE TABLE `entity_subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`entityType` text NOT NULL,
	`entityId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_subscription_unique` ON `entity_subscription` (`userId`,`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `entity_subscription_entity_idx` ON `entity_subscription` (`entityType`,`entityId`);--> statement-breakpoint
CREATE TABLE `notification_delivery_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notificationId` integer,
	`userId` integer NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`metadata` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notification_delivery_log_notification_idx` ON `notification_delivery_log` (`notificationId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `notification_email_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notificationId` integer NOT NULL,
	`userId` integer NOT NULL,
	`toEmail` text NOT NULL,
	`subject` text NOT NULL,
	`textBody` text NOT NULL,
	`htmlBody` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`sendAfterAt` text NOT NULL,
	`sentAt` text,
	`lastError` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notification_email_queue_status_idx` ON `notification_email_queue` (`status`,`sendAfterAt`);
