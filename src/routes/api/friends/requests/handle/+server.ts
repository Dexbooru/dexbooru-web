import { FRIEND_REQUEST_ACTIONS } from '$lib/server/constants/friends';
import { deleteFriendRequest } from '$lib/server/db/actions/friends';
import { createFriend, findUserById } from '$lib/server/db/actions/user';
import type { IFriendRequestHandleBody } from '$lib/shared/types/friends';
import { error, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to handle friend requests, without being a signed in user!'
		});
	}

	const { senderUserId, action }: IFriendRequestHandleBody = await request.json();

	if (!senderUserId || !action) {
		throw error(400, {
			message:
				'At least one of the fields for sending a friend request to another user was missing!'
		});
	}

	if (!action || !FRIEND_REQUEST_ACTIONS.includes(action)) {
		throw error(400, {
			message: `The action was invalid. It must be one of ${FRIEND_REQUEST_ACTIONS.join(', ')}`
		});
	}

	const senderUser = await findUserById(senderUserId);
	if (!senderUser) {
		throw error(400, { message: `A user with the id: ${senderUserId} does not exist!` });
	}

	const friendRequestRemoved = await deleteFriendRequest(locals.user.id, senderUserId);
	if (!friendRequestRemoved) {
		throw error(400, {
			message: 'There was an error while handling the friend request removal!'
		});
	}

	if (action === 'accept') {
		const userFriendshipCreated = await createFriend(locals.user.id, senderUserId);
		if (!userFriendshipCreated) {
			throw error(400, { message: 'There was an error while creating the friendship!' });
		}
	}

	return new Response(
		JSON.stringify({
			message: `Successfully ${
				action === 'accept' ? 'accepted' : 'declined'
			} friendship request from ${senderUser.username}`
		})
	);
};
