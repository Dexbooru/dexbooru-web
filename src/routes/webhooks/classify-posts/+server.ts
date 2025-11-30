import { handlePostClassificationResultWebhook } from "$lib/server/controllers/webhooks";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async (event) => {
    return await handlePostClassificationResultWebhook(event) as ReturnType<RequestHandler>;
}