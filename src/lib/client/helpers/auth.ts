import { page as pageStore } from '$app/stores';
import { LOGGED_OUT_URL_PARAM_NAME, SESSION_ID_KEY } from '$lib/shared/constants/session';
import { get } from 'svelte/store';

export const clearToken = () => {
	const page = get(pageStore);
	const searchParams = page.url.searchParams;

	const loggedOut = searchParams.get(LOGGED_OUT_URL_PARAM_NAME) === 'true';
	if (loggedOut) {
		localStorage.removeItem(SESSION_ID_KEY);
	}
};

export const storeToken = () => {
	const page = get(pageStore);
	const searchParams = page.url.searchParams;

	const token = searchParams.get(SESSION_ID_KEY);
	if (!token) return;

	localStorage.setItem(SESSION_ID_KEY, token);
	history.replaceState(null, '', page.url.pathname);
};

export const getCoreApiAuthHeaders = (): HeadersInit => {
	const token = localStorage.getItem(SESSION_ID_KEY);
	if (!token) return {};

	return {
		Authorization: `Bearer ${token}`
	};
};
