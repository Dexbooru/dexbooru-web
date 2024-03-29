import type { CookieSerializeOptions } from 'cookie';

export const SESSION_ID_COOKIE_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_ID_COOKIE_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_EXPIRES_IN_STANDARD_AGE = '7d';
export const SESSION_JWT_EXPIRES_IN_SUPER_AGE = '21d';

export const SESSION_ID_KEY = 'user-session-data';
export const SESSION_ID_COOKIE_OPTIONS: CookieSerializeOptions = {
	path: '/',
	sameSite: 'strict',
	secure: process.env.NODE_ENV === 'production',
	maxAge: SESSION_ID_COOKIE_STANDARD_AGE
};
