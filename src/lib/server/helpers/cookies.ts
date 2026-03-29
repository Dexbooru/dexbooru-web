import type { Cookies } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY } from '$lib/server/constants/notifications';
import {
	SESSION_ID_COOKIE_OPTIONS,
	SESSION_ID_COOKIE_STANDARD_AGE,
	SESSION_ID_COOKIE_SUPER_AGE,
} from '../constants/cookies';

/** Expire the session cookie; must mirror SESSION_ID_COOKIE_OPTIONS or the browser keeps the cookie. */
export const clearSessionIdCookie = (cookies: Cookies): void => {
	cookies.set(SESSION_ID_KEY, '', {
		...SESSION_ID_COOKIE_OPTIONS,
		path: '/',
		maxAge: 0,
	});
};

/** Clear the notifications bridge cookie on logout (same host options as the main session). */
export const clearNotificationSessionCookie = (cookies: Cookies): void => {
	cookies.set(DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY, '', {
		...SESSION_ID_COOKIE_OPTIONS,
		path: '/',
		maxAge: 0,
	});
};

export const buildCookieOptions = (rememberMe: boolean): SerializeOptions => {
	return {
		path: '/',
		...SESSION_ID_COOKIE_OPTIONS,
		maxAge: rememberMe ? SESSION_ID_COOKIE_SUPER_AGE : SESSION_ID_COOKIE_STANDARD_AGE,
	};
};
