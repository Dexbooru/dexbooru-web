import { MAXIMUM_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { checkIfUserIsFriended } from '$lib/server/db/actions/friends';
import { findPostsByAuthorId } from '$lib/server/db/actions/post';
import { checkIfUsersAreFriends, findLikedPostsFromSubset, findUserByName } from '$lib/server/db/actions/user';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params, url }) => {
	const { user } = await parent();
	const targetUsername = params.username;
	let friendStatus: TFriendStatus = 'not-friends';


	if (user && user.username === targetUsername) {
		return {
			posts: [],
			likedPosts: [],
			ascending: false,
			pageNumber: 0,
			targetUser: user,
			orderBy: 'createdAt' as TPostOrderByColumn,
			friendStatus: 'is-self' as TFriendStatus
		};
	}

	const targetUser = await findUserByName(targetUsername);
	if (!targetUser) {
		throw error(404, { message: `A user named ${targetUsername} does not exist!` });
	}

	const { convertedAscending, convertedPageNumber, orderBy } = processPostPageParams(
		url.searchParams
	);

	const posts =
		(await findPostsByAuthorId(
			convertedPageNumber,
			MAXIMUM_POSTS_PER_PAGE,
			targetUser.id,
			orderBy as TPostOrderByColumn,
			convertedAscending,
			PUBLIC_POST_SELECTORS
		)) || [];

	const likedPosts = user ? await findLikedPostsFromSubset(user.id, posts) : [];

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
		friendStatus: friendStatus as TFriendStatus,
		posts,
		likedPosts,
		ascending: convertedAscending,
		pageNumber: convertedPageNumber,
		orderBy: orderBy as TPostOrderByColumn,
	};
};
