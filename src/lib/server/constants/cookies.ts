import { dev } from '$app/environment';

export const SESSION_ID_COOKIE_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_ID_COOKIE_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_EXPIRES_IN_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_JWT_EXPIRES_IN_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_API_ENDPOINT_AGE = 60 * 2;

export const SESSION_ID_COOKIE_OPTIONS = {
	path: '/',
	sameSite: 'strict',
	secure: !dev,
	maxAge: SESSION_ID_COOKIE_STANDARD_AGE,
	httpOnly: true,
};
