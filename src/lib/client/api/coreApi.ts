import { DEXBOORU_CORE_API_URL } from "$lib/shared/constants/chat";
import { getCoreApiAuthHeaders } from "../helpers/auth";

export const createChatRoom = async (receiverUserId: string) => {
    const headers = getCoreApiAuthHeaders();
    const response = await fetch(`${DEXBOORU_CORE_API_URL}/api/auth/chat/rooms`, {
        method: "POST",
        headers,
        body: JSON.stringify({ receiverUserId }),
    });
    return response;
};