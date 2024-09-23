import { handleGetPosts } from "$lib/server/controllers/posts";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (request) => {
    return await handleGetPosts(request, 'api-route') as ReturnType<RequestHandler>;
};