import { error, isHttpError, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { accountAuth, invitationInfo, phoneSchema } from './account';
import { operations } from './operations';
import { workspaceApi } from './workspace';
import { cleanText } from '$lib/job-import';
import { auth } from './auth';
import { boundedBody, db, requireAdmin, requireOperator, requireUser, rateLimit } from './security';
import {
	activityStatement,
	application,
	details,
	documents,
	getJob,
	interviews,
	listJobs
} from './jobs';
import { applicationSchema, interviewSchema, jobSchema, timezoneSchema } from './schemas';
import { calendarEvent } from '$lib/calendar';
import { eq, and, desc, getTableColumns, sql, inArray, count } from 'drizzle-orm';
import {
	users,
	jobs,
	applications,
	assignments,
	attachments,
	interviews as meetings,
	activity,
	inquiries
} from './schema';
import { statusLabel } from '$lib/types';

async function readJson(event: RequestEvent) {
	try {
		return JSON.parse(
			new TextDecoder().decode(await boundedBody(event.request, 2 * 1024 * 1024))
		) as unknown;
	} catch (e) {
		if (isHttpError(e)) throw e;
		error(400, 'Provide a valid JSON body.');
	}
}
export async function handleApi(event: RequestEvent) {
	try {
		return await route(event);
	} catch (e) {
		if (e instanceof z.ZodError)
			return json(
				{ message: e.issues.map((i) => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; ') },
				{ status: 400 }
			);
		if (isHttpError(e))
			return json(
				{ message: e.body.message },
				{ status: e.status, headers: e.status === 429 ? { 'Retry-After': '900' } : undefined }
			);
		const requestId = crypto.randomUUID();
		console.error(
			JSON.stringify({
				event: 'api_error',
				requestId,
				path: event.url.pathname,
				error: e instanceof Error ? e.name : 'UnknownError'
			})
		);
		return json({ message: 'Something went wrong. Please try again.', requestId }, { status: 500 });
	}
}
async function route(event: RequestEvent): Promise<Response> {
	const path = (event.params.path || '').split('/');
	const method = event.request.method;
	if (path[0] === 'auth' && path[1] === 'invitation' && method === 'GET')
		return json(await invitationInfo(event));
	if (path[0] === 'auth' && method === 'POST') {
		const body = await readJson(event);
		return (await accountAuth(event, path[1], body)) || (await auth(event, path[1], body));
	}
	if (path[0] === 'contact' && method === 'POST') {
		await rateLimit(
			event,
			`contact:${event.request.headers.get('cf-connecting-ip') || 'local'}`,
			5
		);
		const data = z
			.object({
				name: z.string().trim().min(2).max(100),
				email: z.string().trim().toLowerCase().email().max(254),
				company: z.string().max(160).default(''),
				interest: z.string().min(2).max(100),
				message: z.string().trim().min(20).max(5000),
				website: z.string().max(200).default('')
			})
			.parse(await readJson(event));
		if (!data.website)
			await db(event)
				.insert(inquiries)
				.values({
					id: crypto.randomUUID(),
					name: cleanText(data.name, 100),
					email: data.email,
					company: cleanText(data.company, 160),
					interest: cleanText(data.interest, 100),
					message: cleanText(data.message, 5000)
				});
		return json({ ok: true }, { status: 201 });
	}

	const user = requireUser(event);
	const database = db(event);
	if (method !== 'GET') await rateLimit(event, `write:${user.id}`, 180);
	const extended =
		(await operations(event, path, method, () => readJson(event))) ||
		(await workspaceApi(event, path, method, () => readJson(event)));
	if (extended) return extended;
	if (path[0] === 'me' && method === 'GET') return json({ user });
	if (path[0] === 'me' && method === 'PATCH') {
		const data = z
			.object({
				name: z.string().trim().min(2).max(100),
				timezone: timezoneSchema,
				phone: phoneSchema.optional(),
				location: z.string().trim().max(160).optional(),
				headline: z.string().trim().max(160).optional(),
				bio: z.string().trim().max(3000).optional(),
				skills: z.array(z.string().trim().min(1).max(40)).max(30).optional()
			})
			.strict()
			.parse(await readJson(event));
		await database
			.update(users)
			.set({ ...data, skills: data.skills ? JSON.stringify(data.skills) : undefined })
			.where(eq(users.id, user.id));
		return json({ ok: true });
	}
	if (path[0] === 'jobs' && path.length === 1 && method === 'GET')
		return json({ jobs: await listJobs(event) });
	if (path[0] === 'jobs' && path[1]) {
		const id = path[1];
		if (path.length === 2 && method === 'GET') return json(await details(event, id));
		if (path[2] === 'application' && method === 'PATCH') {
			const data = applicationSchema.parse(await readJson(event));
			const previous = await getJob(event, id);
			const appId = await application(event, id);
			const status = data.status ?? previous.status;
			const applied =
				data.applied_at !== undefined
					? data.applied_at
					: previous.applied_at ||
						(['applied', 'processing', 'interview', 'offer', 'rejected'].includes(status)
							? new Date().toISOString()
							: null);
			const results = await database.batch([
				database
					.update(applications)
					.set({
						status,
						saved: data.saved === undefined ? previous.saved : Number(data.saved),
						follow_up: data.follow_up === undefined ? previous.follow_up : data.follow_up,
						applied_at: applied,
						version: sql`${applications.version}+1`,
						updated_at: new Date().toISOString()
					})
					.where(and(eq(applications.id, appId), eq(applications.version, data.version))),
				database.insert(activity).select(
					database
						.select({
							id: sql<string>`${crypto.randomUUID()}`.as('id'),
							application_id: sql<string>`${appId}`.as('application_id'),
							kind: sql<string>`'status'`.as('kind'),
							body: sql<string>`${data.status && data.status !== previous.status ? `Status changed to ${statusLabel[status]}` : 'Application details updated'}`.as(
								'body'
							),
							created_at: sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ','now')`.as('created_at')
						})
						.from(applications)
						.where(and(eq(applications.id, appId), sql`changes()=1`))
				)
			]);
			if (!results[0].meta.changes)
				error(409, 'This application changed in another window. Refresh before saving.');
			return json(await details(event, id));
		}
		if (path[2] === 'notes' && method === 'POST') {
			const data = z
				.object({ body: z.string().trim().min(1).max(5000) })
				.parse(await readJson(event));
			const appId = await application(event, id);
			await activityStatement(event, appId, 'note', data.body).run();
			return json({ ok: true }, { status: 201 });
		}
		if (path[2] === 'interviews' && method === 'POST') {
			const data = interviewSchema.parse(await readJson(event));
			const appId = await application(event, id);
			const interviewId = crypto.randomUUID();
			await database.batch([
				database.insert(meetings).values({ id: interviewId, application_id: appId, ...data }),
				activityStatement(event, appId, 'interview', `Interview added: ${data.title}`)
			]);
			return json({ id: interviewId }, { status: 201 });
		}
		if (path[2] === 'files' && method === 'POST') return upload(event, id);
	}
	if (path[0] === 'interviews') {
		if (!path[1] && method === 'GET') return json({ interviews: await interviews(event) });
		const item = await database
			.select(getTableColumns(meetings))
			.from(meetings)
			.innerJoin(applications, eq(applications.id, meetings.application_id))
			.where(
				and(
					eq(meetings.id, path[1]),
					user.role === 'client' ? eq(applications.user_id, user.id) : undefined
				)
			)
			.get();
		if (!item) error(404, 'Interview not found.');
		if (path[2] === 'calendar' && method === 'GET')
			return new Response(calendarEvent(item), {
				headers: {
					'Content-Type': 'text/calendar; charset=utf-8',
					'Content-Disposition': 'attachment; filename="interview.ics"'
				}
			});
		if (method === 'PATCH') {
			const data = interviewSchema.parse(await readJson(event));
			await database.batch([
				database.update(meetings).set(data).where(eq(meetings.id, item.id)),
				activityStatement(
					event,
					item.application_id,
					'interview',
					`Interview updated: ${data.title} (${data.state})`
				)
			]);
			return json({ ok: true });
		}
		if (method === 'DELETE') {
			await database.batch([
				database.delete(meetings).where(eq(meetings.id, item.id)),
				activityStatement(
					event,
					item.application_id,
					'interview',
					`Interview removed: ${item.title}`
				)
			]);
			return json({ ok: true });
		}
	}
	if (path[0] === 'files') {
		if (!path[1] && method === 'GET') return json({ files: await documents(event) });
		const file = await database
			.select(getTableColumns(attachments))
			.from(attachments)
			.innerJoin(applications, eq(applications.id, attachments.application_id))
			.where(
				and(
					eq(attachments.id, path[1]),
					user.role === 'client' ? eq(applications.user_id, user.id) : undefined
				)
			)
			.get();
		if (!file) error(404, 'File not found.');
		if (method === 'GET') {
			const object = await event.platform!.env.FILES.get(file.object_key);
			if (!object) error(404, 'File is unavailable.');
			return new Response(object.body, {
				headers: {
					'Content-Type': file.mime,
					'Content-Length': String(object.size),
					'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
					'Cache-Control': 'private, no-store',
					'X-Content-Type-Options': 'nosniff'
				}
			});
		}
		if (method === 'DELETE') {
			// R2 first: a retry can finish metadata cleanup if the D1 write fails.
			await event.platform!.env.FILES.delete(file.object_key);
			await database.batch([
				database.delete(attachments).where(eq(attachments.id, file.id)),
				activityStatement(event, file.application_id, 'file', `File removed: ${file.name}`)
			]);
			return json({ ok: true });
		}
	}
	if (path[0] === 'admin') return admin(event, path, method);
	error(404, 'Endpoint not found.');
}

async function upload(event: RequestEvent, jobId: string) {
	const appId = await application(event, jobId);
	const user = requireUser(event);
	await rateLimit(event, `upload:${user.id}`, 30);
	const total = await db(event)
		.select({ count: count() })
		.from(attachments)
		.where(eq(attachments.application_id, appId))
		.get();
	if (total && total.count >= 50)
		error(400, 'This application has reached its 50-file limit. Remove old files first.');
	const bytes = await boundedBody(event.request, 10 * 1024 * 1024 + 65536);
	let parsed: FormData;
	try {
		parsed = await new Response(bytes, {
			headers: { 'Content-Type': event.request.headers.get('content-type') || '' }
		}).formData();
	} catch {
		error(400, 'Upload a file using a multipart form.');
	}
	const file = parsed.get('file');
	const kind = z.enum(['resume', 'proof']).parse(parsed.get('kind'));
	if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024)
		error(400, 'Choose a file between 1 byte and 10 MB.');
	const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
	const ascii = new TextDecoder().decode(header);
	const mime = ascii.startsWith('%PDF-')
		? 'application/pdf'
		: header[0] === 0x89 && ascii.slice(1, 4) === 'PNG'
			? 'image/png'
			: header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
				? 'image/jpeg'
				: ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
					? 'image/webp'
					: null;
	if (
		!mime ||
		(kind === 'resume' && mime !== 'application/pdf') ||
		(kind === 'proof' && mime === 'application/pdf')
	)
		error(400, 'Resumes must be PDFs. Proof must be PNG, JPEG, or WebP.');
	const name =
		file.name.replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0, 180) ||
		(kind === 'resume' ? 'resume.pdf' : 'proof');
	const id = crypto.randomUUID();
	const key = `${user.id}/${jobId}/${id}`;
	const bucket = event.platform!.env.FILES;
	await bucket.put(key, file.stream(), { httpMetadata: { contentType: mime } });
	try {
		await db(event).batch([
			db(event)
				.insert(attachments)
				.values({ id, application_id: appId, object_key: key, name, kind, mime, size: file.size }),
			activityStatement(
				event,
				appId,
				'file',
				`${kind === 'resume' ? 'Resume' : 'Application proof'} uploaded: ${name}`
			)
		]);
	} catch (e) {
		await bucket.delete(key);
		throw e;
	}
	return json({ id }, { status: 201 });
}

async function admin(event: RequestEvent, path: string[], method: string) {
	requireOperator(event);
	const database = db(event);
	if (path[1] === 'overview' && method === 'GET') {
		const [jobRows, userRows, assignmentRows, applicationRows] = await database.batch([
			database.select().from(jobs).orderBy(desc(jobs.created_at)),
			database
				.select({ id: users.id, name: users.name, email: users.email, role: users.access_role })
				.from(users)
				.where(eq(users.access_role, 'client'))
				.orderBy(users.name),
			database.select().from(assignments),
			database
				.select({
					...getTableColumns(applications),
					title: jobs.title,
					company: jobs.company,
					name: users.name,
					email: users.email
				})
				.from(applications)
				.innerJoin(jobs, eq(jobs.id, applications.job_id))
				.innerJoin(users, eq(users.id, applications.user_id))
				.orderBy(desc(applications.updated_at))
		]);
		return json({
			jobs: jobRows,
			users: userRows,
			assignments: assignmentRows,
			applications: applicationRows
		});
	}
	if (path[1] === 'jobs' && method === 'POST') {
		const data = jobSchema.parse(await readJson(event));
		const id = data.id || crypto.randomUUID();
		await upsertJob(event, { ...data, id }).run();
		return json({ id }, { status: 201 });
	}
	if (path[1] === 'import' && method === 'POST') {
		const data = z
			.object({
				jobs: z
					.array(jobSchema.extend({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }))
					.min(1)
					.max(100)
			})
			.parse(await readJson(event));
		if (new Set(data.jobs.map((j) => j.id)).size !== data.jobs.length)
			error(400, 'Job IDs must be unique within the file.');
		const [first, ...rest] = data.jobs;
		await database.batch([upsertJob(event, first), ...rest.map((j) => upsertJob(event, j))]);
		return json({ imported: data.jobs.length });
	}
	if (path[1] === 'assignments' && method === 'POST') {
		const data = z
			.object({ job_id: z.string(), user_ids: z.array(z.string()).max(200) })
			.parse(await readJson(event));
		if (!(await database.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, data.job_id)).get()))
			error(404, 'Job not found.');
		const ids = [...new Set(data.user_ids)];
		if (ids.length) {
			const result = await database
				.select({ count: count() })
				.from(users)
				.where(and(inArray(users.id, ids), eq(users.access_role, 'client')))
				.get();
			if (result?.count !== ids.length) error(400, 'One or more clients do not exist.');
		}
		await database.batch([
			database.delete(assignments).where(eq(assignments.job_id, data.job_id)),
			...ids.map((id) => database.insert(assignments).values({ job_id: data.job_id, user_id: id }))
		]);
		return json({ ok: true });
	}
	error(404, 'Endpoint not found.');
}
function upsertJob(event: RequestEvent, data: z.infer<typeof jobSchema> & { id: string }) {
	const { id, ...fields } = data;
	const values = {
		...fields,
		quality_state: 'ready' as const,
		quality_warnings: '[]',
		tags: JSON.stringify(data.tags),
		active: Number(data.active)
	};
	return db(event)
		.insert(jobs)
		.values({ id, ...values })
		.onConflictDoUpdate({
			target: jobs.id,
			set: { ...values, updated_at: new Date().toISOString() }
		});
}
