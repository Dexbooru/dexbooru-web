import type { CookieSerializeOptions } from 'cookie';

const SESSION_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const SESSION_ID_KEY = 'dexbooruSessionId';
export const SESSION_ID_COOKIE_OPTIONS: CookieSerializeOptions = {
	path: '/',
	secure: process.env.NODE_ENV === 'production',
	maxAge: SESSION_ID_COOKIE_MAX_AGE
};
