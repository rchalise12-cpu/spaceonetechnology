import { listJobs, interviews } from '$lib/server/jobs';
export const load: import('./$types').PageServerLoad = async (event) => ({
	jobs: await listJobs(event),
	interviews: await interviews(event)
});
