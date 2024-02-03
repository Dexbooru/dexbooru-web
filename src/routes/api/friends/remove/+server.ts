import { deleteFriend, findUserById } from '$lib/server/db/actions/user';
import type { IFriendRemoveBody } from '$lib/shared/types/friends';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(400, {
			message: 'You are not authorized to unfriend a user without being a signed in user!'
		});
	}

	const { receiverUserId }: IFriendRemoveBody = await request.json();
	if (!receiverUserId) {
		throw error(400, { message: 'At least one of the required fields was missing!' });
	}

	const receiverUser = await findUserById(receiverUserId);
	if (!receiverUser) {
		throw error(400, { message: `A user with the id: ${receiverUserId} does not exist!` });
	}

	const friendshipsDeleted = await deleteFriend(locals.user.id, receiverUserId);
	if (!friendshipsDeleted) {
		throw error(400, { message: 'An error occured while trying to unfriend this user!' });
	}

	return new Response(
		JSON.stringify({ message: `Successfully unfriended the user with the id: ${receiverUserId}` })
	);
};
