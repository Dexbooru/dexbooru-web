import { getChatRooms } from '$lib/client/api/coreApi';
import type { ICoreApiResponse, TChatRoom } from '$lib/client/types/core';
import { findFriendsForUser } from '$lib/server/db/actions/friend';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	if (locals.user.id === NULLABLE_USER.id) {
		redirect(302, '/');
	}

	const friends = await findFriendsForUser(locals.user.id);
	const chatRoomsResponse = await getChatRooms(cookies);
	const responseData: ICoreApiResponse<TChatRoom[]> = await chatRoomsResponse.json();
	const { data: chatRooms = [] } = responseData;

	return {
		user: locals.user,
		friends,
		chatRooms,
	};
};
