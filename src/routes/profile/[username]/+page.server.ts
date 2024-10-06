import { handleGetUser } from '$lib/server/controllers/users';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { IUser } from '$lib/shared/types/users';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetUser(event, 'page-server-load')) as {
		targetUser: IUser;
		friendStatus: TFriendStatus;
	};
};
