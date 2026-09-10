import { invitationInfo } from '$lib/server/account';
export const load: import('./$types').PageServerLoad = async (event) => ({
	invite: await invitationInfo(event),
	token: event.url.searchParams.get('token') || ''
});
