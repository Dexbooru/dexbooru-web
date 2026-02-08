import { JWT_PRIVATE_KEY } from '$env/static/private';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import type { TUser } from '$lib/shared/types/users';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import {
	SESSION_JWT_EXPIRES_IN_STANDARD_AGE,
	SESSION_JWT_EXPIRES_IN_SUPER_AGE,
} from '../constants/cookies';
import { JWT_USER_SELECTORS } from '../constants/users';
import redis from '../db/redis';
import type { TSetHeadersFunction } from '../types/sessions';

const generateUserClaims = (userRecord: Partial<TUser>): Record<keyof TUser, unknown> => {
	const userClaims = {} as Record<keyof TUser, unknown>;

	Object.keys(JWT_USER_SELECTORS).forEach((key) => {
		const claimKey = key as keyof TUser;
		if (userRecord[claimKey]) {
			userClaims[claimKey] = userRecord[claimKey];
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
	overrideExpiry?: number,
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
	} catch {
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

export const getRemoteAssociatedKeys = async (key: string) => {
	return await redis.sMembers(key);
};

export const invalidateCacheRemotely = async (key: string) => {
	await redis.del(key);
};

export const invalidateMultipleCachesRemotely = async (keys: string[]) => {
	await Promise.all(keys.map((key) => redis.del(key)));
};

export const cacheToCollectionRemotely = async (key: string, newValue: string) => {
	await redis.sAdd(key, newValue);
};

export const cacheMultipleToCollectionRemotely = async (keys: string[], newValue: string) => {
	await Promise.all(keys.map((key) => redis.sAdd(key, newValue)));
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
