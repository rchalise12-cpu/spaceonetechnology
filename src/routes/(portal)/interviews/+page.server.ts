import { interviews } from '$lib/server/jobs';
export const load: import('./$types').PageServerLoad = async (event) => ({
	interviews: await interviews(event)
});
