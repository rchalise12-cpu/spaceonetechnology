CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_target` ON `audit_log` (`target_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_application` ON `comments` (`application_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`total` integer NOT NULL,
	`published` integer NOT NULL,
	`held` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`interest` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inquiry_status` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` text,
	`accepted_by` text,
	`revoked_at` text,
	`delivery_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accepted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invite_role" CHECK("invitations"."role" IN ('staff','client'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_token` ON `invitations` (`token_hash`);--> statement-breakpoint
CREATE INDEX `invitation_email` ON `invitations` (`email`);--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reset_token` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE TABLE `profile_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profile_files_user` ON `profile_files` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profile_file_key` ON `profile_files` (`object_key`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`due_date` text,
	`done` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "task_done" CHECK("tasks"."done" IN (0,1))
);
--> statement-breakpoint
CREATE INDEX `tasks_user` ON `tasks` (`user_id`,`done`,`due_date`);--> statement-breakpoint
ALTER TABLE `jobs` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `dedupe_key` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `posted_at` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `scraped_at` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_posted_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `company_description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `department` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `experience_level` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `country` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `salary_min` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `salary_max` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `salary_currency` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `salary_period` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `hiring_team` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `quality_state` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `quality_warnings` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `raw_payload` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `job_dedupe` ON `jobs` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `jobs_posted` ON `jobs` (`posted_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `access_role` text DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `headline` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `skills` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `account_status` text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
UPDATE users SET access_role = role;
