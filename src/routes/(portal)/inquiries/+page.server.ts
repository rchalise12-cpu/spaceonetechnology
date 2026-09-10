import { loadApi } from '$lib/server/load-api';
import type { inquiries } from '$lib/server/schema';
export const load: import('./$types').PageServerLoad = (event) =>
	loadApi<{ inquiries: (typeof inquiries.$inferSelect)[] }>(event, 'inquiries');
