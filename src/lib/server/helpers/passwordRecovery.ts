import { APP_URL } from '$env/static/private';
import { SALT_ROUNDS } from '$lib/server/constants/auth';
import { MAXIMUM_ARTIST_LENGTH } from '$lib/shared/constants/labels';
import bcrypt from 'bcryptjs';
import { ACCOUNT_RECOVERY_EMAIL_TEMPLATE } from '../constants/email';
import { MAXIMUM_SHIFTING_POSITIONS } from '../constants/passwordRecovery';

const caesarCipher = (target: string, shiftingPositions: number): string => {
	let cipheredResult = '';

	for (let i = 0; i < target.length; i++) {
		const currentCharCode = target.charCodeAt(i);
		const cipheredCharCode = (currentCharCode + shiftingPositions) % MAXIMUM_ARTIST_LENGTH;
		cipheredResult += String.fromCharCode(cipheredCharCode);
	}

	return cipheredResult;
};

const interleaveStrings = (a: string, b: string): string => {
	let interleavedResult = '';
	let [i, j, k] = [0, 0, 0];
	const resultLength = a.length + b.length;

	while (k < resultLength && i < a.length && j < b.length) {
		if (k % 2 === 0) {
			interleavedResult += a.charAt(i);
			i++;
		} else {
			interleavedResult += a.charAt(j);
			j++;
		}

		k++;
	}

	while (i < a.length) {
		interleavedResult += a.charCodeAt(i);
		i++;
	}

	while (j < b.length) {
		interleavedResult += b.charCodeAt(j);
		j++;
	}

	return interleavedResult;
};

export const generateRecoveryId = async (
	email: string,
	username: string,
): Promise<{ original: string; hashed: string }> => {
	const interleavedUserLabel = interleaveStrings(username, email);
	const rawRecoveryId = `${interleavedUserLabel}${crypto.randomUUID()}`;
	const shiftingPositions = Math.floor(Math.random() * MAXIMUM_SHIFTING_POSITIONS) + 1;
	const cipheredRawRecoveryId = caesarCipher(rawRecoveryId, shiftingPositions);

	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashedCipheredRecoveryId = await bcrypt.hash(cipheredRawRecoveryId, salt);

	return {
		original: cipheredRawRecoveryId,
		hashed: hashedCipheredRecoveryId,
	};
};

export const buildPasswordRecoveryEmailTemplate = (
	username: string,
	publicAccountRecoveryId: string,
): string => {
	const accountRecoveryLink = new URL(`${APP_URL}/recover-account`);
	accountRecoveryLink.searchParams.append('id', publicAccountRecoveryId);

	return ACCOUNT_RECOVERY_EMAIL_TEMPLATE.replaceAll('{{username}}', username).replaceAll(
		'{{accountRecoveryLink}}',
		accountRecoveryLink.href,
	);
};
