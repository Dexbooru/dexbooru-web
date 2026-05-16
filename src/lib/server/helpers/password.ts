import { SALT_ROUNDS } from '$lib/server/constants/auth';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashedPassword = await bcrypt.hash(password, salt);
	return hashedPassword;
};

export const doPasswordsMatch = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};

/** Printable ASCII 33–126 (94 chars). Slight bias from modulo is acceptable for ephemeral passwords. */
export const generateRandomPassword = (passwordSize: number): string => {
	const bytes = new Uint8Array(passwordSize);
	crypto.getRandomValues(bytes);
	let generatedPassword = '';
	for (let i = 0; i < passwordSize; i++) {
		generatedPassword += String.fromCharCode(33 + (bytes[i]! % 94));
	}
	return generatedPassword;
};
