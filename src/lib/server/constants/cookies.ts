import { dev } from '$app/environment';
import type { SerializeOptions } from 'cookie';

type CookieOptions = Pick<
	SerializeOptions,
	'path' | 'sameSite' | 'secure' | 'maxAge' | 'httpOnly'
> & {
	sameSite: 'strict' | 'lax' | 'none'; // Explicitly define sameSite as a literal type
};

export const SESSION_ID_COOKIE_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_ID_COOKIE_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_EXPIRES_IN_STANDARD_AGE = 60 * 60 * 24 * 7;
export const SESSION_JWT_EXPIRES_IN_SUPER_AGE = 60 * 60 * 24 * 21;
export const SESSION_JWT_API_ENDPOINT_AGE = 60 * 2;

export const SESSION_ID_COOKIE_OPTIONS: CookieOptions = {
	path: '/',
	sameSite: 'strict',
	secure: !dev,
	maxAge: SESSION_ID_COOKIE_STANDARD_AGE,
	httpOnly: true,
};
