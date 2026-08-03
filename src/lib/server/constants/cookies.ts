import { dev } from '$app/environment';
import { DOMAIN as APP_DOMAIN } from '$lib/server/runtimeEnv';

export type CookieSerializeOptions = {
	path?: string;
	sameSite?: boolean | 'strict' | 'lax' | 'none';
	secure?: boolean;
	maxAge?: number;
	httpOnly?: boolean;
	domain?: string;
};

type CookieOptions = Pick<
	CookieSerializeOptions,
	'path' | 'sameSite' | 'secure' | 'maxAge' | 'httpOnly' | 'domain'
> & {
	sameSite: 'strict' | 'lax' | 'none';
};

export const SESSION_ID_COOKIE_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_ID_COOKIE_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_EXPIRES_IN_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_JWT_EXPIRES_IN_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_API_ENDPOINT_AGE = 60 * 2;

export const SESSION_ID_COOKIE_OPTIONS: CookieOptions = {
	...(!dev && { domain: APP_DOMAIN }),
	path: '/',
	sameSite: 'strict',
	secure: !dev,
	maxAge: SESSION_ID_COOKIE_STANDARD_AGE,
	httpOnly: true,
};
