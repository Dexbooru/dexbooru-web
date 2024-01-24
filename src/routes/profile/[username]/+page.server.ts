import { findUserByName } from '$lib/server/db/actions/user';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	const targetUsername = params.username;

	if (user && user.username === targetUsername) {
		return {
			targetUser: user,
			viewingSelf: true
		};
	}

	const targetUser = await findUserByName(targetUsername);
	if (!targetUser) {
		throw error(404, { message: `A user named ${targetUsername} does not exist!` });
	}

	return {
		targetUser,
		viewingSelf: false
	};
};
