import { DEXBOORU_CORE_API_URL } from '$lib/shared/constants/chat';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { Cookies } from '@sveltejs/kit';
import { getApiAuthHeaders } from '../helpers/auth';

export const createChatRoom = async (receiverUserId: string) => {
	const response = await fetch(`${DEXBOORU_CORE_API_URL}/api/auth/chat/rooms`, {
		method: 'POST',
		body: JSON.stringify({ receiverUserId }),
	});
	return response;
};

export const getChatRooms = async (cookies?: Cookies) => {
	const headers = cookies
		? { Authorization: `Bearer ${cookies.get(SESSION_ID_KEY)}` }
		: getApiAuthHeaders();
	const response = await fetch(`${DEXBOORU_CORE_API_URL}/api/auth/chat/rooms`, {
		method: 'GET',
		headers,
	});
	return response;
};
