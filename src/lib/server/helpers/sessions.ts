import type { IUser } from '$lib/shared/types/users';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import {
	SESSION_JWT_EXPIRES_IN_STANDARD_AGE,
	SESSION_JWT_EXPIRES_IN_SUPER_AGE
} from '../constants/cookies';
import { JWT_PRIVATE_KEY } from '../constants/sessions';
import { PUBLIC_USER_SELECTORS } from '../constants/users';
import type { TSetHeadersFunction } from '../types/sessions';

const generateUserClaims = (userRecord: Partial<IUser>): Partial<IUser> => {
	const userClaims: Partial<IUser> = {};

	Object.keys(PUBLIC_USER_SELECTORS).forEach((key) => {
		const claimKey = key as keyof IUser;
		if (userRecord[claimKey]) {
			userClaims[claimKey] = userRecord[claimKey] as (string & Date) | undefined;
		}
	});

	return userClaims;
};

export function generateUpdatedUserTokenFromClaims(userClaims: IUser & JwtPayload): string {
	const encodedToken = jwt.sign(userClaims as object, JWT_PRIVATE_KEY, {
		algorithm: 'HS256'
	});
	return encodedToken;
}

export function generateEncodedUserTokenFromRecord(
	userRecord: Partial<IUser>,
	rememberMe: string
): string {
	const userClaims = generateUserClaims(userRecord);
	const encodedToken = jwt.sign(userClaims, JWT_PRIVATE_KEY, {
		algorithm: 'HS256',
		expiresIn:
			rememberMe === 'off' ? SESSION_JWT_EXPIRES_IN_STANDARD_AGE : SESSION_JWT_EXPIRES_IN_SUPER_AGE
	});
	return encodedToken;
}

export function getUserClaimsFromEncodedJWTToken(encodedJwtToken: string): IUser | null {
	try {
		const decodedUserClaims = jwt.verify(encodedJwtToken, JWT_PRIVATE_KEY);
		return (
			typeof decodedUserClaims === 'string' ? JSON.parse(decodedUserClaims) : decodedUserClaims
		) as IUser;
	} catch (error) {
		return null;
	}
}

export function cacheResponse(setHeaders: TSetHeadersFunction, cacheTimeInSeconds: number): void {
	setHeaders({
		'cache-control': `max-age=${cacheTimeInSeconds}`
	});
}
