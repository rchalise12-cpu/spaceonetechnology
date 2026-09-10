import { json, redirect, type Handle } from '@sveltejs/kit';
import { digest } from '$lib/server/security';
import { database } from '$lib/server/database';
import { sessions, users } from '$lib/server/schema';
import { eq, and, gt } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	if (
		!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
		event.request.headers.get('origin') !== event.url.origin
	)
		return json({ message: 'Request origin is not allowed.' }, { status: 403 });
	const raw = event.cookies.get('space_session');
	if (raw && /^[a-f0-9]{64}$/.test(raw) && event.platform?.env.DB) {
		event.locals.user =
			(await database(event)
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.access_role,
					phone: users.phone,
					location: users.location,
					headline: users.headline,
					bio: users.bio,
					skills: users.skills,
					account_status: users.account_status,
					created_at: users.created_at,
					timezone: users.timezone
				})
				.from(sessions)
				.innerJoin(users, eq(users.id, sessions.user_id))
				.where(
					and(
						eq(sessions.token_hash, await digest(raw)),
						gt(sessions.expires_at, Date.now()),
						eq(users.account_status, 'active')
					)
				)
				.get()) ?? null;
		if (!event.locals.user) event.cookies.delete('space_session', { path: '/' });
	}
	const privatePage =
		/^\/(dashboard|jobs|candidates|imports|invitations|team|inquiries|admin|documents|interviews|settings)(?:\/|$)/.test(
			event.url.pathname
		);
	if (privatePage && !event.locals.user) redirect(303, '/client/login');
	if (
		/^\/(candidates|imports|invitations|inquiries|admin)(?:\/|$)/.test(event.url.pathname) &&
		event.locals.user?.role === 'client'
	)
		redirect(303, '/dashboard');
	if (event.url.pathname === '/team' && event.locals.user?.role !== 'admin')
		redirect(303, '/dashboard');
	const response = await resolve(event);
	if (
		privatePage ||
		event.url.pathname.startsWith('/client') ||
		event.url.pathname.startsWith('/api')
	)
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (event.url.protocol === 'https:')
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	if (!event.url.pathname.startsWith('/_app/'))
		response.headers.set('Cache-Control', 'private, no-store');
	return response;
};
