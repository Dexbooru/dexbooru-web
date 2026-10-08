import { getApplicationConfiguration } from '$lib/server/applicationConfiguration';
import { listAvailableSauceNaoIndexes } from '$lib/server/db/actions/sauceNaoIndex';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const parentData = await event.parent();
	if (parentData.user.id === NULLABLE_USER.id) {
		redirect(302, '/login');
	}

	if (parentData.user.role !== 'OWNER') {
		redirect(302, '/');
	}

	const [applicationConfiguration, sauceNaoIndexes] = await Promise.all([
		getApplicationConfiguration(),
		listAvailableSauceNaoIndexes(),
	]);

	return {
		applicationConfiguration,
		sauceNaoIndexes,
	};
};
