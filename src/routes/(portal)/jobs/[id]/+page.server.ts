import { details } from '$lib/server/jobs';
import { candidateRows } from '$lib/server/operations';
export const load: import('./$types').PageServerLoad = async (event) => ({
	...(await details(event, event.params.id)),
	candidates: event.locals.user?.role !== 'client' ? await candidateRows(event) : []
});
