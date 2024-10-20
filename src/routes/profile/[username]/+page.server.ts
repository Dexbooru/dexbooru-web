import { handleGetUser } from '$lib/server/controllers/users';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { TUser, TUserStatistics } from '$lib/shared/types/users';
import type { PageServerLoad } from './$types';

type UserResponse = {
	targetUser: TUser;
	friendStatus: TFriendStatus;
	userStatistics: TUserStatistics;
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetUser(event, 'page-server-load')) as UserResponse;
};
