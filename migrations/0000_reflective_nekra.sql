CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_application` ON `activity` (`application_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`status` text DEFAULT 'to_apply' NOT NULL,
	`saved` integer DEFAULT 0 NOT NULL,
	`follow_up` text,
	`applied_at` text,
	`version` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "application_status" CHECK("applications"."status" IN ('to_apply','saved','applied','processing','interview','offer','rejected','withdrawn')),
	CONSTRAINT "application_saved" CHECK("applications"."saved" IN (0,1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_user_job` ON `applications` (`user_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `applications_user` ON `applications` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`job_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`job_id`, `user_id`),
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignments_user` ON `assignments` (`user_id`,`job_id`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "attachment_kind" CHECK("attachments"."kind" IN ('resume','proof')),
	CONSTRAINT "attachment_size" CHECK("attachments"."size" > 0 AND "attachments"."size" <= 10485760)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attachment_key` ON `attachments` (`object_key`);--> statement-breakpoint
CREATE INDEX `attachments_application` ON `attachments` (`application_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`title` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`timezone` text NOT NULL,
	`state` text DEFAULT 'scheduled' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "interview_state" CHECK("interviews"."state" IN ('scheduled','completed','cancelled')),
	CONSTRAINT "interview_time" CHECK("interviews"."ends_at" > "interviews"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `interviews_application` ON `interviews` (`application_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text NOT NULL,
	`workplace` text DEFAULT 'Remote' NOT NULL,
	`employment_type` text DEFAULT 'Full-time' NOT NULL,
	`salary` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`requirements` text DEFAULT '' NOT NULL,
	`application_url` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`visibility` text DEFAULT 'all' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`deadline` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "job_visibility" CHECK("jobs"."visibility" IN ('all','assigned')),
	CONSTRAINT "job_active" CHECK("jobs"."active" IN (0,1))
);
--> statement-breakpoint
CREATE INDEX `jobs_active` ON `jobs` (`active`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_expiry` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`recovery_hash` text NOT NULL,
	`role` text DEFAULT 'client' NOT NULL,
	`timezone` text DEFAULT 'America/Denver' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "user_role" CHECK("users"."role" IN ('client','admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email` ON `users` (`email`);