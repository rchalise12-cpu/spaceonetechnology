import { loadApi } from '$lib/server/load-api';
import type { userColumns } from '$lib/server/operations';
import type { User } from '$lib/types';
export const load: import('./$types').PageServerLoad = (event) =>
	loadApi<{
		users: User[];
		audit: {
			id: string;
			action: string;
			target_id: string;
			detail: string;
			created_at: string;
			actor: string | null;
		}[];
	}>(event, 'team');
