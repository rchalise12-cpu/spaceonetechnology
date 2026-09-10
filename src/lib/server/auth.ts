import { error, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import {
	db,
	digest,
	hashPassword,
	rateLimit,
	requireUser,
	session,
	token,
	verifyPassword
} from './security';
import { users, sessions, rateLimits, passwordResets } from './schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { phoneSchema } from './account';
import { emailSchema, passwordSchema, timezoneSchema } from './schemas';

export async function auth(event: RequestEvent, action: string, body: unknown) {
	const database = db(event);
	const ip = event.request.headers.get('cf-connecting-ip') || 'local';
	await rateLimit(event, `auth-ip:${ip}`, 30);
	if (action === 'logout') {
		const raw = event.cookies.get('space_session');
		if (raw) await database.delete(sessions).where(eq(sessions.token_hash, await digest(raw)));
		event.cookies.delete('space_session', { path: '/' });
		return json({ ok: true });
	}
	if (action === 'signup') {
		if (String(event.platform!.env.ALLOW_PUBLIC_SIGNUP) === 'false')
			error(403, 'Registration is by invitation. Please contact Space One.');
		const data = z
			.object({
				name: z.string().trim().min(2).max(100),
				phone: phoneSchema,
				email: emailSchema,
				password: passwordSchema,
				timezone: timezoneSchema.default('America/Denver')
			})
			.parse(body);
		await rateLimit(event, `signup:${ip}`, 5);
		const recovery = token();
		const id = crypto.randomUUID();
		const passwordHash = await hashPassword(data.password);
		try {
			await database.insert(users).values({
				id,
				name: data.name,
				phone: data.phone,
				email: data.email,
				password_hash: passwordHash,
				recovery_hash: await digest(recovery),
				timezone: data.timezone
			});
		} catch (e) {
			if (
				String(e).includes('UNIQUE') ||
				(e instanceof Error && String(e.cause).includes('UNIQUE'))
			)
				error(409, 'Unable to create this account. Try signing in or recovering access.');
			throw e;
		}
		await session(event, id);
		return json({ ok: true, recovery_key: recovery }, { status: 201 });
	}
	if (action === 'login') {
		const data = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).parse(body);
		await rateLimit(event, `login:${data.email}`, 10);
		const user = await database
			.select({ id: users.id, password_hash: users.password_hash })
			.from(users)
			.where(and(eq(users.email, data.email), eq(users.account_status, 'active')))
			.get();
		// Equivalent password work for unknown users avoids a cheap timing oracle.
		const hash = user?.password_hash || `scrypt:16384:8:5:${'0'.repeat(64)}:${'0'.repeat(64)}`;
		if (!(await verifyPassword(data.password, hash)) || !user)
			error(401, 'Email or password is incorrect.');
		await session(event, user.id);
		await database.batch([
			database.delete(sessions).where(lt(sessions.expires_at, Date.now())),
			database.delete(rateLimits).where(lt(rateLimits.expires_at, Date.now()))
		]);
		return json({ ok: true });
	}
	if (action === 'recover') {
		const data = z
			.object({
				email: emailSchema,
				recovery_key: z.string().regex(/^[a-f0-9]{64}$/),
				password: passwordSchema
			})
			.parse(body);
		await rateLimit(event, `recover:${data.email}`, 5);
		const oldHash = await digest(data.recovery_key);
		const user = await database
			.select({ id: users.id })
			.from(users)
			.where(
				and(
					eq(users.email, data.email),
					eq(users.recovery_hash, oldHash),
					eq(users.account_status, 'active')
				)
			)
			.get();
		if (!user) error(400, 'The email or recovery key is incorrect.');
		const recovery = token();
		// CAS plus conditional session deletion makes the recovery key single-use, even with concurrent requests.
		const results = await database.batch([
			database
				.update(users)
				.set({
					password_hash: await hashPassword(data.password),
					recovery_hash: await digest(recovery)
				})
				.where(
					and(
						eq(users.id, user.id),
						eq(users.recovery_hash, oldHash),
						eq(users.account_status, 'active')
					)
				),
			database.delete(sessions).where(and(eq(sessions.user_id, user.id), sql`changes()=1`))
		]);
		if (!results[0].meta.changes) error(409, 'This recovery key has already been used.');
		await database
			.update(passwordResets)
			.set({ used_at: new Date().toISOString() })
			.where(eq(passwordResets.user_id, user.id));
		await session(event, user.id);
		return json({ ok: true, recovery_key: recovery });
	}
	if (action === 'password') {
		const user = requireUser(event);
		const data = z
			.object({ current_password: z.string().max(128), password: passwordSchema })
			.parse(body);
		await rateLimit(event, `password:${user.id}`, 5);
		const stored = await database
			.select({ password_hash: users.password_hash })
			.from(users)
			.where(eq(users.id, user.id))
			.get();
		if (!stored || !(await verifyPassword(data.current_password, stored.password_hash)))
			error(400, 'Current password is incorrect.');
		await database.batch([
			database
				.update(users)
				.set({ password_hash: await hashPassword(data.password) })
				.where(eq(users.id, user.id)),
			database.delete(sessions).where(eq(sessions.user_id, user.id)),
			database
				.update(passwordResets)
				.set({ used_at: new Date().toISOString() })
				.where(eq(passwordResets.user_id, user.id))
		]);
		await session(event, user.id);
		return json({ ok: true });
	}
	if (action === 'recovery-key') {
		const user = requireUser(event);
		const data = z.object({ password: z.string().max(128) }).parse(body);
		await rateLimit(event, `recovery-key:${user.id}`, 5);
		const stored = await database
			.select({ password_hash: users.password_hash })
			.from(users)
			.where(eq(users.id, user.id))
			.get();
		if (!stored || !(await verifyPassword(data.password, stored.password_hash)))
			error(400, 'Password is incorrect.');
		const recovery = token();
		await database
			.update(users)
			.set({ recovery_hash: await digest(recovery) })
			.where(eq(users.id, user.id));
		return json({ recovery_key: recovery });
	}
	error(404, 'Endpoint not found.');
}
