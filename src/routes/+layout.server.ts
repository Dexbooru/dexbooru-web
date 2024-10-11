import { getUserPreferences } from '$lib/server/db/actions/preferences';
import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const userPreferences =
		locals.user.id === NULLABLE_USER.id
			? NULLABLE_USER_USER_PREFERENCES
			: (await getUserPreferences(locals.user.id)) ?? NULLABLE_USER_USER_PREFERENCES;

	return {
		user: locals.user,
		userPreferences,
	};
};
