import { loadApi } from '$lib/server/load-api';
import type { invitations } from '$lib/server/schema';
export const load: import('./$types').PageServerLoad = (event) =>
	loadApi<{
		invitations: Omit<
			typeof invitations.$inferSelect,
			'token_hash' | 'created_by' | 'accepted_by'
		>[];
	}>(event, 'invitations');
