import { error, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, and, desc, count, getTableColumns } from 'drizzle-orm';
import { db, requireUser, requireOperator, boundedBody, rateLimit } from './security';
import { tasks, comments, users, profileFiles, attachments } from './schema';
import { application, subjectUserId, getJob } from './jobs';
export async function taskRows(event: RequestEvent, job?: string) {
	const id = await subjectUserId(event);
	return db(event)
		.select()
		.from(tasks)
		.where(and(eq(tasks.user_id, id), job ? eq(tasks.job_id, job) : undefined))
		.orderBy(tasks.done, tasks.due_date, desc(tasks.created_at));
}
export async function commentRows(event: RequestEvent, jobId: string) {
	const job = await getJob(event, jobId);
	return db(event)
		.select({ ...getTableColumns(comments), author: users.name, role: users.access_role })
		.from(comments)
		.innerJoin(users, eq(users.id, comments.author_id))
		.where(eq(comments.application_id, job.application_id || ''))
		.orderBy(comments.created_at);
}
export async function profileFileRows(event: RequestEvent) {
	return db(event)
		.select({
			id: profileFiles.id,
			name: profileFiles.name,
			size: profileFiles.size,
			created_at: profileFiles.created_at
		})
		.from(profileFiles)
		.where(eq(profileFiles.user_id, await subjectUserId(event)))
		.orderBy(desc(profileFiles.created_at));
}
export async function workspaceApi(
	event: RequestEvent,
	path: string[],
	method: string,
	body: () => Promise<unknown>
): Promise<Response | null> {
	if (
		!['tasks', 'profile-files', 'comments'].includes(path[0]) &&
		!(path[0] === 'jobs' && ['comments', 'resume'].includes(path[2]))
	)
		return null;
	const user = requireUser(event),
		database = db(event),
		subject = await subjectUserId(event);
	if (path[0] === 'tasks') {
		if (method === 'GET')
			return json({ tasks: await taskRows(event, event.url.searchParams.get('job') || undefined) });
		if (method === 'POST') {
			const data = z
				.object({
					title: z.string().trim().min(2).max(300),
					job_id: z.string().max(100).nullable().default(null),
					due_date: z.iso.date().nullable().default(null)
				})
				.strict()
				.parse(await body());
			if (data.job_id) await getJob(event, data.job_id);
			const id = crypto.randomUUID();
			await database.insert(tasks).values({ id, user_id: subject, created_by: user.id, ...data });
			return json({ id }, { status: 201 });
		}
		const task = await database
			.select()
			.from(tasks)
			.where(and(eq(tasks.id, path[1]), eq(tasks.user_id, subject)))
			.get();
		if (!task) error(404, 'Task not found.');
		if (method === 'PATCH') {
			const data = z
				.object({
					done: z.boolean().optional(),
					title: z.string().trim().min(2).max(300).optional(),
					due_date: z.iso.date().nullable().optional()
				})
				.strict()
				.parse(await body());
			await database
				.update(tasks)
				.set({ ...data, done: data.done === undefined ? task.done : Number(data.done) })
				.where(eq(tasks.id, task.id));
			return json({ ok: true });
		}
		if (method === 'DELETE') {
			await database.delete(tasks).where(eq(tasks.id, task.id));
			return json({ ok: true });
		}
	}
	if (path[0] === 'jobs' && path[2] === 'comments') {
		if (method === 'GET') return json({ comments: await commentRows(event, path[1]) });
		if (method === 'POST') {
			const data = z.object({ body: z.string().trim().min(1).max(5000) }).parse(await body());
			const appId = await application(event, path[1]);
			await database.insert(comments).values({
				id: crypto.randomUUID(),
				application_id: appId,
				author_id: user.id,
				body: data.body
			});
			return json({ ok: true }, { status: 201 });
		}
	}
	if (path[0] === 'comments' && method === 'DELETE') {
		const comment = await database.select().from(comments).where(eq(comments.id, path[1])).get();
		if (!comment) error(404, 'Comment not found.');
		if (comment.author_id !== user.id) requireOperator(event);
		await database.delete(comments).where(eq(comments.id, comment.id));
		return json({ ok: true });
	}
	if (path[0] === 'profile-files') {
		if (method === 'GET' && !path[1]) return json({ files: await profileFileRows(event) });
		if (method === 'POST') {
			await rateLimit(event, `profile-upload:${user.id}`, 20);
			const total = await database
				.select({ n: count() })
				.from(profileFiles)
				.where(eq(profileFiles.user_id, subject))
				.get();
			if ((total?.n || 0) >= 30)
				error(400, 'Your library is limited to 30 resumes. Remove an older file first.');
			const bytes = await boundedBody(event.request, 10 * 1024 * 1024 + 65536);
			let form: FormData;
			try {
				form = await new Response(bytes, {
					headers: { 'Content-Type': event.request.headers.get('content-type') || '' }
				}).formData();
			} catch {
				error(400, 'Choose a PDF file.');
			}
			const file = form.get('file');
			if (
				!(file instanceof File) ||
				!file.size ||
				file.size > 10 * 1024 * 1024 ||
				!(await file.slice(0, 5).text()).startsWith('%PDF-')
			)
				error(400, 'Choose a valid PDF up to 10 MB.');
			const id = crypto.randomUUID(),
				key = `profiles/${subject}/${id}`;
			await event.platform!.env.FILES.put(key, file.stream(), {
				httpMetadata: { contentType: 'application/pdf' }
			});
			try {
				await database.insert(profileFiles).values({
					id,
					user_id: subject,
					object_key: key,
					name: file.name.replace(/[\x00-\x1f/\\]/g, '_').slice(0, 180),
					size: file.size
				});
			} catch (e) {
				await event.platform!.env.FILES.delete(key);
				throw e;
			}
			return json({ id }, { status: 201 });
		}
		const file = await database
			.select()
			.from(profileFiles)
			.where(eq(profileFiles.id, path[1]))
			.get();
		if (!file) error(404, 'Resume not found.');
		if (file.user_id !== user.id) requireOperator(event);
		if (method === 'GET') {
			const object = await event.platform!.env.FILES.get(file.object_key);
			if (!object) error(404, 'Resume unavailable.');
			return new Response(object.body, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
					'Cache-Control': 'private, no-store',
					'X-Content-Type-Options': 'nosniff'
				}
			});
		}
		if (method === 'DELETE') {
			await event.platform!.env.FILES.delete(file.object_key);
			await database.delete(profileFiles).where(eq(profileFiles.id, file.id));
			return json({ ok: true });
		}
	}
	if (path[0] === 'jobs' && path[2] === 'resume' && method === 'POST') {
		const { file_id } = z.object({ file_id: z.string() }).parse(await body());
		const file = await database
			.select()
			.from(profileFiles)
			.where(and(eq(profileFiles.id, file_id), eq(profileFiles.user_id, subject)))
			.get();
		if (!file) error(404, 'Resume not found in this candidate’s library.');
		const appId = await application(event, path[1]);
		const n = await database
			.select({ n: count() })
			.from(attachments)
			.where(eq(attachments.application_id, appId))
			.get();
		if ((n?.n || 0) >= 50) error(400, 'This application has reached its file limit.');
		const object = await event.platform!.env.FILES.get(file.object_key);
		if (!object) error(404, 'Resume unavailable.');
		const id = crypto.randomUUID(),
			key = `${subject}/${path[1]}/${id}`;
		await event.platform!.env.FILES.put(key, object.body, {
			httpMetadata: { contentType: 'application/pdf' }
		});
		try {
			await database.insert(attachments).values({
				id,
				application_id: appId,
				object_key: key,
				name: file.name,
				size: file.size,
				mime: 'application/pdf',
				kind: 'resume'
			});
		} catch (e) {
			await event.platform!.env.FILES.delete(key);
			throw e;
		}
		return json({ id }, { status: 201 });
	}
	error(404, 'Endpoint not found.');
}
