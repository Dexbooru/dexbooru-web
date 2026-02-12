import { handleGetAnalytics } from '$lib/server/controllers/analytics';
import type { TAnalyticsData } from '$lib/shared/types/analytics.js';

export const load = async (event) => {
	return (await handleGetAnalytics(event, 'page-server-load')) as TAnalyticsData;
};
