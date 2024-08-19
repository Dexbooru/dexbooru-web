import { redirect } from "@sveltejs/kit";
import { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        throw redirect(302, '/');
    }

    const { chatId } = params;
    // call core api endpoint

    return {
        chatId
    };
};