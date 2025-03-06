import { handleGetModerationDashboard } from '$lib/server/controllers/moderation';
import type { TModerationPaginationData } from '$lib/shared/types/moderation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return await handleGetModerationDashboard(event) as TModerationPaginationData;
};
