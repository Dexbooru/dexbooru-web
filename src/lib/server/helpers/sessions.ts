import { JWT_PRIVATE_KEY } from '$env/static/private';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import type { TUser } from '$lib/shared/types/users';
import type { $Enums } from '@prisma/client';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import {
	SESSION_JWT_EXPIRES_IN_STANDARD_AGE,
	SESSION_JWT_EXPIRES_IN_SUPER_AGE,
} from '../constants/cookies';
import { PUBLIC_USER_SELECTORS } from '../constants/users';
import redis from '../db/redis';
import type { TSetHeadersFunction } from '../types/sessions';

const generateUserClaims = (userRecord: Partial<TUser>): Partial<TUser> => {
	const userClaims: Partial<TUser> = {};

	Object.keys(PUBLIC_USER_SELECTORS).forEach((key) => {
		const claimKey = key as keyof TUser;
		if (userRecord[claimKey]) {
			userClaims[claimKey] = userRecord[claimKey] as string | Date | undefined | $Enums.UserRole | (string & Date);
		}
	});

	return userClaims;
};

export function generateUpdatedUserTokenFromClaims(userClaims: TUser & JwtPayload): string {
	const encodedToken = jwt.sign(userClaims as object, JWT_PRIVATE_KEY, {
		algorithm: 'HS256',
	});
	return encodedToken;
}

export function generateEncodedUserTokenFromRecord(
	userRecord: Partial<TUser>,
	rememberMe: boolean,
	overrideExpiry?: string,
): string {
	const userClaims = generateUserClaims(userRecord);
	const tokenExpiry =
		overrideExpiry ??
		(rememberMe ? SESSION_JWT_EXPIRES_IN_SUPER_AGE : SESSION_JWT_EXPIRES_IN_STANDARD_AGE);

	const encodedToken = jwt.sign(userClaims, JWT_PRIVATE_KEY, {
		algorithm: 'HS256',
		expiresIn: tokenExpiry,
	});
	return encodedToken;
}

export function getUserClaimsFromEncodedJWTToken(encodedJwtToken: string): TUser | null {
	try {
		const decodedUserClaims = jwt.verify(encodedJwtToken, JWT_PRIVATE_KEY);
		return (
			typeof decodedUserClaims === 'string' ? JSON.parse(decodedUserClaims) : decodedUserClaims
		) as TUser;
	} catch (error) {
		return null;
	}
}

export const getRemoteResponseFromCache = async <T>(key: string): Promise<T | null> => {
	const cachedResponse = await redis.get(key);
	if (cachedResponse) {
		const parsedData = JSON.parse(cachedResponse);
		return convertDataStructureToIncludeDatetimes(parsedData) as T;
	}
	return null;
};

export const invalidateCacheRemotely = async (key: string) => {
	await redis.del(key);
};

export const cacheResponseRemotely = async (
	key: string,
	value: unknown,
	expiryTimeSeconds: number,
) => {
	await redis.set(key, JSON.stringify(value), {
		EX: expiryTimeSeconds,
	});
};

export function cacheResponse(setHeaders: TSetHeadersFunction, cacheTimeInSeconds: number): void {
	setHeaders({
		'cache-control': `max-age=${cacheTimeInSeconds}`,
	});
}
