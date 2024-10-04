import type { IUserNotifications } from "$lib/shared/types/notifcations";
import type { RequestEvent } from "@sveltejs/kit";
import { PUBLIC_FRIEND_REQUEST_SELECTORS } from "../constants/friends";
import { findFriendRequests } from "../db/actions/friends";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import type { TRequestSchema } from "../types/controllers";

const GetNotificationsSchema = {

} satisfies TRequestSchema;

export const handleGetNotifications = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', GetNotificationsSchema,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async _ => {
            try {
                const userId = event.locals.user?.id ?? ''
                const friendRequests = await findFriendRequests(userId, PUBLIC_FRIEND_REQUEST_SELECTORS);
                const notificationData: IUserNotifications = {
                    friendRequests
                };

                return createSuccessResponse('api-route', `Successfully retrieved notifications for user id: ${userId}`, notificationData);
            } catch (error) {
                return createErrorResponse('api-route', 500, 'An unexpected error occured while fetching the user notifications');
            }
        },
        true,
    )
};
