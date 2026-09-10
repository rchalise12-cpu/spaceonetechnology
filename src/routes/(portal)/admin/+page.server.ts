import { requireOperator } from '$lib/server/security';
export const load: import('./$types').PageServerLoad = async (event) => {
	requireOperator(event);
	const response = await event.fetch('/api/admin/overview');
	if (!response.ok) throw new Error('Could not load administration.');
	return {
		overview: (await response.json()) as {
			jobs: import('$lib/types').Job[];
			users: import('$lib/types').User[];
			assignments: { job_id: string; user_id: string }[];
			applications: {
				id: string;
				user_id: string;
				job_id: string;
				status: import('$lib/types').Status;
				title: string;
				company: string;
				name: string;
				email: string;
				updated_at: string;
			}[];
		}
	};
};
