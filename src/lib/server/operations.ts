import { error, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq, desc, sql, getTableColumns, isNull, or, count } from 'drizzle-orm';
import {
	db,
	requireUser,
	requireOperator,
	requireAdmin,
	digest,
	token,
	rateLimit
} from './security';
import {
	users,
	applications,
	jobs,
	interviews,
	invitations,
	sessions,
	auditLog,
	importBatches,
	inquiries,
	profileFiles,
	tasks,
	assignments
} from './schema';
import { emailSchema, jobSchema } from './schemas';
import { normalizeInput, cleanText, type FieldMapping } from '$lib/job-import';
import { sendAccountMail } from './mail';
export function userColumns() {
	return {
		id: users.id,
		name: users.name,
		email: users.email,
		role: users.access_role,
		phone: users.phone,
		location: users.location,
		headline: users.headline,
		bio: users.bio,
		skills: users.skills,
		timezone: users.timezone,
		account_status: users.account_status,
		created_at: users.created_at
	};
}
export async function candidateRows(event: RequestEvent) {
	requireOperator(event);
	return db(event)
		.select({
			...userColumns(),
			applied: sql<number>`(SELECT COUNT(*) FROM applications a WHERE a.user_id="users"."id" AND a.applied_at IS NOT NULL)`,
			processing: sql<number>`(SELECT COUNT(*) FROM applications a WHERE a.user_id="users"."id" AND a.status='processing')`,
			offers: sql<number>`(SELECT COUNT(*) FROM applications a WHERE a.user_id="users"."id" AND a.status='offer')`,
			rejected: sql<number>`(SELECT COUNT(*) FROM applications a WHERE a.user_id="users"."id" AND a.status='rejected')`,
			interviews_completed: sql<number>`(SELECT COUNT(*) FROM interviews i JOIN applications a ON a.id=i.application_id WHERE a.user_id="users"."id" AND i.state='completed')`,
			interviews_scheduled: sql<number>`(SELECT COUNT(*) FROM interviews i JOIN applications a ON a.id=i.application_id WHERE a.user_id="users"."id" AND i.state='scheduled')`,
			overdue: sql<number>`(SELECT COUNT(*) FROM tasks t WHERE t.user_id="users"."id" AND t.done=0 AND t.due_date<date('now'))`,
			last_activity: sql<
				string | null
			>`(SELECT MAX(a.updated_at) FROM applications a WHERE a.user_id="users"."id")`
		})
		.from(users)
		.where(eq(users.access_role, 'client'))
		.orderBy(desc(users.created_at));
}
export async function candidateDetail(event: RequestEvent, id: string) {
	requireOperator(event);
	const database = db(event);
	const candidate = (await candidateRows(event)).find((u) => u.id === id);
	if (!candidate) error(404, 'Candidate not found.');
	const [apps, meetings, files, todo, assigned] = await database.batch([
		database
			.select({ ...getTableColumns(applications), title: jobs.title, company: jobs.company })
			.from(applications)
			.innerJoin(jobs, eq(jobs.id, applications.job_id))
			.where(eq(applications.user_id, id))
			.orderBy(desc(applications.updated_at)),
		database
			.select({
				...getTableColumns(interviews),
				job_id: applications.job_id,
				company: jobs.company
			})
			.from(interviews)
			.innerJoin(applications, eq(applications.id, interviews.application_id))
			.innerJoin(jobs, eq(jobs.id, applications.job_id))
			.where(eq(applications.user_id, id))
			.orderBy(interviews.starts_at),
		database
			.select({
				id: profileFiles.id,
				name: profileFiles.name,
				size: profileFiles.size,
				created_at: profileFiles.created_at
			})
			.from(profileFiles)
			.where(eq(profileFiles.user_id, id)),
		database.select().from(tasks).where(eq(tasks.user_id, id)).orderBy(tasks.done, tasks.due_date),
		database
			.select({ id: jobs.id, title: jobs.title, company: jobs.company })
			.from(assignments)
			.innerJoin(jobs, eq(jobs.id, assignments.job_id))
			.where(eq(assignments.user_id, id))
	]);
	return { candidate, applications: apps, interviews: meetings, files, tasks: todo, assigned };
}
export async function dashboard(event: RequestEvent) {
	const user = requireUser(event),
		database = db(event);
	if (user.role !== 'client') {
		const candidates = await candidateRows(event);
		const [jobCount, pending, held, inbox] = await database.batch([
			database.select({ value: count() }).from(jobs).where(eq(jobs.active, 1)),
			database
				.select({ value: count() })
				.from(invitations)
				.where(
					and(
						isNull(invitations.accepted_at),
						isNull(invitations.revoked_at),
						sql`${invitations.expires_at}>${Date.now()}`
					)
				),
			database.select({ value: count() }).from(jobs).where(eq(jobs.quality_state, 'needs_review')),
			database.select({ value: count() }).from(inquiries).where(eq(inquiries.status, 'new'))
		]);
		return {
			candidates,
			stats: {
				candidates: candidates.length,
				jobs: jobCount[0].value,
				applied: candidates.reduce((s, c) => s + c.applied, 0),
				interviews: candidates.reduce((s, c) => s + c.interviews_completed, 0),
				pending: pending[0].value,
				held: held[0].value,
				inquiries: inbox[0].value
			}
		};
	}
	return { candidates: [], stats: null };
}
async function audit(event: RequestEvent, action: string, target: string, detail = '') {
	await db(event)
		.insert(auditLog)
		.values({
			id: crypto.randomUUID(),
			actor_id: requireUser(event).id,
			action,
			target_id: target,
			detail
		});
}
export async function operations(
	event: RequestEvent,
	path: string[],
	method: string,
	body: () => Promise<unknown>
): Promise<Response | null> {
	if (!['candidates', 'invitations', 'team', 'imports', 'inquiries', 'dashboard'].includes(path[0]))
		return null;
	const user = requireUser(event),
		database = db(event);
	if (path[0] === 'dashboard' && method === 'GET') return json(await dashboard(event));
	requireOperator(event);
	if (path[0] === 'candidates' && method === 'GET')
		return json(
			path[1] ? await candidateDetail(event, path[1]) : { candidates: await candidateRows(event) }
		);
	if (path[0] === 'inquiries') {
		if (method === 'GET')
			return json({
				inquiries: await database
					.select()
					.from(inquiries)
					.orderBy(desc(inquiries.created_at))
					.limit(1000)
			});
		if (method === 'PATCH' && path[1]) {
			const data = z
				.object({ status: z.enum(['new', 'in_progress', 'closed']) })
				.parse(await body());
			await database.update(inquiries).set(data).where(eq(inquiries.id, path[1]));
			return json({ ok: true });
		}
	}
	if (path[0] === 'team') {
		requireAdmin(event);
		if (method === 'GET')
			return json({
				users: await database.select(userColumns()).from(users).orderBy(desc(users.created_at)),
				audit: await database
					.select({
						id: auditLog.id,
						action: auditLog.action,
						target_id: auditLog.target_id,
						detail: auditLog.detail,
						created_at: auditLog.created_at,
						actor: users.name
					})
					.from(auditLog)
					.leftJoin(users, eq(users.id, auditLog.actor_id))
					.orderBy(desc(auditLog.created_at))
					.limit(100)
			});
		if (method === 'PATCH' && path[1]) {
			const data = z
				.object({
					role: z.enum(['admin', 'staff', 'client']),
					account_status: z.enum(['active', 'suspended'])
				})
				.strict()
				.parse(await body());
			if (path[1] === user.id)
				error(400, 'You cannot change your own access. Another administrator must do this.');
			const result = await database.batch([
				database
					.update(users)
					.set({
						access_role: data.role,
						role: data.role === 'admin' ? 'admin' : 'client',
						account_status: data.account_status
					})
					.where(
						and(
							eq(users.id, path[1]),
							data.role === 'admin' && data.account_status === 'active'
								? undefined
								: sql`(${users.access_role}!='admin' OR ${users.account_status}!='active' OR (SELECT COUNT(*) FROM users admins WHERE admins.access_role='admin' AND admins.account_status='active')>1)`
						)
					),
				database.delete(sessions).where(eq(sessions.user_id, path[1]))
			]);
			if (!result[0].meta.changes)
				error(
					409,
					'The account was not found or this change would remove the last active administrator.'
				);
			await audit(event, 'user.access', path[1], `${data.role}; ${data.account_status}`);
			return json({ ok: true });
		}
	}
	if (path[0] === 'invitations') {
		if (method === 'GET')
			return json({
				invitations: await database
					.select({
						id: invitations.id,
						email: invitations.email,
						role: invitations.role,
						expires_at: invitations.expires_at,
						accepted_at: invitations.accepted_at,
						revoked_at: invitations.revoked_at,
						delivery_status: invitations.delivery_status,
						created_at: invitations.created_at
					})
					.from(invitations)
					.where(user.role === 'admin' ? undefined : eq(invitations.role, 'client'))
					.orderBy(desc(invitations.created_at))
					.limit(500)
			});
		if (method === 'DELETE' && path[1]) {
			const invite = await database
				.select()
				.from(invitations)
				.where(eq(invitations.id, path[1]))
				.get();
			if (!invite) error(404, 'Invitation not found.');
			if (invite.role === 'staff') requireAdmin(event);
			await database
				.update(invitations)
				.set({ revoked_at: new Date().toISOString() })
				.where(and(eq(invitations.id, path[1]), isNull(invitations.accepted_at)));
			await audit(event, 'invitation.revoke', path[1]);
			return json({ ok: true });
		}
		if (method === 'POST') {
			await rateLimit(event, `invite:${user.id}`, 20);
			let email: string,
				role: 'client' | 'staff',
				id: string = crypto.randomUUID();
			if (path[1]) {
				const invite = await database
					.select()
					.from(invitations)
					.where(eq(invitations.id, path[1]))
					.get();
				if (!invite || invite.accepted_at) error(400, 'This invitation cannot be resent.');
				email = invite.email;
				role = invite.role;
				id = invite.id;
			} else {
				const data = z
					.object({ email: emailSchema, role: z.enum(['staff', 'client']) })
					.parse(await body());
				email = data.email;
				role = data.role;
			}
			if (role === 'staff') requireAdmin(event);
			if (await database.select({ id: users.id }).from(users).where(eq(users.email, email)).get())
				error(409, 'This email already has an account.');
			const raw = token();
			await database
				.update(invitations)
				.set({ revoked_at: new Date().toISOString() })
				.where(
					and(
						eq(invitations.email, email),
						isNull(invitations.accepted_at),
						isNull(invitations.revoked_at)
					)
				);
			await database
				.insert(invitations)
				.values({
					id,
					email,
					role,
					created_by: user.id,
					token_hash: await digest(raw),
					expires_at: Date.now() + 7 * 86400000
				})
				.onConflictDoUpdate({
					target: invitations.id,
					set: {
						token_hash: await digest(raw),
						expires_at: Date.now() + 7 * 86400000,
						revoked_at: null,
						delivery_status: 'pending'
					}
				});
			try {
				const delivery = await sendAccountMail(event, email, 'invite', raw);
				await database
					.update(invitations)
					.set({ delivery_status: delivery.delivery_status })
					.where(eq(invitations.id, id));
				await audit(event, 'invitation.send', id, role);
				return json({ id, ...delivery }, { status: 201 });
			} catch {
				await database
					.update(invitations)
					.set({ delivery_status: 'failed' })
					.where(eq(invitations.id, id));
				error(
					502,
					'Invitation saved, but email delivery failed. Check the email binding and verified sending domain, then resend.'
				);
			}
		}
	}
	if (path[0] === 'imports') {
		if (method === 'GET')
			return json({
				batches: await database
					.select()
					.from(importBatches)
					.orderBy(desc(importBatches.created_at))
					.limit(100)
			});
		if (method === 'POST' && path[1] === 'preview') {
			const data = z
				.object({
					text: z.string().max(2000000),
					mapping: z.record(z.string(), z.string().max(100)).optional()
				})
				.parse(await body());
			try {
				return json(await normalizeInput(data.text, data.mapping as FieldMapping));
			} catch (e) {
				error(400, e instanceof Error ? e.message : 'Cannot parse this file.');
			}
		}
		if (method === 'POST' && path[1] === 'commit') {
			const data = z
				.object({
					text: z.string().max(2000000),
					name: z.string().max(160).default('Job import'),
					mapping: z.record(z.string(), z.string().max(100)).optional()
				})
				.parse(await body());
			let normalized;
			try {
				normalized = await normalizeInput(data.text, data.mapping as FieldMapping);
			} catch (e) {
				error(400, e instanceof Error ? e.message : 'Cannot parse this file.');
			}
			let published = 0,
				held = 0,
				duplicates = 0;
			const statements = normalized.jobs.map((item) =>
				database
					.insert(jobs)
					.values({
						...item,
						tags: JSON.stringify(item.tags),
						active: Number(item.active),
						quality_warnings: JSON.stringify(item.quality_warnings)
					})
					.onConflictDoNothing()
			);
			const [first, ...rest] = statements;
			const results = await database.batch([first, ...rest]);
			results.forEach((result, index) => {
				if (!result.meta.changes) {
					duplicates++;
					return;
				}
				normalized.jobs[index].quality_state === 'ready' ? published++ : held++;
			});

			const id: string = crypto.randomUUID();
			await database.insert(importBatches).values({
				id,
				user_id: user.id,
				name: data.name,
				total: normalized.jobs.length,
				published,
				held
			});
			await audit(
				event,
				'jobs.import',
				id,
				`${published} published; ${held} held; ${duplicates} duplicates skipped`
			);
			return json(
				{ id, published, held, duplicates, warnings: normalized.warnings },
				{ status: 201 }
			);
		}
	}
	error(404, 'Endpoint not found.');
}
