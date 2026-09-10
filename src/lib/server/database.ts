import { drizzle } from 'drizzle-orm/d1';
import { error, type RequestEvent } from '@sveltejs/kit';
import * as schema from './schema';
export function database(event: Pick<RequestEvent, 'platform'>) {
	if (!event.platform?.env.DB) error(503, 'Database is not configured.');
	return drizzle(event.platform.env.DB, { schema });
}
