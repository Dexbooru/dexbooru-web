import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import {
	createFriendRequest,
	deleteFriendRequest,
	findAllUserFriendRequests,
	findFriendsForUser,
} from '../db/actions/friend';
import { createFriend, deleteFriend, findUserByName } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

const CreateFriendRequestSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
} satisfies TRequestSchema;

const DeleteFriendRequestSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
	urlSearchParams: z.object({
		action: z.union([z.literal('accept'), z.literal('reject')]),
	}),
} satisfies TRequestSchema;

const DeleteFriendSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
} satisfies TRequestSchema;

export const handleGetFriendData = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		{} as TRequestSchema,
		async (_) => {
			const user = event.locals.user;

			try {
				const friends = await findFriendsForUser(user.id);
				const { sentFriendRequests, receivedFriendRequests } = await findAllUserFriendRequests(
					user.id,
				);

				return createSuccessResponse(handlerType, 'Fetched the friend data successfully', {
					friends,
					sentFriendRequests,
					receivedFriendRequests,
				});
			} catch {
				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while trying to get the friend data',
				);
			}
		},
		true,
	);
};

export const handleDeleteFriend = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteFriendSchema,
		async (data) => {
			const friendUsername = data.pathParams.username;
			const user = event.locals.user;

			try {
				const friendUser = await findUserByName(friendUsername, { id: true });
				if (!friendUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${friendUsername} does not exist`,
					);
				}

				const deletedFriend = await deleteFriend(user.id, friendUser.id);
				if (!deletedFriend) {
					return createErrorResponse(
						'api-route',
						409,
						`There was no relationship between ${user.id} and ${friendUser.id} found`,
					);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully unfriended the user with the id: ${friendUsername}`,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to delete the friend',
				);
			}
		},
		true,
	);
};

export const handleFriendRequest = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteFriendRequestSchema,
		async (data) => {
			const senderUsername = data.pathParams.username;
			const requestAction = data.urlSearchParams.action;
			const user = event.locals.user;

			try {
				const senderUser = await findUserByName(senderUsername, { id: true });
				if (!senderUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${senderUsername} does not exist`,
					);
				}

				const deletedFriendRequest = await deleteFriendRequest(user.id, senderUser.id);
				if (!deletedFriendRequest) {
					return createErrorResponse(
						'api-route',
						409,
						`There exists no friend request connection between ${user.id} and ${senderUser.id}`,
					);
				}

				if (requestAction === 'accept') {
					await createFriend(user.id, senderUser.id);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully ${
						requestAction === 'accept' ? 'accepted' : 'declined'
					} friendship request from ${senderUsername}`,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while handling the friend request',
				);
			}
		},
		true,
	);
};

export const handleSendFriendRequest = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateFriendRequestSchema,
		async (data) => {
			const receiverUsername = data.pathParams.username;
			const user = event.locals.user;

			try {
				const receiverUser = await findUserByName(receiverUsername, { username: true, id: true });
				if (!receiverUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${receiverUsername} does not exist`,
					);
				}

				if (user.id === receiverUser.id) {
					return createErrorResponse(
						'api-route',
						409,
						'You cannot send a friend request to yourself',
					);
				}

				const newFriendRequest = await createFriendRequest(user.id, receiverUser.id);
				return createSuccessResponse(
					'api-route',
					`Successfully sent the friend request to ${receiverUsername}`,
					{ friendRequest: newFriendRequest },
					201,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to send the friend request',
				);
			}
		},
		true,
	);
};
