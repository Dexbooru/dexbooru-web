import { NULLABLE_USER } from '$lib/shared/constants/auth';

export const parseUser = (locals: App.Locals) => {
	if (locals.user.id === NULLABLE_USER.id) {
		return null;
	}

	return locals.user;
};
