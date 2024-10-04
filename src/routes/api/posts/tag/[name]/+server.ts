import { handleGetPostsWithTagName } from "$lib/server/controllers/posts";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
    return await handleGetPostsWithTagName(event, 'api-route') as ReturnType<RequestHandler>;
}