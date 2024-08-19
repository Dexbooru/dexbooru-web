import { findFriendsForUser } from "$lib/server/db/actions/friends";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "../$types";

export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/');
    }

    const friends = await findFriendsForUser(locals.user.id);
    return {
        user: locals.user,
        friends
    };
};