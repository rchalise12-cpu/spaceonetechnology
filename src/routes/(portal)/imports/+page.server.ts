import { loadApi } from '$lib/server/load-api';
import type { importBatches } from '$lib/server/schema';
export const load: import('./$types').PageServerLoad = (event) =>
	loadApi<{ batches: (typeof importBatches.$inferSelect)[] }>(event, 'imports');
