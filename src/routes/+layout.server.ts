import { PUBLIC_USER_SELECTORS } from '$lib/server/constants/users';
import { getUserNotificationsFromId } from '$lib/server/db/actions/notification';
import { findUserPreferences } from '$lib/server/db/actions/preference';
import { findUserById } from '$lib/server/db/actions/user';
import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const locals = event.locals;

	const user =
		locals.user.id === NULLABLE_USER.id
			? NULLABLE_USER
			: ((await findUserById(locals.user.id, PUBLIC_USER_SELECTORS)) ?? NULLABLE_USER);

	if (user.id === NULLABLE_USER.id) {
		event.cookies.set(SESSION_ID_KEY, '', {
			maxAge: 0,
			path: '/',
		});
	}

	const userPreferences =
		locals.user.id === NULLABLE_USER.id
			? NULLABLE_USER_USER_PREFERENCES
			: await findUserPreferences(locals.user.id);
	const userNotifications =
		locals.user.id === NULLABLE_USER.id ? null : await getUserNotificationsFromId(locals.user.id);

	return {
		user,
		userPreferences,
		userNotifications,
	};
};
