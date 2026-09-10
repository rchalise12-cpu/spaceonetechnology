import { error, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db, digest, token, hashPassword, session, rateLimit } from './security';
import { users, invitations, passwordResets, sessions } from './schema';
import { emailSchema, passwordSchema, timezoneSchema } from './schemas';
import { sendAccountMail } from './mail';
export const phoneSchema = z
	.string()
	.trim()
	.min(7)
	.max(30)
	.regex(/^[+\d\s().-]+$/, 'Enter a valid phone number.')
	.refine((value) => {
		const digits = value.replace(/\D/g, '').length;
		return digits >= 7 && digits <= 15;
	}, 'Use a phone number with 7–15 digits.');
const rawSchema = z.string().regex(/^[a-f0-9]{64}$/);
export async function invitationInfo(event: RequestEvent) {
	const hash = await digest(rawSchema.parse(event.url.searchParams.get('token')));
	const invite = await db(event)
		.select({
			email: invitations.email,
			role: invitations.role,
			expires_at: invitations.expires_at
		})
		.from(invitations)
		.where(
			and(
				eq(invitations.token_hash, hash),
				isNull(invitations.accepted_at),
				isNull(invitations.revoked_at),
				gt(invitations.expires_at, Date.now())
			)
		)
		.get();
	if (!invite)
		error(
			410,
			'This invitation has expired, was used, or was revoked. Ask your coordinator for a new invitation.'
		);
	return invite;
}
export async function accountAuth(
	event: RequestEvent,
	action: string,
	body: unknown
): Promise<Response | null> {
	if (!['accept-invite', 'forgot-password', 'reset-password'].includes(action)) return null;
	const database = db(event);
	await rateLimit(event, `account:${event.request.headers.get('cf-connecting-ip') || 'local'}`, 20);
	if (action === 'accept-invite') {
		const data = z
			.object({
				token: rawSchema,
				name: z.string().trim().min(2).max(100),
				email: emailSchema,
				phone: phoneSchema,
				password: passwordSchema,
				timezone: timezoneSchema.default('America/Chicago')
			})
			.parse(body);
		const hash = await digest(data.token);
		const now = Date.now();
		const recovery = token();
		const id = crypto.randomUUID();
		const invite = await database
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.token_hash, hash),
					eq(invitations.email, data.email),
					isNull(invitations.accepted_at),
					isNull(invitations.revoked_at),
					gt(invitations.expires_at, now)
				)
			)
			.get();
		if (!invite) error(410, 'This invitation is no longer available.');
		if (
			await database.select({ id: users.id }).from(users).where(eq(users.email, data.email)).get()
		)
			error(409, 'This email already has an account. Sign in instead.');
		const passwordHash = await hashPassword(data.password),
			recoveryHash = await digest(recovery);
		const result = await database.batch([
			database.insert(users).select(
				database
					.select({
						id: sql<string>`${id}`.as('id'),
						email: invitations.email,
						name: sql<string>`${data.name}`.as('name'),
						access_role: invitations.role,
						phone: sql<string>`${data.phone}`.as('phone'),
						location: sql<string>`''`.as('location'),
						headline: sql<string>`''`.as('headline'),
						bio: sql<string>`''`.as('bio'),
						skills: sql<string>`'[]'`.as('skills'),
						account_status: sql<'active'>`'active'`.as('account_status'),
						password_hash: sql<string>`${passwordHash}`.as('password_hash'),
						recovery_hash: sql<string>`${recoveryHash}`.as('recovery_hash'),
						role: sql<'client'>`'client'`.as('role'),
						timezone: sql<string>`${data.timezone}`.as('timezone'),
						created_at: sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ','now')`.as('created_at')
					})
					.from(invitations)
					.where(
						and(
							eq(invitations.id, invite.id),
							isNull(invitations.accepted_at),
							isNull(invitations.revoked_at),
							gt(invitations.expires_at, Date.now())
						)
					)
			),
			database
				.update(invitations)
				.set({ accepted_at: new Date().toISOString(), accepted_by: id })
				.where(and(eq(invitations.id, invite.id), sql`changes()=1`))
		]);
		if (!result[0].meta.changes) error(409, 'This invitation has already been used.');
		await session(event, id);
		return json({ ok: true, recovery_key: recovery }, { status: 201 });
	}
	if (action === 'forgot-password') {
		const { email } = z.object({ email: emailSchema }).parse(body);
		await rateLimit(event, `reset:${email}`, 3);
		const user = await database
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.email, email), eq(users.account_status, 'active')))
			.get();
		if (user) {
			const raw = token(),
				id = crypto.randomUUID();
			await database.insert(passwordResets).values({
				id,
				user_id: user.id,
				token_hash: await digest(raw),
				expires_at: Date.now() + 3600000
			});
			try {
				await sendAccountMail(event, email, 'reset', raw);
			} catch {
				await database.delete(passwordResets).where(eq(passwordResets.id, id));
				console.error(JSON.stringify({ event: 'password_reset_delivery_failed' }));
			}
		}
		return json({
			ok: true,
			message: 'If an active account matches that email, a reset link will arrive shortly.'
		});
	}
	const data = z.object({ token: rawSchema, password: passwordSchema }).parse(body);
	const record = await database
		.select({ id: passwordResets.id, user_id: passwordResets.user_id })
		.from(passwordResets)
		.innerJoin(users, eq(users.id, passwordResets.user_id))
		.where(
			and(
				eq(passwordResets.token_hash, await digest(data.token)),
				isNull(passwordResets.used_at),
				gt(passwordResets.expires_at, Date.now()),
				eq(users.account_status, 'active')
			)
		)
		.get();
	if (!record) error(410, 'This password reset link is invalid or has expired.');
	const recovery = token();
	const result = await database.batch([
		database
			.update(passwordResets)
			.set({ used_at: new Date().toISOString() })
			.where(
				and(
					eq(passwordResets.id, record.id),
					isNull(passwordResets.used_at),
					gt(passwordResets.expires_at, Date.now())
				)
			),
		database
			.update(users)
			.set({
				password_hash: await hashPassword(data.password),
				recovery_hash: await digest(recovery)
			})
			.where(and(eq(users.id, record.user_id), sql`changes()=1`)),
		database
			.update(passwordResets)
			.set({ used_at: new Date().toISOString() })
			.where(and(eq(passwordResets.user_id, record.user_id), sql`changes()=1`)),
		database.delete(sessions).where(and(eq(sessions.user_id, record.user_id), sql`changes()>0`))
	]);
	if (!result[0].meta.changes) error(409, 'This reset link has already been used.');
	await session(event, record.user_id);
	return json({ ok: true, recovery_key: recovery });
}
