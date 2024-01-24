import { SESSION_ID_KEY } from '$lib/server/auth/cookies';
import { PUBLIC_USER_SELECTORS, findUserBySessionId } from '$lib/server/db/actions/user';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get(SESSION_ID_KEY);
	const authenticatedUser = sessionId
		? await findUserBySessionId(sessionId, PUBLIC_USER_SELECTORS)
		: null;

	return {
		user: authenticatedUser
	};
};
