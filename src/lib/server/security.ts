import { error, type RequestEvent } from '@sveltejs/kit';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { database } from './database';
import { sessions, rateLimits } from './schema';
import { sql } from 'drizzle-orm';

export const token = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value: string) {
	return bytesToHex(
		new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
	);
}
export async function hashPassword(password: string, salt = token()) {
	// OWASP's 16 MiB scrypt option. Bounded memory fits Workers; p=5 raises work factor.
	const hash = await scryptAsync(password, salt, { N: 16384, r: 8, p: 5, dkLen: 32 });
	return `scrypt:16384:8:5:${salt}:${bytesToHex(hash)}`;
}
export async function verifyPassword(password: string, stored: string) {
	const parts = stored.split(':');
	if (parts.length !== 6 || parts.slice(0, 4).join(':') !== 'scrypt:16384:8:5') return false;
	const computed = (await hashPassword(password, parts[4])).split(':')[5];
	const a = hexToBytes(computed);
	const b = hexToBytes(parts[5]);
	let difference = a.length ^ b.length;
	for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
	return difference === 0;
}
export const db = database;
export function requireUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Please sign in to continue.');
	return event.locals.user;
}
export function requireOperator(event: RequestEvent) {
	const user = requireUser(event);
	if (user.role === 'client') error(403, 'Staff access is required.');
	return user;
}
export function requireAdmin(event: RequestEvent) {
	const user = requireUser(event);
	if (user.role !== 'admin') error(403, 'Administrator access is required.');
	return user;
}
export async function session(event: RequestEvent, userId: string) {
	const raw = token();
	await db(event)
		.insert(sessions)
		.values({
			token_hash: await digest(raw),
			user_id: userId,
			expires_at: Date.now() + 14 * 86400000
		});
	event.cookies.set('space_session', raw, {
		path: '/',
		httpOnly: true,
		secure: event.url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 14 * 86400
	});
}
export async function rateLimit(
	event: RequestEvent,
	scope: string,
	limit: number,
	windowSeconds = 900
) {
	const key = await digest(scope);
	const now = Date.now();
	const [result] = await db(event)
		.insert(rateLimits)
		.values({ key, count: 1, expires_at: now + windowSeconds * 1000 })
		.onConflictDoUpdate({
			target: rateLimits.key,
			set: {
				count: sql`CASE WHEN ${rateLimits.expires_at} <= ${now} THEN 1 ELSE ${rateLimits.count}+1 END`,
				expires_at: sql`CASE WHEN ${rateLimits.expires_at} <= ${now} THEN ${now + windowSeconds * 1000} ELSE ${rateLimits.expires_at} END`
			}
		})
		.returning({ count: rateLimits.count });
	if (!result || result.count > limit)
		error(429, 'Too many attempts. Please try again in 15 minutes.');
}
export async function boundedBody(request: Request, limit: number) {
	if (Number(request.headers.get('content-length')) > limit)
		error(413, 'This upload is too large.');
	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	let size = 0;
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > limit) {
			await reader.cancel();
			error(413, 'This upload is too large.');
		}
		chunks.push(value);
	}
	const result = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
}
