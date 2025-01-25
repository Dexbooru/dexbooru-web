import { SALT_ROUNDS } from '$lib/server/constants/auth';
import { MAXIMUM_ARTIST_LENGTH } from '$lib/shared/constants/labels';
import { interleaveStrings } from '$lib/shared/helpers/util';
import bcrypt from 'bcryptjs';
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
