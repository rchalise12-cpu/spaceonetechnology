import { error, type RequestEvent } from '@sveltejs/kit';
import { and, eq, or, exists, isNotNull, desc, asc, sql, getTableColumns } from 'drizzle-orm';
import { db, requireUser, requireOperator } from './security';
import {
	jobs,
	applications,
	assignments,
	activity,
	attachments,
	interviews as interviewTable
} from './schema';
import { commentRows, taskRows, profileFileRows } from './workspace';
import type { Job, Status } from '$lib/types';

function queryJobs(event: RequestEvent, id?: string, subjectId?: string) {
	const user = requireUser(event);
	const database = db(event);
	const visible =
		user.role !== 'client'
			? sql`1=1`
			: or(
					eq(jobs.visibility, 'all'),
					exists(
						database
							.select({ id: assignments.job_id })
							.from(assignments)
							.where(and(eq(assignments.job_id, jobs.id), eq(assignments.user_id, user.id)))
					),
					isNotNull(applications.id)
				);
	return database
		.select({
			...publicJobColumns(),
			application_count: sql<number>`(SELECT COUNT(*) FROM applications counts WHERE counts.job_id=${jobs.id} AND counts.applied_at IS NOT NULL)`,
			status: sql<Status>`COALESCE(${applications.status},'to_apply')`,
			saved: sql<number>`COALESCE(${applications.saved},0)`,
			follow_up: applications.follow_up,
			applied_at: applications.applied_at,
			version: sql<number>`COALESCE(${applications.version},0)`,
			application_id: applications.id,
			next_interview: sql<
				string | null
			>`(SELECT MIN(i.starts_at) FROM interviews i WHERE i.application_id=${applications.id} AND i.state='scheduled' AND i.ends_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
			interview_state: sql<
				string | null
			>`(SELECT i.state FROM interviews i WHERE i.application_id=${applications.id} ORDER BY CASE WHEN i.state='scheduled' THEN 0 ELSE 1 END,i.starts_at DESC LIMIT 1)`
		})
		.from(jobs)
		.leftJoin(
			applications,
			and(eq(applications.job_id, jobs.id), eq(applications.user_id, subjectId || user.id))
		)
		.where(
			and(
				visible,
				user.role !== 'client'
					? sql`1=1`
					: or(
							and(eq(jobs.active, 1), eq(jobs.quality_state, 'ready')),
							isNotNull(applications.id)
						),
				id ? eq(jobs.id, id) : undefined
			)
		)
		.orderBy(desc(jobs.created_at));
}
export async function listJobs(event: RequestEvent): Promise<Job[]> {
	return queryJobs(event);
}
export async function getJob(event: RequestEvent, id: string): Promise<Job> {
	const job = await queryJobs(event, id, await subjectUserId(event)).get();
	if (!job) error(404, 'Job not found.');
	return job;
}
export async function application(event: RequestEvent, jobId: string) {
	const job = await getJob(event, jobId);
	const user = requireUser(event);
	const subjectId = await subjectUserId(event);
	const database = db(event);
	if (!job.application_id)
		await database
			.insert(applications)
			.values({ id: crypto.randomUUID(), user_id: subjectId, job_id: job.id })
			.onConflictDoNothing();
	const record = await database
		.select({ id: applications.id })
		.from(applications)
		.where(and(eq(applications.user_id, subjectId), eq(applications.job_id, job.id)))
		.get();
	if (!record) error(500, 'Could not open application.');
	return record.id;
}
export function activityStatement(event: RequestEvent, appId: string, kind: string, body: string) {
	return db(event)
		.insert(activity)
		.values({ id: crypto.randomUUID(), application_id: appId, kind, body });
}
export async function details(event: RequestEvent, id: string) {
	const job = await getJob(event, id);
	const database = db(event);
	const appId = job.application_id || '';
	const [events, files, meetings] = await database.batch([
		database
			.select()
			.from(activity)
			.where(eq(activity.application_id, appId))
			.orderBy(desc(activity.created_at)),
		database
			.select({
				id: attachments.id,
				application_id: attachments.application_id,
				name: attachments.name,
				kind: attachments.kind,
				mime: attachments.mime,
				size: attachments.size,
				created_at: attachments.created_at
			})
			.from(attachments)
			.where(eq(attachments.application_id, appId))
			.orderBy(desc(attachments.created_at)),
		database
			.select()
			.from(interviewTable)
			.where(eq(interviewTable.application_id, appId))
			.orderBy(asc(interviewTable.starts_at))
	]);
	return {
		job,
		activity: events,
		attachments: files,
		interviews: meetings,
		comments: await commentRows(event, id),
		tasks: await taskRows(event, id),
		profileFiles: await profileFileRows(event),
		candidate: event.url.searchParams.get('candidate') || null
	};
}
export async function interviews(event: RequestEvent) {
	return db(event)
		.select({
			...getTableColumns(interviewTable),
			job_id: jobs.id,
			job_title: jobs.title,
			company: jobs.company
		})
		.from(interviewTable)
		.innerJoin(applications, eq(applications.id, interviewTable.application_id))
		.innerJoin(jobs, eq(jobs.id, applications.job_id))
		.where(eq(applications.user_id, requireUser(event).id))
		.orderBy(asc(interviewTable.starts_at));
}
export async function documents(event: RequestEvent) {
	return db(event)
		.select({
			id: attachments.id,
			application_id: attachments.application_id,
			name: attachments.name,
			kind: attachments.kind,
			mime: attachments.mime,
			size: attachments.size,
			created_at: attachments.created_at,
			job_id: jobs.id,
			job_title: jobs.title,
			company: jobs.company
		})
		.from(attachments)
		.innerJoin(applications, eq(applications.id, attachments.application_id))
		.innerJoin(jobs, eq(jobs.id, applications.job_id))
		.where(eq(applications.user_id, requireUser(event).id))
		.orderBy(desc(attachments.created_at));
}

export async function subjectUserId(event: RequestEvent) {
	const user = requireUser(event);
	const target = event.url.searchParams.get('candidate');
	if (!target || target === user.id) return user.id;
	requireOperator(event);
	const { users } = await import('./schema');
	const candidate = await db(event)
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, target), eq(users.access_role, 'client')))
		.get();
	if (!candidate) error(404, 'Candidate not found.');
	return candidate.id;
}
export function publicJobColumns() {
	const { raw_payload, dedupe_key, ...columns } = getTableColumns(jobs);
	return columns;
}
