import {
	SESSION_ID_COOKIE_OPTIONS,
	SESSION_ID_COOKIE_STANDARD_AGE,
	SESSION_ID_COOKIE_SUPER_AGE,
} from '../constants/cookies';
import type { CookieSerializeOptions } from 'cookie';

export const buildCookieOptions = (rememberMe: boolean): CookieSerializeOptions => {
	return {
		...SESSION_ID_COOKIE_OPTIONS,
		maxAge: rememberMe ? SESSION_ID_COOKIE_SUPER_AGE : SESSION_ID_COOKIE_STANDARD_AGE,
	};
};
