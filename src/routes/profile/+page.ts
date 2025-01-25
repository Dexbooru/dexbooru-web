import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.id !== NULLABLE_USER.id) {
		redirect(302, `/profile/${user.username}`);
	}

	redirect(302, '/');
};
