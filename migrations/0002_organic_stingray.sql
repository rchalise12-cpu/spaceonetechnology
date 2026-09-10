CREATE INDEX `applications_job` ON `applications` (`job_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `users_access` ON `users` (`access_role`,`created_at`);