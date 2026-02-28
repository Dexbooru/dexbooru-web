import type { SerializeOptions } from 'cookie';
import {
	SESSION_ID_COOKIE_OPTIONS,
	SESSION_ID_COOKIE_STANDARD_AGE,
	SESSION_ID_COOKIE_SUPER_AGE,
} from '../constants/cookies';

export const buildCookieOptions = (rememberMe: boolean): SerializeOptions => {
	return {
		path: '/',
		...SESSION_ID_COOKIE_OPTIONS,
		maxAge: rememberMe ? SESSION_ID_COOKIE_SUPER_AGE : SESSION_ID_COOKIE_STANDARD_AGE,
	};
};
