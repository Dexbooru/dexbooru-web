import { checkIfUserIsFriended } from '$lib/server/db/actions/friends';
import { checkIfUsersAreFriends, findUserByName } from '$lib/server/db/actions/user';
import type { TFriendStatus } from '$lib/shared/types/friends';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	const targetUsername = params.username;
	let friendStatus: TFriendStatus = 'not-friends';

	if (user && user.username === targetUsername) {
		return {
			targetUser: user,
			friendStatus: 'is-self' as TFriendStatus
		};
	}

	const targetUser = await findUserByName(targetUsername);
	if (!targetUser) {
		throw error(404, { message: `A user named ${targetUsername} does not exist!` });
	}

	const friendRequestPending = user ? await checkIfUserIsFriended(user.id, targetUser.id) : false;
	if (friendRequestPending) {
		friendStatus = 'request-pending';
	} else {
		const areFriends = user ? await checkIfUsersAreFriends(user.id, targetUser.id) : false;
		if (areFriends) {
			friendStatus = 'are-friends';
		}
	}

	return {
		targetUser,
		friendStatus: friendStatus as TFriendStatus
	};
};
