import { handleGetFriendData } from '$lib/server/controllers/friends';
import type { TFriendData } from '$lib/shared/types/friends';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetFriendData(event, 'page-server-load')) as TFriendData;
};
