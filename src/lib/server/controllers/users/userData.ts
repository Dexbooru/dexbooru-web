import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { UUID_REGEX } from '$lib/shared/constants/search';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { TUser } from '$lib/shared/types/users';
import {
	findUserById,
	findUserByName,
	findUserSelf,
	getUserStatistics,
	checkIfUsersAreFriends,
} from '../../db/actions/user';
import { checkIfUserIsFriended } from '../../db/actions/friend';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { PUBLIC_USER_SELECTORS } from '../../constants/users';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GetUserSchema } from '../request-schemas/users';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetSelfData = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		{},
		async (_) => {
			try {
				const user = await findUserSelf(event.locals.user.id);
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				return createSuccessResponse('api-route', 'Successfully fetched the user data', { user });
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to fetch the user data',
				);
			}
		},
		true,
	);
};

export const handleGetUser = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetUserSchema, async (data) => {
		const user = event.locals.user;
		const targetUsername = data.pathParams.username;

		try {
			let friendStatus: TFriendStatus = 'not-friends';

			const dbFinderFn = UUID_REGEX.test(targetUsername) ? findUserById : findUserByName;

			const targetUser = (await dbFinderFn(targetUsername, {
				...PUBLIC_USER_SELECTORS,
				updatedAt: true,
				linkedAccounts: {
					select: {
						id: true,
						platform: true,
						platformUsername: true,
						isPublic: true,
					},
				},
			})) as Partial<TUser>;

			if (!targetUser) {
				const errorResponse = createErrorResponse(
					handlerType,
					404,
					`A user named ${targetUsername} does not exist!`,
				);
				if (handlerType === 'page-server-load') throw errorResponse;

				return errorResponse;
			}

			if (targetUser.id !== user.id) {
				delete targetUser.email;
				delete targetUser.updatedAt;
			}

			const isSelf = event.locals.user.id === targetUser.id;
			const linkedAccounts = (targetUser.linkedAccounts ?? []).filter(
				(account) => isSelf || account.isPublic,
			);

			const friendRequestPending =
				user.id !== NULLABLE_USER.id
					? await checkIfUserIsFriended(user.id, targetUser.id ?? '')
					: false;
			if (friendRequestPending) {
				friendStatus = 'request-pending';
			} else {
				const areFriends =
					user.id !== NULLABLE_USER.id
						? await checkIfUsersAreFriends(user.id, targetUser.id ?? '')
						: false;
				if (areFriends) {
					friendStatus = 'are-friends';
				}
			}

			const userStatistics = await getUserStatistics(targetUser.id ?? '');

			return createSuccessResponse(
				handlerType,
				`Successfully fetched user profile details for ${targetUsername}`,
				{
					targetUser,
					friendStatus: (user.id !== NULLABLE_USER.id
						? friendStatus
						: 'irrelevant') as TFriendStatus,
					userStatistics,
					linkedAccounts,
				},
			);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occured while trying to fetch the user profile details',
			);
		}
	});
};
