import { TOTP_CHALLENGE_EXPIRY_SECONDS, TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
import type { TTotpChallenge } from '$lib/shared/types/totp';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import {
	BASE32_ENCODED_TOTP_SECRET,
	TOTP_ALGORITHM,
	TOTP_CODE_EXPIRY_TIME_SECONDS,
	TOTP_ISSUER_NAME,
	TOTP_KEY_PREFIX,
	TOTP_QR_CODE_WIDTH,
} from '../constants/totp';
import redis from '../db/redis';

export const generateTotpClient = (username: string) => {
	return new OTPAuth.TOTP({
		issuer: TOTP_ISSUER_NAME,
		label: username,
		digits: TOTP_CODE_LENGTH,
		period: TOTP_CODE_EXPIRY_TIME_SECONDS,
		secret: BASE32_ENCODED_TOTP_SECRET,
		algorithm: TOTP_ALGORITHM,
	});
};

export const generateTotpDataUri = async (username: string) => {
	const userTotp = generateTotpClient(username);
	const rawTotpData = userTotp.toString();
	const totpUri = await QRCode.toDataURL(rawTotpData, {
		width: TOTP_QR_CODE_WIDTH,
	});

	return totpUri;
};

export const isValidOtpCode = (username: string, otpCode: string) => {
	const userTotp = generateTotpClient(username);
	const validationResult = userTotp.validate({
		token: otpCode,
	});

	return validationResult !== null;
};

export const deleteTotpChallenge = async (challengeId: string) => {
	const challengeIdKey = `${TOTP_KEY_PREFIX}${challengeId}`;
	return await redis.del(challengeIdKey);
};

export const getTotpChallenge = async (challengeId: string): Promise<TTotpChallenge | null> => {
	const challengeIdKey = `${TOTP_KEY_PREFIX}${challengeId}`;
	const data = await redis.get(challengeIdKey);
	return data ? (JSON.parse(data) as TTotpChallenge) : null;
};

export const createTotpChallenge = async (
	username: string,
	ipAddress: string,
	rememberMe: boolean,
) => {
	const challengeData = {
		username,
		ipAddress,
		rememberMe,
	};

	const challengeId = crypto.randomUUID();
	const challengeIdKey = `${TOTP_KEY_PREFIX}${challengeId}`;

	await redis.set(challengeIdKey, JSON.stringify(challengeData), {
		EX: TOTP_CHALLENGE_EXPIRY_SECONDS,
	});

	return challengeId;
};
