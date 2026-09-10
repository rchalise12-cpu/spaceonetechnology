import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
	primaryKey,
	check
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
export const users = sqliteTable(
	'users',
	{
		id: text().primaryKey(),
		email: text().notNull(),
		name: text().notNull(),
		access_role: text({ enum: ['client', 'staff', 'admin'] })
			.notNull()
			.default('client'),
		phone: text().notNull().default(''),
		location: text().notNull().default(''),
		headline: text().notNull().default(''),
		bio: text().notNull().default(''),
		skills: text().notNull().default('[]'),
		account_status: text({ enum: ['active', 'suspended'] })
			.notNull()
			.default('active'),
		password_hash: text().notNull(),
		recovery_hash: text().notNull(),
		role: text({ enum: ['client', 'admin'] })
			.notNull()
			.default('client'),
		timezone: text().notNull().default('America/Denver'),
		created_at: text().notNull().default(now)
	},
	(t) => [
		uniqueIndex('users_email').on(t.email),
		index('users_access').on(t.access_role, t.created_at),
		check('user_role', sql`${t.role} IN ('client','admin')`)
	]
);
export const sessions = sqliteTable(
	'sessions',
	{
		token_hash: text().primaryKey(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires_at: integer().notNull()
	},
	(t) => [index('sessions_user').on(t.user_id), index('sessions_expiry').on(t.expires_at)]
);
export const rateLimits = sqliteTable(
	'rate_limits',
	{ key: text().primaryKey(), count: integer().notNull(), expires_at: integer().notNull() },
	(t) => [index('rate_expiry').on(t.expires_at)]
);
export const jobs = sqliteTable(
	'jobs',
	{
		id: text().primaryKey(),
		title: text().notNull(),
		company: text().notNull(),
		location: text().notNull(),
		workplace: text().notNull().default('Remote'),
		employment_type: text().notNull().default('Full-time'),
		salary: text().notNull().default(''),
		description: text().notNull(),
		requirements: text().notNull().default(''),
		application_url: text().notNull(),
		tags: text().notNull().default('[]'),
		visibility: text({ enum: ['all', 'assigned'] })
			.notNull()
			.default('all'),
		active: integer().notNull().default(1),
		deadline: text(),
		source: text().notNull().default('manual'),
		source_id: text(),
		source_url: text().notNull().default(''),
		dedupe_key: text(),
		posted_at: text(),
		scraped_at: text(),
		source_posted_text: text().notNull().default(''),
		company_description: text().notNull().default(''),
		department: text().notNull().default(''),
		experience_level: text().notNull().default(''),
		country: text().notNull().default(''),
		salary_min: integer(),
		salary_max: integer(),
		salary_currency: text().notNull().default(''),
		salary_period: text().notNull().default(''),
		hiring_team: text().notNull().default('[]'),
		quality_state: text({ enum: ['ready', 'needs_review'] })
			.notNull()
			.default('ready'),
		quality_warnings: text().notNull().default('[]'),
		raw_payload: text().notNull().default('{}'),
		created_at: text().notNull().default(now),
		updated_at: text().notNull().default(now)
	},
	(t) => [
		index('jobs_active').on(t.active, t.created_at),
		uniqueIndex('job_dedupe').on(t.dedupe_key),
		index('jobs_posted').on(t.posted_at),
		check('job_visibility', sql`${t.visibility} IN ('all','assigned')`),
		check('job_active', sql`${t.active} IN (0,1)`)
	]
);
export const assignments = sqliteTable(
	'assignments',
	{
		job_id: text()
			.notNull()
			.references(() => jobs.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ columns: [t.job_id, t.user_id] }),
		index('assignments_user').on(t.user_id, t.job_id)
	]
);
export const applications = sqliteTable(
	'applications',
	{
		id: text().primaryKey(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		job_id: text()
			.notNull()
			.references(() => jobs.id, { onDelete: 'cascade' }),
		status: text({
			enum: [
				'to_apply',
				'saved',
				'applied',
				'processing',
				'interview',
				'offer',
				'rejected',
				'withdrawn'
			]
		})
			.notNull()
			.default('to_apply'),
		saved: integer().notNull().default(0),
		follow_up: text(),
		applied_at: text(),
		version: integer().notNull().default(0),
		updated_at: text().notNull().default(now)
	},
	(t) => [
		uniqueIndex('applications_user_job').on(t.user_id, t.job_id),
		index('applications_user').on(t.user_id, t.status),
		index('applications_job').on(t.job_id, t.applied_at),
		check(
			'application_status',
			sql`${t.status} IN ('to_apply','saved','applied','processing','interview','offer','rejected','withdrawn')`
		),
		check('application_saved', sql`${t.saved} IN (0,1)`)
	]
);
export const activity = sqliteTable(
	'activity',
	{
		id: text().primaryKey(),
		application_id: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		kind: text().notNull(),
		body: text().notNull(),
		created_at: text().notNull().default(now)
	},
	(t) => [index('activity_application').on(t.application_id, t.created_at)]
);
export const attachments = sqliteTable(
	'attachments',
	{
		id: text().primaryKey(),
		application_id: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		object_key: text().notNull(),
		name: text().notNull(),
		kind: text({ enum: ['resume', 'proof'] }).notNull(),
		mime: text().notNull(),
		size: integer().notNull(),
		created_at: text().notNull().default(now)
	},
	(t) => [
		uniqueIndex('attachment_key').on(t.object_key),
		index('attachments_application').on(t.application_id, t.created_at),
		check('attachment_kind', sql`${t.kind} IN ('resume','proof')`),
		check('attachment_size', sql`${t.size} > 0 AND ${t.size} <= 10485760`)
	]
);
export const interviews = sqliteTable(
	'interviews',
	{
		id: text().primaryKey(),
		application_id: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		title: text().notNull(),
		starts_at: text().notNull(),
		ends_at: text().notNull(),
		timezone: text().notNull(),
		state: text({ enum: ['scheduled', 'completed', 'cancelled'] })
			.notNull()
			.default('scheduled'),
		location: text().notNull().default(''),
		notes: text().notNull().default('')
	},
	(t) => [
		index('interviews_application').on(t.application_id, t.starts_at),
		check('interview_state', sql`${t.state} IN ('scheduled','completed','cancelled')`),
		check('interview_time', sql`${t.ends_at} > ${t.starts_at}`)
	]
);

export const invitations = sqliteTable(
	'invitations',
	{
		id: text().primaryKey(),
		email: text().notNull(),
		role: text({ enum: ['staff', 'client'] }).notNull(),
		token_hash: text().notNull(),
		created_by: text()
			.notNull()
			.references(() => users.id),
		expires_at: integer().notNull(),
		accepted_at: text(),
		accepted_by: text().references(() => users.id),
		revoked_at: text(),
		delivery_status: text({ enum: ['pending', 'sent', 'failed', 'local'] })
			.notNull()
			.default('pending'),
		created_at: text().notNull().default(now)
	},
	(t) => [
		uniqueIndex('invitation_token').on(t.token_hash),
		index('invitation_email').on(t.email),
		check('invite_role', sql`${t.role} IN ('staff','client')`)
	]
);
export const passwordResets = sqliteTable(
	'password_resets',
	{
		id: text().primaryKey(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		token_hash: text().notNull(),
		expires_at: integer().notNull(),
		used_at: text()
	},
	(t) => [uniqueIndex('reset_token').on(t.token_hash)]
);
export const comments = sqliteTable(
	'comments',
	{
		id: text().primaryKey(),
		application_id: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		author_id: text()
			.notNull()
			.references(() => users.id),
		body: text().notNull(),
		created_at: text().notNull().default(now)
	},
	(t) => [index('comments_application').on(t.application_id, t.created_at)]
);
export const tasks = sqliteTable(
	'tasks',
	{
		id: text().primaryKey(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		job_id: text().references(() => jobs.id, { onDelete: 'cascade' }),
		created_by: text()
			.notNull()
			.references(() => users.id),
		title: text().notNull(),
		due_date: text(),
		done: integer().notNull().default(0),
		created_at: text().notNull().default(now)
	},
	(t) => [
		index('tasks_user').on(t.user_id, t.done, t.due_date),
		check('task_done', sql`${t.done} IN (0,1)`)
	]
);
export const profileFiles = sqliteTable(
	'profile_files',
	{
		id: text().primaryKey(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		object_key: text().notNull(),
		name: text().notNull(),
		size: integer().notNull(),
		created_at: text().notNull().default(now)
	},
	(t) => [
		index('profile_files_user').on(t.user_id),
		uniqueIndex('profile_file_key').on(t.object_key)
	]
);
export const importBatches = sqliteTable('import_batches', {
	id: text().primaryKey(),
	user_id: text()
		.notNull()
		.references(() => users.id),
	name: text().notNull(),
	total: integer().notNull(),
	published: integer().notNull(),
	held: integer().notNull(),
	created_at: text().notNull().default(now)
});
export const auditLog = sqliteTable(
	'audit_log',
	{
		id: text().primaryKey(),
		actor_id: text().references(() => users.id),
		action: text().notNull(),
		target_id: text().notNull(),
		detail: text().notNull().default(''),
		created_at: text().notNull().default(now)
	},
	(t) => [index('audit_target').on(t.target_id, t.created_at)]
);
export const inquiries = sqliteTable(
	'inquiries',
	{
		id: text().primaryKey(),
		name: text().notNull(),
		email: text().notNull(),
		company: text().notNull().default(''),
		interest: text().notNull(),
		message: text().notNull(),
		status: text({ enum: ['new', 'in_progress', 'closed'] })
			.notNull()
			.default('new'),
		created_at: text().notNull().default(now)
	},
	(t) => [index('inquiry_status').on(t.status, t.created_at)]
);
