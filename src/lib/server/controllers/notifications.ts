import type { IUserNotifications } from "$lib/shared/types/notifcations";
import type { RequestEvent } from "@sveltejs/kit";
import { PUBLIC_FRIEND_REQUEST_SELECTORS } from "../constants/friends";
import { findFriendRequests } from "../db/actions/friends";
import { createSuccessResponse } from "../helpers/controllers";
import { parseUser } from "../helpers/users";

export const getNotifications = async ({ locals }: RequestEvent) => {
    const user = parseUser(locals)
    const friendRequests = await findFriendRequests(user?.id ?? '', PUBLIC_FRIEND_REQUEST_SELECTORS);

    const notificationData: IUserNotifications = {
        friendRequests
    };

    return createSuccessResponse('api-route', `Successfully retrieved notifications for user id: ${user?.id ?? ''}`, notificationData);
}