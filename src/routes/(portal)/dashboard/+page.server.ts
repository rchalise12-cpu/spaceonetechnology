import { dashboard } from '$lib/server/operations';
import { listJobs, interviews } from '$lib/server/jobs';
import { taskRows } from '$lib/server/workspace';
export const load: import('./$types').PageServerLoad = async (event) => ({
	...(await dashboard(event)),
	jobs: await listJobs(event),
	interviews: await interviews(event),
	tasks: await taskRows(event)
});
