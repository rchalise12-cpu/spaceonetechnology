import { candidateDetail } from '$lib/server/operations';
export const load: import('./$types').PageServerLoad = (event) =>
	candidateDetail(event, event.params.id);
