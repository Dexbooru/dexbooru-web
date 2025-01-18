import { getUserNotificationsFromId } from '$lib/server/db/actions/notifications';
import { getUserPreferences } from '$lib/server/db/actions/preferences';
import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const locals = event.locals;
	const userPreferences =
		locals.user.id === NULLABLE_USER.id
			? NULLABLE_USER_USER_PREFERENCES
			: ((await getUserPreferences(locals.user.id)) ?? NULLABLE_USER_USER_PREFERENCES);
	const userNotifications =
		locals.user.id === NULLABLE_USER.id ? null : await getUserNotificationsFromId(locals.user.id);

	return {
		user: locals.user,
		userPreferences,
		userNotifications,
	};
};
