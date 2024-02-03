import { createFriendRequest } from '$lib/server/db/actions/friends';
import { findUserById } from '$lib/server/db/actions/user';
import type { IFriendRequestSendBody } from '$lib/shared/types/friends';
import { error, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to send friend requests, without being a signed in user!'
		});
	}

	const { receiverUserId }: IFriendRequestSendBody = await request.json();
	if (!receiverUserId) {
		throw error(400, {
			message:
				'At least one of the fields for sending a friend request to another user was missing!'
		});
	}

	const receiverUser = await findUserById(receiverUserId, { id: true, username: true });
	if (!receiverUser) {
		throw error(400, { message: 'A user with the following receiver id does not exist!' });
	}

	const sentFriendRequest = await createFriendRequest(locals.user.id, receiverUserId);
	if (!sentFriendRequest) {
		throw error(400, { message: 'An unexpected error occured while sending the friend request!' });
	}

	return new Response(
		JSON.stringify({
			message: `Successfully sent a friend request to the user with id: ${receiverUserId} and username: ${receiverUser.username}`
		})
	);
};
